document.addEventListener("DOMContentLoaded", () => {
    const trackForm = document.getElementById("trackForm");

    if (trackForm) {
        trackForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("appId").value.trim();
            const identifier = document.getElementById("identifier").value.trim();
            const resDiv = document.getElementById("result");

            resDiv.style.display = "block";
            resDiv.innerHTML = "Checking...";
            resDiv.className = "status-result"; // reset

            try {
                const res = await fetch(`/api/application/status?id=${encodeURIComponent(id)}&identifier=${encodeURIComponent(identifier)}`);
                const data = await res.json();

                if (data.ok) {
                    let badgeClass = data.status || 'draft';
                    if (data.status === 'payment_pending') badgeClass = 'payment_pending';

                    let html = `
             <h3 style="margin:0 0 5px;">${data.fullName}</h3>
             <div class="status-badge ${badgeClass}">${data.status.replace('_', ' ')}</div>
             <p style="font-size:0.9rem; color:#666;">Application ID: ${data.prettyId}</p>
           `;

                    if (data.status === 'payment_pending') {
                        html += `
                <div style="margin-top:15px;">
                  <p style="color:#d35400; font-size:0.9rem;">Payment verification is pending. If you haven't paid, please proceed.</p>
                  <a href="/payment.html?id=${data.prettyId}" class="btn-primary" style="display:inline-block; text-decoration:none; font-size:0.9rem;">Complete Payment</a>
                </div>
              `;
                    }

                    resDiv.innerHTML = html;
                } else {
                    resDiv.innerHTML = `<span style="color:red">Record not found. Please check your details.</span>`;
                }
            } catch (err) {
                console.error("Status check error:", err);
                resDiv.innerHTML = `<span style="color:red">Server error. Try again later.</span>`;
            }
        });
    }

    // Auto-fill ID from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("id")) {
        const appIdInput = document.getElementById("appId");
        if (appIdInput) appIdInput.value = urlParams.get("id");
    }
});
