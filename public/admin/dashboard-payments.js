// =====================
// AUTH CHECK
// =====================
const token = localStorage.getItem("adminToken");
if (!token) {
  window.location.href = "/admin/login.html";
}

const APP_FEE = 1000; // Currently in Registration Phase (Registration: 1000, Course: 3500)

async function fetchWithAuth(url, options = {}) {
  return fetch(url, {
    ...options,
    cache: "no-store",
    headers: {
      "Authorization": `Bearer ${token}`,
      ...options.headers
    }
  });
}

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", () => {
  // Logout
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/admin/login.html";
  });

  // View Toggle Logic
  const tableBtn = document.getElementById("viewTableBtn");
  const gridBtn = document.getElementById("viewGridBtn");
  const tableContainer = document.getElementById("paymentsTableContainer");
  const gridContainer = document.getElementById("paymentsGrid");

  // Function to switch view
  function setView(mode) {
    if (mode === 'grid') {
      gridBtn.classList.add("active");
      gridBtn.style.background = "#002147"; gridBtn.style.color = "white";
      tableBtn.classList.remove("active");
      tableBtn.style.background = "white"; tableBtn.style.color = "#6c757d";

      tableContainer.style.display = "none";
      gridContainer.style.display = "grid";
    } else {
      tableBtn.classList.add("active");
      tableBtn.style.background = "#002147"; tableBtn.style.color = "white";
      gridBtn.classList.remove("active");
      gridBtn.style.background = "white"; gridBtn.style.color = "#6c757d";

      tableContainer.style.display = "block";
      gridContainer.style.display = "none";
    }
  }

  if (tableBtn && gridBtn) {
    tableBtn.addEventListener("click", () => setView('table'));
    gridBtn.addEventListener("click", () => setView('grid'));
  }

  // DEFAULT TO GRID ON MOBILE
  if (window.innerWidth <= 768) {
    setView('grid');
  }

  loadPayments();
});

async function loadPayments() {
  const loading = document.getElementById("loading");
  if (loading) loading.style.display = "block";

  try {
    // User requested /api/admin/payments, ensuring we use Auth
    const res = await fetchWithAuth("/api/admin/payments/list");
    const data = await res.json();

    if (loading) loading.style.display = "none";

    // Support both .ok (standard) and .success (user's snippet)
    if (!data.ok && !data.success) {
      showToast("Failed to load payments: " + (data.error || "Unknown error"), "error");
      return;
    }

    renderPayments(data.payments);
  } catch (err) {
    console.error(err);
    if (loading) loading.innerText = "Error loading data.";
    showToast("Network error loading payments", "error");
  }
}

