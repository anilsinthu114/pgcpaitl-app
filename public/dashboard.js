// =====================
// AUTH CHECK
// =====================
const token = localStorage.getItem("adminToken");
if (!token) {
  window.location.href = "/login.html";
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

  loadApplications();
});

// =====================
// LOAD APPLICATIONS
// =====================
async function loadApplications() {
  const res = await fetchWithAuth("/application/list");
  const data = await res.json();

  if (!data.ok) {
    document.getElementById("loading").innerText = "Failed to load data.";
    return;
  }

  const apps = data.items;
  const body = document.getElementById("appsBody");
  const table = document.getElementById("appsTable");

  document.getElementById("loading").style.display = "none";
  table.style.display = "table";
  body.innerHTML = "";

  document.getElementById("totalApps").innerText = apps.length;
  document.getElementById("submittedApps").innerText = apps.filter(a => a.status === "submitted").length;
  document.getElementById("reviewingApps").innerText = apps.filter(a => a.status === "reviewing").length;
  document.getElementById("acceptedApps").innerText = apps.filter(a => a.status === "accepted").length;
  document.getElementById("rejectedApps").innerText = apps.filter(a => a.status === "rejected").length;


  apps.forEach(app => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${app.id}</td>
      <td>${escapeHtml(app.fullName)}</td>
      <td>${escapeHtml(app.email)}</td>
      <td>${escapeHtml(app.mobile)}</td>
      <td>${escapeHtml(app.degreeLevel)}</td>
      <td><span class="status ${app.status}">${app.status}</span></td>
      <td>${new Date(app.submitted_at).toLocaleDateString()}</td>
      <td><button class="view-btn" data-id="${app.id}">View</button></td>
    `;

    body.appendChild(row);
  });

  // Attach event listeners to all "View" buttons
  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      viewApplication(id);
    });
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

  const details = document.getElementById("appDetails");

  details.innerHTML = `
    <div class="detail-grid">
      <div><b>Name:</b> ${escapeHtml(app.fullName)}</div>
      <div><b>Email:</b> ${escapeHtml(app.email)}</div>
      <div><b>Mobile:</b> ${escapeHtml(app.mobile)}</div>
      <div><b>Gender:</b> ${app.gender}</div>
      <div><b>Category:</b> ${app.category}</div>
      <div><b>Degree Level:</b> ${escapeHtml(app.degreeLevel)}</div>
      <div><b>University:</b> ${escapeHtml(app.university)}</div>
      <div><b>SOP:</b> ${escapeHtml(app.sop)}</div>
      <div><b>Status:</b> ${app.status}</div>
    </div>
  `;

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
    alert("Status updated");
    closeModal();
    loadApplications();
  } else {
    alert("Failed to update status");
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
  window.location.href = "/login.html";
}

document.getElementById("activateAllBtn")?.addEventListener("click", activatePaymentForAll);
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
    alert(`Payment activation sent to ${data.count} applicants.`);
  } else {
    alert("Failed: " + (data.error || "Unknown error"));
  }
}
