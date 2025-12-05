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
        <td><a href="/download/${f.id}" target="_blank">Download</a></td>
      </tr>`;
  });

  html += `</tbody></table>`;
  root.innerHTML = html;
}