function renderPayments(payments) {
  const tbody = document.getElementById("paymentsBody");
  const gridContainer = document.getElementById("paymentsGrid");

  tbody.innerHTML = "";
  gridContainer.innerHTML = "";

  // 1. Calculate Stats
  let totalCollected = 0;
  let pendingAmount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;

  payments.forEach(p => {
    if (p.status === 'verified') {
      totalCollected += Number(p.amount || 1000);
    } else if (p.status === 'uploaded') {
      pendingAmount += Number(p.amount || 1000);
      pendingCount++;
    } else if (p.status === 'rejected') {
      rejectedCount++;
    }
  });

  // Update Stats UI
  updateStat("totalCollected", `₹ ${totalCollected.toLocaleString()}`);
  updateStat("pendingAmount", `₹ ${pendingAmount.toLocaleString()}`);
  updateStat("pendingCount", pendingCount);
  updateStat("rejectedCount", rejectedCount);

  // 2. Render Table & Grid
  payments.forEach(p => {
    // --- TABLE ROW ---
    const tr = document.createElement("tr");

    // Status Badge Logic
    let badgeClass = "reviewing"; // default yellow
    if (p.status === 'verified') badgeClass = 'accepted';
    if (p.status === 'rejected') badgeClass = 'rejected';

    // Actions
    let actions = "";
    if (p.status === 'uploaded') {
      actions = `
        <button class="btn-sm js-verify-btn" data-id="${p.id}" style="background:var(--success); margin-right:5px;">Verify</button>
        <button class="btn-sm js-reject-btn" data-id="${p.id}" style="background:var(--danger);">Reject</button>
      `;
    } else {
      actions = `<span style="color:var(--text-muted); font-size:0.8rem;">Completed</span>`;
    }

    tr.innerHTML = `
      <td>${p.id}</td>
      <td>
        <div style="font-weight:600; color:var(--primary);">${escapeHtml(p.fullName)}</div>
        <div style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(p.email)}</div>
        <div style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(p.mobile)}</div>
      </td>
      <td>₹ ${Number(p.amount || 1000).toLocaleString()}</td>
      <td><strong>${p.payment_type === 'course_fee' ? 'Course Fee' : 'Registration'}</strong></td>
      <td style="font-family:monospace; font-weight:600;">${escapeHtml(p.utr)}</td>
      <td><span class="status ${badgeClass}">${p.status}</span></td>
      <td>${new Date(p.uploaded_at).toLocaleDateString()}</td>
      <td style="white-space: nowrap;">
        <button class="btn-sm js-view-screenshot-btn" data-url="/api/payment/screenshot/${p.id}?token=${token}" style="background:var(--info); color:white; border:none; padding:6px 12px; font-size:0.8rem; cursor:pointer;">Screenshot</button>
      </td>
      <td style="white-space: nowrap;">${actions}</td>
    `;
    tbody.appendChild(tr);

    // --- GRID CARD ---
    const card = document.createElement("div");
    card.className = "app-card";

    // Grid Actions
    let gridActions = "";
    if (p.status === 'uploaded') {
      gridActions = `
          <button class="btn-sm js-verify-btn" data-id="${p.id}" style="background:var(--success); flex:1;">Verify</button>
          <button class="btn-sm js-reject-btn" data-id="${p.id}" style="background:var(--danger); flex:1;">Reject</button>
       `;
    } else {
      gridActions = `<span style="width:100%; text-align:center; color:var(--success); font-weight:600; font-size:0.8rem;">✓ Completed</span>`;
    }

    card.innerHTML = `
       <div class="app-card-header">
         <div style="display:flex; justify-content:space-between; width:100%;">
            <span style="font-size:0.8rem; color:#999;">#${p.id}</span>
            <span class="status ${badgeClass}" style="font-size:0.7rem;">${p.status}</span>
         </div>
         <h4 style="margin-top:5px;">${escapeHtml(p.fullName)}</h4>
       </div>
       
       <div class="app-card-row">
          <span class="app-card-label">Amount</span>
          <span style="font-weight:700;">₹ ${Number(p.amount || 1000).toLocaleString()}</span>
        </div>
        <div class="app-card-row">
          <span class="app-card-label">Type</span>
          <span><strong>${p.payment_type === 'course_fee' ? 'Course Fee' : 'Registration'}</strong></span>
        </div>
       <div class="app-card-row">
         <span class="app-card-label">UTR/Ref</span>
         <span style="font-family:monospace;">${escapeHtml(p.utr)}</span>
       </div>
       <div class="app-card-row">
          <span class="app-card-label">Date</span>
          <span>${new Date(p.uploaded_at).toLocaleDateString()}</span>
       </div>
       
       <div style="margin-top:10px; display:flex; gap:10px;">
          <button class="btn-sm js-view-screenshot-btn" data-url="/api/payment/screenshot/${p.id}?token=${token}" style="background:var(--info); flex:1; justify-content:center;">Screenshot</button>
       </div>
       
       <div class="app-card-footer" style="display:flex; gap:10px; margin-top:10px; border-top:1px solid #f1f1f1; padding-top:10px;">
          ${gridActions}
       </div>
    `;
    gridContainer.appendChild(card);
  });
}

function updateStat(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerText = val;
}

// =====================
// ACTIONS
// =====================
document.addEventListener("click", async (e) => {
  // Verify
  if (e.target.classList.contains("js-verify-btn")) {
    const id = e.target.dataset.id;
    if (confirm("Verify this payment? This will mark the application as verified.")) {
      await updatePaymentStatus(id, "verify");
    }
  }

  // Reject
  if (e.target.classList.contains("js-reject-btn")) {
    const id = e.target.dataset.id;
    if (confirm("Reject this payment?")) {
      await updatePaymentStatus(id, "reject");
    }
  }

  // View Screenshot (CSP Safe)
  if (e.target.classList.contains("js-view-screenshot-btn")) {
    const url = e.target.dataset.url;
    if (url) window.open(url, "_blank");
  }
});

async function updatePaymentStatus(id, action) {
  // action = 'verify' or 'reject'
  // Endpoint: /admin/payment/:id/verify  OR  /admin/payment/:id/reject
  const res = await fetchWithAuth(`/admin/payment/${id}/${action}`, { method: "PUT" });
  const data = await res.json();

  if (data.ok) {
    showToast(`Payment ${action}ed successfully.`, "success");
    loadPayments();
  } else {
    showToast("Error: " + (data.error || "Failed"), "error");
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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
