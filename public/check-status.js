document.addEventListener("DOMContentLoaded", () => {
    const trackForm = document.getElementById("trackForm");
    const resultMsg = document.getElementById("resultMsg");
    const searchPanel = document.getElementById("searchPanel");
    const dashboardPanel = document.getElementById("dashboardPanel");

    // Auto-fill ID from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("id")) {
        const appIdInput = document.getElementById("appId");
        if (appIdInput) appIdInput.value = urlParams.get("id");
    }

    if (trackForm) {
        trackForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("appId").value.trim();
            const identifier = document.getElementById("identifier").value.trim();

            if (resultMsg) {
                resultMsg.textContent = "Checking records...";
                resultMsg.style.color = "#004c97";
            }

            try {
                const res = await fetch(`/api/application/status?id=${encodeURIComponent(id)}&identifier=${encodeURIComponent(identifier)}`);
                const data = await res.json();

                if (data.ok) {
                    // Hide Search, Show Dashboard
                    if (searchPanel) searchPanel.style.display = "none";
                    if (dashboardPanel) dashboardPanel.style.display = "grid";

                    // Render Profile
                    renderProfile(data.app, data.timeline);

                    // Render Timeline
                    renderTimeline(data.timeline, data.app.id);

                } else {
                    if (resultMsg) {
                        resultMsg.textContent = data.error || "Record not found.";
                        resultMsg.style.color = "red";
                    }
                }
            } catch (err) {
                console.error("Status check error", err);
                if (resultMsg) {
                    resultMsg.textContent = "Server error. Please try again later.";
                    resultMsg.style.color = "red";
                }
            }
        });
    }

    function renderProfile(app, timeline) {
        if (document.getElementById("profileName")) document.getElementById("profileName").innerText = app.fullName;
        if (document.getElementById("profileId")) document.getElementById("profileId").innerText = `ID: ${app.id}`;
        if (document.getElementById("profileEmail")) document.getElementById("profileEmail").innerText = app.email;
        if (document.getElementById("profileMobile")) document.getElementById("profileMobile").innerText = app.mobile;
        if (document.getElementById("profileCourse")) document.getElementById("profileCourse").innerText = app.course || "PGCPAITL";

        // Overall Status Badge
        const badge = document.createElement("span");
        badge.className = `status-badge ${app.status || 'draft'}`;
        badge.innerText = (app.status || 'draft').replace('_', ' ');
        badge.style.marginTop = "10px";
        badge.style.display = "inline-block";
        const badgeContainer = document.getElementById("statusBadgeContainer");
        if (badgeContainer) {
            badgeContainer.innerHTML = "";
            badgeContainer.appendChild(badge);
        }
    }

    function renderTimeline(timeline, prettyId) {
        const container = document.getElementById("timelineContainer");
        if (!container) return;

        container.innerHTML = "";

        // Convert object to array for easier iteration
        const steps = [
            timeline.step1,
            timeline.step2,
            timeline.step3,
            timeline.step4,
            timeline.step5
        ];

        steps.forEach((step, index) => {
            if (!step) return;

            const item = document.createElement("div");
            item.className = `timeline-item ${step.status}`;

            // Icon
            let icon = "⚪"; // pending
            if (step.status === 'completed') icon = "✅";
            if (step.status === 'in_progress') icon = "⏳";

            // Custom status text for in_progress
            let extraStatus = "";
            if (step.status === 'in_progress' && !step.details.toLowerCase().includes('verified')) {
                if (index === 1 || index === 3) extraStatus = `<div style="color:#d35400; font-size:0.85rem; margin-top:5px;">Verification Pending</div>`;
                if (index === 4) extraStatus = `<div style="color:#2980b9; font-size:0.85rem; margin-top:5px;">Documents Received</div>`;
            }

            item.innerHTML = `
                <div class="time-icon">${icon}</div>
                <div class="time-content">
                    <div class="time-header">
                        <span class="time-title">${step.label}</span>
                        ${step.date ? `<span class="time-date">${new Date(step.date).toLocaleDateString()}</span>` : ''}
                    </div>
                    <div class="time-desc">${step.details}</div>
                    ${extraStatus}
                    ${getActionButtons(index + 1, step, prettyId, timeline)}
                </div>
            `;

            container.appendChild(item);
        });
    }

    function getActionButtons(stepNum, stepObj, prettyId, timeline) {
        // Step 2: Registration Fee
        if (stepNum === 2) {
            // If Course Fee (Step 4) is completed/verified, hide Reg Fee button!
            if (timeline.step4 && timeline.step4.status === 'completed') return "";

            if (stepObj.status === 'pending') {
                return `<div style="margin-top:10px;">
                    <a href="/payment.html?id=${prettyId}" class="btn-sm">Pay Registration Fee</a>
                </div>`;
            }
        }

        // Step 4: Course Fee
        if (stepNum === 4 && stepObj.status === 'pending' && stepObj.details !== "Waiting for Request") {
            return `<div style="margin-top:10px;">
                <a href="/course-fee.html?id=${prettyId}" class="btn-sm">Pay Course Fee</a>
            </div>`;
        }

        // Step 5: Documents
        if (stepNum === 5 && stepObj.status === 'pending') {
            return `<div style="margin-top:10px;">
                <a href="/upload-documents.html?id=${prettyId}" class="btn-sm">Upload Documents</a>
            </div>`;
        }

        return "";
    }
});

// Add dynamic CSS for timeline if not present
const style = document.createElement('style');
style.innerHTML = `
.timeline-container { position: relative; padding-left: 20px; }
.timeline-item { position: relative; padding-bottom: 30px; display: flex; gap: 15px; }
.timeline-item:last-child { padding-bottom: 0; }
.timeline-item::before {
    content: ''; position: absolute; left: 11px; top: 30px; bottom: 0; width: 2px; background: #e0e0e0;
}
.timeline-item:last-child::before { display: none; }
.time-icon { font-size: 1.5rem; background:white; z-index:2; position:relative; }
.time-content { background: #f9f9f9; padding: 15px; border-radius: 8px; width: 100%; border: 1px solid #eee; }
.timeline-item.completed .time-content { border-left: 4px solid #2ecc71; }
.timeline-item.in_progress .time-content { border-left: 4px solid #f39c12; }
.timeline-item.pending .time-content { border-left: 4px solid #bdc3c7; }
.time-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
.time-title { font-weight: bold; color: #333; }
.time-date { font-size: 0.8rem; color: #888; }
.time-desc { font-size: 0.9rem; color: #666; }
.btn-sm { 
    background: #004c97; color: white; padding: 6px 14px; 
    border-radius: 4px; text-decoration: none; font-size: 0.85rem; display:inline-block;
}
.btn-sm:hover { background: #003366; }
`;
document.head.appendChild(style);
