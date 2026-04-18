require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const Subscriber = require('./models/Subscriber');

const app = express();
const PORT = process.env.PORT || 5000;
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://admin:Admin%40123@cluster0.hr47sc6.mongodb.net/orizons_v3?appName=Cluster0';
const SECRET = process.env.SESSION_SECRET || 'arch_secret_orizons_2026';
const AUTH_COOKIE = 'orizons.auth';

// ==========================================
// STATELESS AUTH (HMAC-SIGNED COOKIE)
// No MongoDB needed — works on any serverless instance
// ==========================================
function createAuthToken() {
    const payload = JSON.stringify({ auth: true, ts: Date.now() });
    const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    return Buffer.from(payload).toString('base64') + '.' + sig;
}

function verifyAuthToken(token) {
    if (!token) return false;
    try {
        const dot = token.lastIndexOf('.');
        const enc = token.slice(0, dot);
        const sig = token.slice(dot + 1);
        const payload = Buffer.from(enc, 'base64').toString();
        const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
        if (sig !== expected) return false;
        const { auth, ts } = JSON.parse(payload);
        return auth === true && Date.now() - ts < 86400000;
    } catch { return false; }
}

const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 86400000,
    path: '/'
};

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
            console.error('[ERROR] DB:', err.message);
            throw err;
        });
    }
    return clientPromise;
}

getDBClient().catch(() => {});

// ==========================================
// 1. CORE MIDDLEWARE
// ==========================================
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

// Ensure DB connected before data routes
app.use(async (req, res, next) => {
    try { await getDBClient(); next(); }
    catch (err) { next(err); }
});

// ==========================================
// 1.5 MONGOOSE DATA MODELS
// ==========================================
const inquirySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    type: String, budget: String, notes: String,
    submittedAt: { type: Date, default: Date.now }
});
const Inquiry = mongoose.model('Inquiry', inquirySchema, 'clientdatas');

app.get('/api/check-db', async (req, res) => {
    try {
        const count = await Inquiry.countDocuments();
        res.json({ connected: true, readyState: mongoose.connection.readyState, count });
    } catch (err) {
        res.status(500).json({ connected: false, error: err.message });
    }
});

// ==========================================
// 2. STATIC FILES & ROUTES
// ==========================================
const noStore = (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
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
// 3. ADMIN LOGIN / LOGOUT / AUTH CHECK
// ==========================================
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        if (username === 'Orizons') {
            const isMatch = await bcrypt.compare(password, '$2b$10$qYTkmTzn3cIndtFogJ7RiOO3tToULUns2XMvIQ0c2R3n/UFBLsTsu');
            if (isMatch) {
                res.cookie(AUTH_COOKIE, createAuthToken(), cookieOpts);
                return res.json({ success: true });
            }
        }
        return res.status(401).json({ success: false, error: 'AUTH_FAILED' });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
});

app.post('/api/admin/logout', (req, res) => {
    res.clearCookie(AUTH_COOKIE, { path: '/', secure: cookieOpts.secure, sameSite: cookieOpts.sameSite });
    return res.json({ success: true, message: 'VAULT_LOCKED' });
});

app.get('/api/check-auth', noStore, (req, res) => {
    if (verifyAuthToken(req.cookies?.[AUTH_COOKIE]))
        return res.status(200).json({ authenticated: true });
    return res.status(401).json({ authenticated: false });
});

// ==========================================
// 4. DATA PIPELINES
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
// 5. SERVER LAUNCH
// ==========================================
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`[STARTED] ORIZONS ENGINE: http://localhost:${PORT}`));
}

module.exports = app;
