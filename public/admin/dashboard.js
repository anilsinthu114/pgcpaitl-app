// =====================
// AUTH CHECK
// =====================
const token = localStorage.getItem("adminToken");
if (!token) {
  window.location.href = "/admin/login.html";
}

// helper
async function fetchWithAuth(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      ...options.headers
    }
  });
}

// =====================
// ON PAGE READY
// =====================
document.addEventListener("DOMContentLoaded", () => {

  // Logout button (CSP-safe)
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  // Modal action buttons (CSP-safe)
  const approveBtn = document.getElementById("approveBtn");
  const reviewBtn = document.getElementById("reviewBtn");
  const rejectBtn = document.getElementById("rejectBtn");
  const closeBtn = document.getElementById("closeModalBtn");

  approveBtn?.addEventListener("click", () => updateStatus("accepted"));
  reviewBtn?.addEventListener("click", () => updateStatus("reviewing"));
  rejectBtn?.addEventListener("click", () => updateStatus("rejected"));
  closeBtn?.addEventListener("click", closeModal);

  // View Toggle Logic
  const tableBtn = document.getElementById("viewTableBtn");
  const gridBtn = document.getElementById("viewGridBtn");
  const tableContainer = document.getElementById("appsTableContainer");
  const gridContainer = document.getElementById("appsGrid");

  if (tableBtn && gridBtn) {
    tableBtn.addEventListener("click", () => {
      tableBtn.classList.add("active");
      tableBtn.style.background = "#003366"; tableBtn.style.color = "white"; // Force active style
      gridBtn.classList.remove("active");
      gridBtn.style.background = "white"; gridBtn.style.color = "#333";

      tableContainer.style.display = "block";
      gridContainer.style.display = "none";
    });

    gridBtn.addEventListener("click", () => {
      gridBtn.classList.add("active");
      gridBtn.style.background = "#003366"; gridBtn.style.color = "white";
      tableBtn.classList.remove("active");
      tableBtn.style.background = "white"; tableBtn.style.color = "#333";

      tableContainer.style.display = "none";
      gridContainer.style.display = "grid";
    });
  }

  // Expose functions to global scope for inline onclick handlers
  window.viewApplication = viewApplication;
  window.loadApplications = loadApplications;

  loadApplications();
});

