require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const Subscriber = require('./models/Subscriber');

const app = express();
const PORT = process.env.PORT || 5000;
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://admin:Admin%40123@cluster0.hr47sc6.mongodb.net/orizons_v3?appName=Cluster0';

// ==========================================
// SERVERLESS DB CONNECTION CACHE
// ==========================================
let clientPromise = null;

function getDBClient() {
    if (!clientPromise) {
        clientPromise = mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 30000,
            family: 4,
        }).then(m => {
            console.log('[OK] ORIZONS DATABASE CONNECTED');
            return m.connection.getClient();
        }).catch(err => {
            clientPromise = null;
            console.error('[ERROR] DB INIT:', err.message);
            throw err;
        });
    }
    return clientPromise;
}

// Warm up connection on cold start
getDBClient().catch(() => {});

// ==========================================
// 1. CORE MIDDLEWARE
// ==========================================
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// Ensure DB is connected before every request
app.use(async (req, res, next) => {
    try {
        await getDBClient();
        next();
    } catch (err) {
        console.error('[ERROR] DB not ready:', err.message);
        next(err);
    }
});

// ==========================================
// 2. SESSION ENGINE
// ==========================================
app.use(session({
    name: 'orizons.sid',
    secret: process.env.SESSION_SECRET || 'arch_secret_orizons_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        clientPromise: getDBClient(),
        ttl: 86400,
        autoRemove: 'native'
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

// ==========================================
// 1.5 MONGOOSE DATA MODELS
// ==========================================
const inquirySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    type: String,
    budget: String,
    notes: String,
    submittedAt: { type: Date, default: Date.now }
});
const Inquiry = mongoose.model('Inquiry', inquirySchema, 'clientdatas');

app.get('/api/check-db', async (req, res) => {
    try {
        const allLeads = await Inquiry.find({});
        res.json({ connected: true, readyState: mongoose.connection.readyState, count: allLeads.length });
    } catch (err) {
        res.status(500).json({ connected: false, error: err.message, readyState: mongoose.connection.readyState });
    }
});

const noStore = (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
};

// ==========================================
// 3. SECURITY GATEKEEPER
// ==========================================
const protectClientPortal = (req, res, next) => {
    if (req.session && req.session.isAuthenticated) return next();
    return res.redirect('/admin/admin.html');
};

app.use('/admin', noStore);
app.use('/client-portal', noStore);

const frontendDirCandidates = [
    path.join(__dirname, '../frontend'),
    path.join(__dirname, 'frontend'),
    path.join(process.cwd(), 'frontend')
];
const frontendDir = frontendDirCandidates.find(c => fs.existsSync(path.join(c, 'index.html')));

if (frontendDir) {
    app.use(express.static(frontendDir));
    console.log(`[INFO] Frontend static directory mapped: ${frontendDir}`);
}

const frontendPageRoutes = ['/', '/index.html', '/privacy.html', '/about/about.html',
    '/services/services.html', '/solar/solar.html', '/contact/contact.html', '/blog/index.html'];

app.get(frontendPageRoutes, (req, res, next) => {
    if (frontendDir) {
        const p = req.path === '/' ? 'index.html' : req.path.replace(/^\/+/, '');
        const filePath = path.join(frontendDir, p);
        if (fs.existsSync(filePath)) return res.sendFile(filePath);
    }
    next();
});

// ==========================================
// 4. ADMIN LOGIN
// ==========================================
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        if (username === 'Orizons') {
            const isMatch = await bcrypt.compare(password, '$2b$10$qYTkmTzn3cIndtFogJ7RiOO3tToULUns2XMvIQ0c2R3n/UFBLsTsu');
            if (isMatch) {
                return req.session.regenerate((err) => {
                    if (err) return res.status(500).json({ success: false, error: 'SESSION_INIT_FAILED' });
                    req.session.isAuthenticated = true;
                    return req.session.save((saveErr) => {
                        if (saveErr) return res.status(500).json({ success: false, error: 'SESSION_SAVE_FAILED' });
                        res.json({ success: true });
                    });
                });
            }
        }
        return res.status(401).json({ success: false, error: 'AUTH_FAILED' });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
});

// ==========================================
// 4.5 LOGOUT
// ==========================================
app.post('/api/admin/logout', (req, res) => {
    if (!req.session) {
        res.clearCookie('orizons.sid', { path: '/' });
        return res.json({ success: true });
    }
    return req.session.destroy((err) => {
        res.clearCookie('orizons.sid', { path: '/' });
        if (err) return res.status(500).json({ success: false });
        return res.json({ success: true, message: 'VAULT_LOCKED' });
    });
});

// ==========================================
// 4.6 AUTH CHECK
// ==========================================
app.get('/api/check-auth', noStore, (req, res) => {
    if (req.session && req.session.isAuthenticated)
        return res.status(200).json({ authenticated: true });
    return res.status(401).json({ authenticated: false });
});

// ==========================================
// 5. DATA PIPELINES
// ==========================================
app.post('/api/contact', async (req, res) => {
    try {
        await new Inquiry(req.body).save();
        return res.json({ success: true, message: 'INQUIRY_SECURED' });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'DATABASE_WRITE_ERROR', details: err.message });
    }
});

app.post('/api/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        if (await Subscriber.findOne({ email }))
            return res.status(400).json({ message: 'Email is already subscribed.' });
        await new Subscriber({ email }).save();
        return res.status(201).json({ message: 'Successfully subscribed!' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// ==========================================
// 6. SERVER LAUNCH
// ==========================================
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`[STARTED] ORIZONS ENGINE: http://localhost:${PORT}`));
}

module.exports = app;
