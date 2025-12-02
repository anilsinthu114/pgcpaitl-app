const token = localStorage.getItem("adminToken");
if (!token) window.location.href = "/login.html";

async function fetchWithAuth(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      ...options.headers
    }
  });
}

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

  // Stats
  document.getElementById("totalApps").innerText = apps.length;
  document.getElementById("submittedApps").innerText = apps.filter(a => a.status === "submitted").length;
  document.getElementById("reviewedApps").innerText = apps.filter(a => a.status === "reviewed").length;
  document.getElementById("approvedApps").innerText = apps.filter(a => a.status === "approved").length;

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
      <td><button class="view-btn" onclick="viewApplication(${app.id})">View</button></td>
    `;
    body.appendChild(row);
  });
}

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

  const fileDiv = document.getElementById("appFiles");
  fileDiv.innerHTML = "";
  files.forEach(f => {
    fileDiv.innerHTML += `
      <div class="file-item">
        <span>${escapeHtml(f.original_name)}</span>
        <button onclick="downloadFile(${f.id})" class="download-btn">Download</button>
      </div>
    `;
  });

  document.getElementById("detailModal").style.display = "block";
}

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

document.getElementById("approveBtn").onclick = async () => updateStatus("approved");
document.getElementById("reviewBtn").onclick = async () => updateStatus("reviewed");
document.getElementById("rejectBtn").onclick = async () => updateStatus("rejected");

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

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}

function closeModal(){ document.getElementById("detailModal").style.display="none"; }
function logout(){ localStorage.removeItem("adminToken"); window.location.href="/login.html"; }

loadApplications();
