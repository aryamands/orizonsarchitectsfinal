document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. CINEMATIC ENTRANCE ANIMATION
    // ==========================================
    const tl = gsap.timeline();
    
    tl.from(".admin-nav", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".form-header", { y: 20, opacity: 0, duration: 0.8 }, "-=0.4")
      .from(".header-line", { scaleX: 0, transformOrigin: "left", duration: 1 }, "-=0.4")
      .from(".input-group", { 
          y: 20, 
          opacity: 0, 
          stagger: 0.1, // Waterfall loading effect
          duration: 0.6, 
          ease: "power2.out" 
      }, "-=0.6")
      .from(".btn-sync", { y: 20, opacity: 0, duration: 0.6 }, "-=0.4");

    // ==========================================
    // 2. LEAD DATABASE SYNC LOGIC (REAL PIPELINE)
    // ==========================================
    const form = document.getElementById("lead-entry-form");
    const btn = document.getElementById("sync-btn");
    const statusMsg = document.getElementById("sync-status");

    if (form) {
        form.addEventListener("submit", async (e) => { // <-- Crucial async addition
            e.preventDefault();
            
            // Visual feedback
            btn.innerHTML = "<span>TRANSMITTING TO ATLAS...</span>";
            btn.style.opacity = "0.7";
            btn.disabled = true;

            // Gather the exact data from your HTML inputs
            const leadData = {
                name: document.getElementById("lead-name").value,
                phone: document.getElementById("lead-phone").value,
                email: document.getElementById("lead-email").value,
                type: document.getElementById("lead-source").value,
                budget: document.getElementById("lead-budget").value,
                notes: document.getElementById("lead-notes").value
            };

            try {
                // Send it to your secure Node server
                const response = await fetch("/api/contact", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(leadData)
                });

                const result = await response.json();

                if (result.success) {
                    // Success UI updates
                    btn.innerHTML = "<span>SYNC WITH DATABASE</span>";
                    btn.style.opacity = "1";
                    btn.disabled = false;
                    
                    statusMsg.style.color = "var(--gold-brass)";
                    statusMsg.textContent = "✔ LEAD SECURED IN DATABASE";
                    
                    form.reset();
                    setTimeout(() => statusMsg.textContent = "", 4000);
                } else {
                    throw new Error("Server rejected data");
                }
            } catch (error) {
                // Error handling UI updates
                console.error("Transmission Error:", error);
                btn.innerHTML = "<span>SYNC WITH DATABASE</span>";
                btn.style.opacity = "1";
                btn.disabled = false;
                
                statusMsg.style.color = "red";
                statusMsg.textContent = "✘ DATABASE CONNECTION FAILED";
            }
        });
    }

    // ==========================================
    // 3. SECURE VAULT LOGOUT LOGIC
    // ==========================================
    const logoutBtn = document.querySelector(".exit-link"); // Targeting the top right exit button

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            
            logoutBtn.style.opacity = "0.5";
            logoutBtn.innerHTML = "LOCKING... <span>↗</span>";

            try {
                // Ping the backend to destroy the session
                const response = await fetch("http://localhost:5000/api/admin/logout", {
                    method: "POST",
                    credentials: "include" 
                });

                if (response.ok) {
                    window.location.replace("../admin/admin.html");
                } else {
                    console.error("Logout failed.");
                    logoutBtn.innerHTML = "ERROR <span>↗</span>";
                }
            } catch (error) {
                console.error("Network error during logout:", error);
            }
        });
    }
});