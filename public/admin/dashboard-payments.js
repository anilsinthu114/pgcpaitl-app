console.log("💰 Payments Dashboard loaded");

const token2 = localStorage.getItem("adminToken");
if (!token2) location.href = "/login.html";

async function auth2(url, opt = {}) {
  return fetch(url, {
    ...opt,
    headers: { "Authorization": "Bearer " + token2, ...opt.headers }
  });
}

document.addEventListener("DOMContentLoaded", loadPayments);

async function loadPayments() {
  const root = document.getElementById("paymentsRoot");
  root.innerHTML = `<p>Loading...</p>`;

  const res = await auth2("/admin/payments/list");
  const j = await res.json();

  if (!j.ok) return (root.innerHTML = "Failed loading payments");

  let html = `<table class="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Application ID</th>
          <th>UTR</th>
          <th>Status</th>
          <th>Screenshot</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
  `;

  j.payments.forEach(p => {
    html += `
      <tr>
        <td>${p.id}</td>
        <td>${p.application_id}</td>
        <td>${p.utr}</td>
        <td>${p.status}</td>
        <td><a href="${p.screenshot_path}" target="_blank">View</a></td>
        <td>
          <button class="verify-btn" data-id="${p.id}" data-status="verified">Verify</button>
          <button class="reject-btn" data-id="${p.id}" data-status="rejected">Reject</button>
        </td>
      </tr>`;
  });

  html += `</tbody></table>`;
  root.innerHTML = html;

  document.querySelectorAll(".verify-btn").forEach(btn =>
    btn.addEventListener("click", () => updatePayment(btn.dataset.id, "verified"))
  );
  document.querySelectorAll(".reject-btn").forEach(btn =>
    btn.addEventListener("click", () => updatePayment(btn.dataset.id, "rejected"))
  );
}

async function updatePayment(id, status) {
  const res = await auth2(`/payment/${id}/status`, {
    method: "PUT",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ status })
  });

  const j = await res.json();
  if (j.ok) {
    alert("Payment updated");
    loadPayments();
  }
    else {
    alert("Failed to update payment");  
    }
}