// =====================
// LOAD APPLICATIONS
// =====================
async function loadApplications() {
  const res = await fetchWithAuth("/api/admin/applications");
  const data = await res.json();

  if (!data.ok) {
    document.getElementById("loading").innerText = "Failed to load data.";
    return;
  }

  const apps = data.items;
  const tableBody = document.getElementById("appsBody");
  const gridContainer = document.getElementById("appsGrid");
  const table = document.getElementById("appsTable");

  document.getElementById("loading").style.display = "none";
  // table.style.display = "table"; // Controlled by toggle now


  // =====================
  // REALISTIC STATS CALCULATION
  // =====================
  const total = apps.length;

  // 1. Submitted & Verified: Status IS submitted AND Payment Verified
  const submitted = apps.filter(a => a.status === "submitted" && a.payment_status === "verified").length;

  // 2. Payment Pending: Status IS payment_pending OR (Status submitted but payment NOT verified)
  const pending = apps.filter(a =>
    a.status === "payment_pending" ||
    (a.status === "submitted" && a.payment_status !== "verified")
  ).length;

  // 3. Under Review: Payment UPloaded but not yet Accepted/Rejected
  const reviewing = apps.filter(a =>
    a.payment_status === "uploaded" &&
    a.status !== "accepted" &&
    a.status !== "rejected"
  ).length;

  // 4. Approved
  const accepted = apps.filter(a => a.status === "accepted").length;

  // 5. Rejected
  const rejected = apps.filter(a => a.status === "rejected").length;


  document.getElementById("totalApps").innerText = total;
  document.getElementById("submittedApps").innerText = submitted;
  document.getElementById("pendingApps").innerText = pending;
  document.getElementById("reviewingApps").innerText = reviewing;
  document.getElementById("acceptedApps").innerText = accepted;
  document.getElementById("rejectedApps").innerText = rejected;


  tableBody.innerHTML = "";
  gridContainer.innerHTML = "";

  apps.forEach(app => {
    const payStatus = app.payment_status || "Pending";

    // CORE LOGIC FOR UI STATUS
    let loopDisplayStatus = app.status;
    let badgeClass = app.status;

    // Override Logic for UI Clarity & Consistency

    // 0. If Payment Rejected -> Show "Payment Rejected"
    if (payStatus === 'rejected') {
      loopDisplayStatus = 'Payment Rejected';
      badgeClass = 'rejected';
    }
    // 1. If Payment is Pending (and not rejected) -> Show "Pay Pending"
    else if (payStatus !== 'verified' && payStatus !== 'uploaded') {
      loopDisplayStatus = 'Pay Pending';
      badgeClass = 'payment_pending';
    }
    // 2. If Payment Uploaded -> Under Review (unless already decided)
    else if (payStatus === 'uploaded' && app.status !== 'accepted' && app.status !== 'rejected') {
      loopDisplayStatus = 'Under Review';
      badgeClass = 'reviewing';
    }
    // 3. If Payment Verified AND Status is Submitted -> Verified
    else if (app.status === 'submitted' && payStatus === 'verified') {
      loopDisplayStatus = 'Verified';
      badgeClass = 'submitted';
    }

    let remindBtn = "";


    if (payStatus !== 'verified' && payStatus !== 'uploaded') {
      remindBtn = `<button class="btn-sm js-remind-btn" data-id="${app.id}" style="background:#f39c12; color:white; border:none; padding:2px 6px; font-size:11px; margin-left:5px;">Remind</button>`;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${app.id}</td>
      <td>${escapeHtml(app.fullName)}</td>
      <td>${escapeHtml(app.email)}</td>
      <td>${escapeHtml(app.mobile)}</td>
      <td>${escapeHtml(app.degreeLevel)}</td>
      <td><span class="status ${badgeClass}">${loopDisplayStatus}</span></td>
      <td><span class="status ${payStatus === 'verified' ? 'accepted' : (payStatus === 'uploaded' ? 'reviewing' : 'rejected')}">${payStatus}</span></td>
      <td>${new Date(app.created_at).toLocaleDateString()}</td>
      <td>
        <button class="btn-sm js-view-btn" data-id="${app.id}" style="background:var(--primary); color:white; border:none; padding:5px 10px;">View</button>
        ${remindBtn}
      </td>
    `;
    tableBody.appendChild(tr);

    // Grid Item
    const card = document.createElement("div");
    card.className = "app-card";
    card.innerHTML = `
       <div class="card-header" style="border-bottom:1px solid #eee; padding-bottom:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
         <h4 style="margin:0; color:var(--primary);">${escapeHtml(app.fullName)}</h4>
         <span class="status ${badgeClass}" style="font-size:10px;">${loopDisplayStatus}</span>
       </div>
       <div style="font-size:13px; color:#666;">
         <p style="margin:4px 0;"><b>Email:</b> ${escapeHtml(app.email)}</p>
         <p style="margin:4px 0;"><b>Payment:</b> ${payStatus}</p>
         <p style="margin:4px 0;"><b>Applied:</b> ${new Date(app.submitted_at).toLocaleDateString()}</p>
       </div>
       <button class="btn-primary js-view-btn" data-id="${app.id}" style="width:100%; margin-top:10px; background:var(--primary);">View Details</button>
    `;
    gridContainer.appendChild(card);
  });
}


// =====================
// VIEW APPLICATION DETAILS
// =====================
async function viewApplication(id) {
  const res = await fetchWithAuth(`/application/${id}`);
  const data = await res.json();

  if (!data.ok) return alert("Error loading details");

  window.currentAppId = id;

  const app = data.application;
  const files = data.files;
  const payments = data.payments || [];

  const details = document.getElementById("appDetails");

  // Basic Info
  let html = `
    <div class="detail-grid">
      <div><b>Name:</b> ${escapeHtml(app.fullName)}</div>
      <div><b>Email:</b> ${escapeHtml(app.email)}</div>
      <div><b>Mobile:</b> ${escapeHtml(app.mobile)}</div>
      <div><b>Gender:</b> ${app.gender}</div>
      <div><b>Category:</b> ${app.category}</div>
      <div><b>Degree Level:</b> ${escapeHtml(app.degreeLevel)}</div>
      <div><b>Branch:</b> ${escapeHtml(app.branch)}</div>
      <div><b>Passing Year:</b> ${escapeHtml(app.passingYear)}</div>
      <div><b>Passing Percentage:</b> ${escapeHtml(app.passingPercentage)}</div>
      <div><b>CGPA:</b> ${escapeHtml(app.cgpa)}</div>
      <div> <b> College / Institute Name:</b> ${escapeHtml(app.instituteName)}</div>
      <div><b> University:</b> ${escapeHtml(app.university)}</div>
      <div><b>Address:</b> ${escapeHtml(app.address)}</div>
      <div><b>Statement of Purpose:</b> ${escapeHtml(app.sop)}</div>
      <div><b>Status:</b> ${app.status}</div>
    </div>
  `;

  // Payment History Section
  html += `<h3 style="font-size:16px; color:#555; border-bottom:1px solid #eee; padding-bottom:10px; margin-top:20px;">Payment History</h3>`;

  if (payments.length > 0) {
    html += `<table style="width:100%; font-size:13px; margin-bottom:15px; border-collapse:collapse;">
      <thead>
        <tr style="background:#f9f9f9; text-align:left; border-bottom:1px solid #ddd;">
           <th style="padding:8px;">Date</th>
           <th style="padding:8px;">UTR</th>
           <th style="padding:8px;">Status</th>
           <th style="padding:8px;">Proof</th>
           <th style="padding:8px;">Action</th>
        </tr>
      </thead>
      <tbody>`;

    payments.forEach(p => {
      const badge = p.status === 'verified' ? 'accepted' : (p.status === 'uploaded' ? 'reviewing' : 'rejected');
      const action = p.status === 'uploaded'
        ? `<button class="btn-sm js-verify-payment-btn" data-id="${p.id}" style="background:green; padding:4px 8px; font-size:11px;">VERIFY</button>`
        : '';

      const token = localStorage.getItem("adminToken");
      html += `<tr>
         <td style="padding:8px; border-bottom:1px solid #eee;">${new Date(p.uploaded_at).toLocaleDateString()}</td>
         <td style="padding:8px; border-bottom:1px solid #eee;">${escapeHtml(p.utr)}</td>
         <td style="padding:8px; border-bottom:1px solid #eee;"><span class="status ${badge}">${p.status}</span></td>
         <td style="padding:8px; border-bottom:1px solid #eee;">
             <button class="btn-sm js-view-screenshot-btn" data-url="/api/payment/screenshot/${p.id}?token=${token}" style="background:#007bff; color:white; border:none; padding:4px 8px; font-size:11px; cursor:pointer;">View ScreenShot</button>
         </td>
         <td style="padding:8px; border-bottom:1px solid #eee;">${action}</td>
       </tr>`;
    });
    html += `</tbody></table>`;
  } else {
    html += `<p style="color:#777; font-size:13px;">No payments recorded.</p>`;
  }

  details.innerHTML = html;


  // Files Section
  const fileDiv = document.getElementById("appFiles");
  fileDiv.innerHTML = "";

  files.forEach(f => {
    const el = document.createElement("div");
    el.className = "file-item";
    el.innerHTML = `
      <span>${escapeHtml(f.original_name)}</span>
      <button class="download-btn" data-file="${f.id}">Download</button>
    `;
    fileDiv.appendChild(el);
  });

  // Attach file download listeners
  document.querySelectorAll(".download-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const fileId = btn.getAttribute("data-file");
      downloadFile(fileId);
    });
  });

  document.getElementById("detailModal").style.display = "block";
}



/* =====================================================
   TOAST NOTIFICATION UTILS
===================================================== */
function showToast(message, type = 'info') {
  // Icons
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };

  // Container
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Toast Element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
        <span class="toast-icon">${icons[type] || 'ℹ'}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
    `;

  container.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Global Verify Payment Function
window.verifyPayment = async (pid) => {

  const res = await fetchWithAuth(`/admin/payment/${pid}/verify`, { method: "PUT" });
  const data = await res.json();
  if (data.ok) {
    showToast("Payment Verified!", "success");
    viewApplication(window.currentAppId); // Refresh modal
    loadApplications(); // Refresh list
  } else {
    showToast("Error verifying payment", "error");
  }
};

window.sendPaymentReminder = async (e, id) => {
  if (e) e.stopPropagation();
  if (!confirm("Send 'Payment Pending' email reminder to this applicant?")) return;

  const btn = e ? e.target : null;
  if (btn) { btn.innerText = "Sending..."; btn.disabled = true; }

  const res = await fetchWithAuth(`/api/admin/application/${id}/remind-payment`, { method: "POST" });
  const data = await res.json();

  if (data.ok) {
    showToast("Reminder Sent Successfully!", "success");
  } else {
    showToast("Error: " + (data.error || "Failed to send"), "error");
  }

  if (btn) { btn.innerText = "Remind"; btn.disabled = false; }
};

// =====================
// DOWNLOAD FILE
// =====================
async function downloadFile(id) {
  const res = await fetchWithAuth(`/application/file/${id}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "file";
  a.click();

  URL.revokeObjectURL(url);
}

// =====================
// UPDATE STATUS
// =====================
async function updateStatus(status) {
  const id = window.currentAppId;

  const res = await fetchWithAuth(`/application/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });

  const data = await res.json();

  if (data.ok) {
    showToast("Status updated", "success");
    closeModal();
    loadApplications();
  } else {
    showToast("Failed to update status", "error");
  }
}

async function activatePaymentForAll() {
  const confirmAll = confirm(
    "Are you sure you want to send payment activation email to ALL applicants?"
  );
  if (!confirmAll) return;

  const res = await fetchWithAuth("/application/payment-activate-all", {
    method: "POST"
  });

  const data = await res.json();

  if (data.ok) {
    showToast(`Payment activation sent to ${data.count} applicants.`, "success");
  } else {
    showToast("Failed: " + (data.error || "Unknown error"), "error");
  }
}

// =====================
// UTILS
// =====================
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function closeModal() {
  document.getElementById("detailModal").style.display = "none";
}

function logout() {
  localStorage.removeItem("adminToken");
  window.location.href = "/admin/login.html";
}

document.getElementById("activateAllBtn")?.addEventListener("click", activatePaymentForAll);


/* =====================================================
   GLOBAL EVENT DELEGATION (CSP COMPLIANT)
===================================================== */
document.addEventListener('click', async (e) => {
  // 1. View Application
  const viewBtn = e.target.closest('.js-view-btn');
  if (viewBtn) {
    const id = viewBtn.dataset.id;
    if (id) viewApplication(id);
    return;
  }

  // 2. Remind
  const remindBtn = e.target.closest('.js-remind-btn');
  if (remindBtn) {
    const id = remindBtn.dataset.id;
    if (id) await sendPaymentReminder(e, id);
    return;
  }

  // 3. Verify Payment
  const verifyBtn = e.target.closest('.js-verify-payment-btn');
  if (verifyBtn) {
    const id = verifyBtn.dataset.id;
    if (id) await verifyPayment(id);
    return;
  }

  // 4. View Screenshot (CSP Safe)
  const screenshotBtn = e.target.closest('.js-view-screenshot-btn');
  if (screenshotBtn) {
    const url = screenshotBtn.dataset.url;
    if (url) window.open(url, '_blank');
    return;
  }
});
