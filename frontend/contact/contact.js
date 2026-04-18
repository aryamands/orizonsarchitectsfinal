// frontend/contact/contact.js

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("premium-contact-form");
    const statusDiv = document.getElementById("form-status");
    const submitBtn = document.getElementById("submit-btn");

    const API_URL = "http://localhost:5000/api/contact";

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        submitBtn.textContent = "Processing Request...";
        submitBtn.disabled = true;
        statusDiv.textContent = "";

        const payload = {
            name: document.getElementById("name").value.trim(),
            phone: document.getElementById("phone").value.trim(), // Added field
            email: document.getElementById("email").value.trim(),
            projectType: document.getElementById("type").value,
            budgetRange: document.getElementById("budget").value
        };

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                statusDiv.style.color = "var(--navy-deep)";
                statusDiv.textContent = "Inquiry received. We will contact you shortly.";
                form.reset();
            } else {
                statusDiv.style.color = "red";
                statusDiv.textContent = data.error || "Submission failed.";
            }
        } catch (error) {
            statusDiv.style.color = "red";
            statusDiv.textContent = "Server connection error.";
        } finally {
            submitBtn.textContent = "Request Consultation";
            submitBtn.disabled = false;
        }
    });
});