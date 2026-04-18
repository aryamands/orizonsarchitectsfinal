/* ORIZONS V3: MASTER UI/UX & SECURITY ENGINE 
    Project: Architectural Portfolio (Mumbai/Jaipur)
    Dependencies: GSAP 3.12.2, ScrollTrigger
*/

document.addEventListener("DOMContentLoaded", () => {
    // 1. ENGINE INITIALIZATION
    if (typeof gsap !== "undefined") {
        gsap.registerPlugin(ScrollTrigger);
    }

    // ==========================================
    // 2. ARCHITECTURAL CUSTOM CURSOR
    // ==========================================
    const cursor = document.querySelector(".custom-cursor");
    const follower = document.querySelector(".cursor-follower");

    if (cursor && follower) {
        window.addEventListener("mousemove", (e) => {
            gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1 });
            gsap.to(follower, {
                x: e.clientX - 16, y: e.clientY - 16,
                duration: 0.6, ease: "power2.out"
            });
        });

        // Hover States for Interactive Elements
        const interactives = document.querySelectorAll("a, button, input, select, textarea, .flex-item");
        interactives.forEach(el => {
            el.addEventListener("mouseenter", () => {
                gsap.to(follower, { scale: 1.8, borderColor: "var(--gold-brass)", backgroundColor: "rgba(197, 160, 189, 0.05)", duration: 0.3 });
                gsap.to(cursor, { scale: 0, duration: 0.3 });
            });
            el.addEventListener("mouseleave", () => {
                gsap.to(follower, { scale: 1, borderColor: "var(--blueprint)", backgroundColor: "transparent", duration: 0.3 });
                gsap.to(cursor, { scale: 1, duration: 0.3 });
            });
        });
    }

    // ==========================================
    // 3. SECURE ADMIN AUTHENTICATION
    // ==========================================
    const adminForm = document.getElementById("admin-login-form");
    if (adminForm) {
        adminForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const errorMsg = document.getElementById("login-error");
            const btn = adminForm.querySelector("button");
            
            btn.textContent = "VERIFYING...";
            btn.disabled = true;

            const credentials = {
                username: document.getElementById("admin-user").value,
                password: document.getElementById("admin-pass").value
            };

            try {
                const res = await fetch("http://localhost:5000/api/admin/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(credentials)
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    window.location.href = "../client-portal/client.html";
                } else {
                    // Shake the card on failure
                    gsap.to(".auth-card", { x: 10, repeat: 5, yoyo: true, duration: 0.05 });
                    errorMsg.textContent = "INVALID ARCHITECT CREDENTIALS";
                    btn.textContent = "AUTHENTICATE";
                    btn.disabled = false;
                }
            } catch (err) {
                errorMsg.textContent = "SECURITY SERVER OFFLINE";
                btn.disabled = false;
            }
        });
    }

    // ==========================================
    // 4. CINEMATIC PAGE REVEALS (GSAP)
    // ==========================================
    if (typeof gsap !== "undefined") {
        // Section Entrance
        gsap.utils.toArray("section, footer").forEach(section => {
            gsap.from(section, {
                scrollTrigger: { trigger: section, start: "top 90%" },
                y: 40, opacity: 0, duration: 1.5, ease: "power4.out"
            });
        });

        // Contact Page Split Animation
        if (document.querySelector(".contact-split-grid")) {
            const tl = gsap.timeline();
            tl.from(".contact-details-panel", { x: -60, opacity: 0, duration: 1.2 })
              .from(".contact-form-panel", { x: 60, opacity: 0, duration: 1.2 }, "-=0.8");
        }
    }

    // ==========================================
    // 5. DATA PIPELINES (FORMS)
    // ==========================================
    const contactForm = document.getElementById("premium-contact-form");
    if (contactForm) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const status = document.getElementById("form-status");
            const submitBtn = document.getElementById("submit-btn");

            submitBtn.innerHTML = "<span>TRANSMITTING...</span>";
            
            const payload = {
                name: document.getElementById("name").value,
                email: document.getElementById("email").value,
                type: document.getElementById("type").value,
                budget: document.getElementById("budget").value,
                notes: document.getElementById("notes")?.value || ""
            };

            try {
                const res = await fetch("http://localhost:5000/api/contact", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    status.textContent = "INQUIRY SECURED.";
                    contactForm.reset();
                }
            } catch (err) { status.textContent = "CONNECTION ERROR."; }
            finally { submitBtn.innerHTML = "<span>REQUEST CONSULTATION</span>"; }
        });
    }

    // Newsletter Integration
    const newsForm = document.getElementById("newsletter-form");
    if (newsForm) {
        newsForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("news-email").value;
            try {
                const res = await fetch("http://localhost:5000/api/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email })
                });
                if (res.ok) {
                    document.getElementById("news-status").textContent = "CONFIRMED.";
                    newsForm.reset();
                }
            } catch (err) { console.error("Newsletter error"); }
        });
    }

    // ==========================================
    // 6. CINEMATIC SOCIAL HOVERS
    // ==========================================
    const brands = { ig: "#E1306C", li: "#0077B5", yt: "#FF0000", fb: "#1877F2" };
    Object.keys(brands).forEach(key => {
        const icon = document.querySelector(`.social-circle.${key}, .social-icon.${key}`);
        if (icon) {
            icon.addEventListener("mouseenter", () => {
                gsap.to(icon, { backgroundColor: brands[key], borderColor: brands[key], y: -8, duration: 0.4 });
            });
            icon.addEventListener("mouseleave", () => {
                gsap.to(icon, { backgroundColor: "transparent", borderColor: "rgba(143, 163, 187, 0.2)", y: 0, duration: 0.4 });
            });
        }
    });

    // 7. STICKY NAV REFINEMENT
    const nav = document.getElementById("main-nav");
    window.addEventListener("scroll", () => {
        if (window.scrollY > 80) nav?.classList.add("scrolled");
        else nav?.classList.remove("scrolled");
    });
});