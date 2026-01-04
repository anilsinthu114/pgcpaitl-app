document.addEventListener("DOMContentLoaded", () => {
    // 1. Clear Form Storage (moved from clear-storage.js for consolidation, or keep separate)
    Object.keys(localStorage).forEach(k => {
        if (k.startsWith("pgcForm_") || k.startsWith("payment_")) {
            localStorage.removeItem(k);
        }
    });

    // 2. Setup Secure Payment Button
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || params.get('application_id');
    const btnSecurePay = document.getElementById('btnSecurePay');

    if (btnSecurePay) {
        if (id) {
            btnSecurePay.href = `/course-fee.html?id=${encodeURIComponent(id)}`;
        } else {
            // Fallback: If no ID, disable or point to status check
            console.warn("No Application ID found in URL. Payment link may not work.");
            btnSecurePay.href = "/check-status.html";
            btnSecurePay.onclick = (e) => {
                if (!confirm("Application ID missing. Please check your status to retrieve your ID first.")) {
                    e.preventDefault();
                }
            };
        }
    }
});
