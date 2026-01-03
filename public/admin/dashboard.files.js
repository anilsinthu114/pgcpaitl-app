console.log("📁 Files Dashboard loaded");

const token = localStorage.getItem("adminToken");
if (!token) location.href = "/admin/login.html";

async function auth(url, opts = {}) {
  return fetch(url, {
    ...opts,
    headers: { "Authorization": "Bearer " + token, ...opts.headers }
  });
}

document.addEventListener("DOMContentLoaded", loadFiles);

async function loadFiles() {
  const root = document.getElementById("filesRoot");
  root.innerHTML = `<p>Loading...</p>`;

  const res = await auth("/admin/files/list");
  const j = await res.json();

  if (!j.ok) return (root.innerHTML = "Failed loading files.");

  let html = `<table class="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Applicant ID</th>
          <th>Type</th>
          <th>File</th>
          <th>Download</th>
        </tr>
      </thead>
      <tbody>
  `;

  j.files.forEach(f => {
    html += `
      <tr>
        <td>${f.id}</td>
        <td>${f.application_id}</td>
        <td>${f.type}</td>
        <td>${f.original_name}</td>
        <td><a href="javascript:void(0)" onclick="downloadFile('${f.id}', '${f.original_name}')">Download</a></td>
      </tr>`;
  });

  html += `</tbody></table>`;
  root.innerHTML = html;
}

async function downloadFile(id, filename) {
  try {
    const res = await auth(`/application/file/${id}`);
    if (!res.ok) throw new Error("Download failed");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename; // Use correct filename
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  } catch (err) {
    console.error(err);
    alert("Error downloading file");
  }
}
