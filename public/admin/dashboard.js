// =====================
// AUTH CHECK
// =====================
const token = localStorage.getItem("adminToken");
if (!token) {
  window.location.href = "/admin/login.html";
}

// helper
async function fetchWithAuth(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    cache: "no-store",
    headers: {
      "Authorization": `Bearer ${token}`,
      ...options.headers
    }
  });

  if (res.status === 401) {
    localStorage.removeItem("adminToken");
    window.location.href = "/admin/login.html";
    throw new Error("Unauthorized");
  }

  return res;
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

    // Default to Grid on Mobile
    if (window.innerWidth <= 768) {
      gridBtn.click();
    }
  }

  // Expose functions to global scope for inline onclick handlers
  window.viewApplication = viewApplication;
  window.loadApplications = loadApplications;

  loadApplications();
});

// =====================
// GLOBAL DATA STORE
// =====================
window.allApps = []; // Store for client-side filtering

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

  // Store globally
  window.allApps = data.items;

  document.getElementById("loading").style.display = "none";

  // Initial Render (All)
  window.filteredApps = window.allApps; // Init filtered list
  renderApplications(window.allApps);
  updateStats(window.allApps);
}

// =====================
// FILTERS & EXPORT LOGIC
// =====================
document.addEventListener("DOMContentLoaded", () => {
  const filterStatus = document.getElementById("filterStatus");
  const filterPayment = document.getElementById("filterPayment");
  const exportBtn = document.getElementById("exportBtn");

  if (filterStatus) filterStatus.addEventListener("change", applyFilters);
  if (filterPayment) filterPayment.addEventListener("change", applyFilters);
  if (exportBtn) exportBtn.addEventListener("click", exportToExcel);
});

function applyFilters() {
  const statusEl = document.getElementById("filterStatus");
  const paymentEl = document.getElementById("filterPayment");

  if (!statusEl || !paymentEl) return;

  const sVal = statusEl.value; // "all", "submitted", "accepted", "rejected", "reviewing"
  const pVal = paymentEl.value; // "all", "verified", "uploaded", "pending", "rejected"

  // Filter Logic
  window.filteredApps = window.allApps.filter(app => {
    // 1. App Status Check
    let sMatch = (sVal === "all");
    if (!sMatch) {
      if (sVal === "submitted") {
        if (app.status === "submitted" || app.status === "payment_pending") sMatch = true;
      }
      else if (sVal === "verified") {
        if (app.payment_status === "verified") sMatch = true;
      }
      else if (sVal === "accepted") {
        if (app.status === "accepted") sMatch = true;
      }
      else if (sVal === "rejected") {
        // Show if app is rejected OR payment is rejected
        if (app.status === "rejected" || app.status === "payment_rejected" || app.payment_status === "rejected") sMatch = true;
      }
      else if (sVal === "reviewing") {
        // "Under Review" usually means payment uploaded
        if ((app.payment_status === 'uploaded' || app.status === 'reviewing') && app.status !== 'accepted' && app.status !== 'rejected') sMatch = true;
      }
    }

    // 2. Payment Status Check
    let pMatch = (pVal === "all");
    if (!pMatch) {
      // Normalize null/undefined to 'pending'
      const payStatus = (app.payment_status || "pending").toLowerCase();
      const targetP = pVal.toLowerCase();

      if (targetP === "verified" && payStatus === "verified") pMatch = true;
      else if (targetP === "uploaded" && payStatus === "uploaded") pMatch = true;
      else if (targetP === "rejected" && payStatus === "rejected") pMatch = true;
      else if (targetP === "pending") {
        if (payStatus !== "verified" && payStatus !== "uploaded" && payStatus !== "rejected") pMatch = true;
      }
    }

    return sMatch && pMatch;
  });

  // Re-render
  renderApplications(window.filteredApps);
}

function exportToExcel() {
  if (typeof XLSX === 'undefined') {
    alert("System Update: The export library is blocked. Please RESTART the Node.js server terminal to apply the latest security updates.");
    return;
  }

  if (!window.filteredApps || window.filteredApps.length === 0) {
    alert("No data to export");
    return;
  }

  // Flatten data for Excel
  const data = window.filteredApps.map(app => ({
    "App ID": app.id,
    "Full Name": app.fullName || "",
    "Parent Name": app.parentName || "",
    "Email": app.email || "",
    "Mobile": app.mobile || "",
    "WhatsApp": app.whatsapp || "",
    "DOB": app.dob || "",
    "Gender": app.gender || "",
    "Category": app.category || "",
    "Nationality": app.nationality || "",
    "Aadhaar": app.aadhaar || "",

    // Address
    "Address": app.address || "",
    "City": app.city || "",
    "District": app.district || "",
    "State": app.state || "",
    "Pin Code": app.pin || "",
    "Country": app.country || "",

    // Academic
    "Degree Level": app.degreeLevel,
    "Specialization": app.specialization,
    "Institute Name": app.institutionName,
    "University": app.university,
    "Passing Year": app.passingYear,
    "Study Mode": app.studyMode,
    "Percentage": app.percentage,

    // Employment
    "Employment Status": app.employmentStatus,
    "Organisation": app.organisation,
    "Designation": app.designation,
    "Sector": app.sector,
    "Experience": app.experience,

    // Application Status
    "App Status": app.status,
    // Registration Payment
    "Reg. Status": app.reg_status || "Pending",
    "Reg. UTR": app.reg_utr || "",
    "Reg. Date": app.reg_date ? new Date(app.reg_date).toLocaleDateString() : "",

    // Course Fee Payment
    "Course Fee Status": app.course_status || "Pending",
    "Course Fee UTR": app.course_utr || "",
    "Course Fee Date": app.course_date ? new Date(app.course_date).toLocaleDateString() : "",

    // Latest Status (Summary)
    "Latest App Status": app.status,
    "Latest Pay Status": app.payment_status,

    // Dates
    "Submitted At": app.submitted_at ? new Date(app.submitted_at).toLocaleString() : "",

    // Misc
    "Statement of Purpose": app.sop,
    "Communication Mode": app.commMode || "",
    "Declarations": app.declarations
  }));

  // Create Workbook
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Applications");

  // Generate Filename
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `PGCPAITL_Full_Export_${date}.xlsx`);
}

// =====================
// UPDATE STATS
// =====================
function updateStats(apps) {
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

  // 5. Verified
  const verified = apps.filter(a => a.payment_status === "verified").length;

  // 6. Rejected
  const rejected = apps.filter(a => a.status === "rejected").length;


  if (document.getElementById("totalApps")) document.getElementById("totalApps").innerText = total;
  if (document.getElementById("submittedApps")) document.getElementById("submittedApps").innerText = submitted;
  if (document.getElementById("pendingApps")) document.getElementById("pendingApps").innerText = pending;
  if (document.getElementById("reviewingApps")) document.getElementById("reviewingApps").innerText = reviewing;
  if (document.getElementById("acceptedApps")) document.getElementById("acceptedApps").innerText = accepted;
  if (document.getElementById("verifiedApps")) document.getElementById("verifiedApps").innerText = verified;
  if (document.getElementById("rejectedApps")) document.getElementById("rejectedApps").innerText = rejected;
}

// =====================
// RENDER APPLICATIONS (Filtered)
// =====================
function renderApplications(apps) {
  const tableBody = document.getElementById("appsBody");
  const gridContainer = document.getElementById("appsGrid");

  tableBody.innerHTML = "";
  gridContainer.innerHTML = "";

  apps.forEach(app => {
    const payStatus = app.payment_status || "Pending";
    let loopDisplayStatus = app.status;
    let badgeClass = app.status;

    // Override Logic for UI Clarity & Consistency
    if (app.status === 'accepted') {
      loopDisplayStatus = 'Accepted';
      badgeClass = 'accepted';
    } else if (app.status === 'rejected') {
      loopDisplayStatus = 'Rejected';
      badgeClass = 'rejected';
    } else if (payStatus === 'rejected') {
      loopDisplayStatus = 'Payment Rejected';
      badgeClass = 'rejected';
    } else if (payStatus !== 'verified' && payStatus !== 'uploaded') {
      loopDisplayStatus = 'Pay Pending';
      badgeClass = 'payment_pending';
    } else if (payStatus === 'uploaded') {
      loopDisplayStatus = 'Under Review';
      badgeClass = 'reviewing';
    } else if (payStatus === 'verified') {
      loopDisplayStatus = 'Verified';
      badgeClass = 'submitted';
    }

    let remindBtn = "";
    if (payStatus !== 'verified' && payStatus !== 'uploaded') {
      remindBtn = `<button class="btn-sm js-remind-btn" data-id="${app.id}" style="background:var(--warning); color:white; border:none; padding:4px 8px; font-size:0.75rem; margin-left:5px;">Remind</button>`;
    }

    let requestFeeBtn = "";
    // Show 'Req. Fee' only if Registration is verified AND Course Fee is NOT verified
    if (payStatus === 'verified' && (!app.course_status || app.course_status !== 'verified')) {
      requestFeeBtn = `<button class="btn-sm js-request-fee-btn" data-id="${app.id}" style="background:#8e44ad; color:white; border:none; padding:4px 8px; font-size:0.75rem; margin-left:5px;">Req. Fee</button>`;
    }

    let remindSecondBtn = "";
    // Show 'Remind 2nd' if EMI option selected AND paid between 15k and 29k (meaning 2nd pending)
    if (app.course_emi_option === 'emi' && Number(app.total_course_paid || 0) === 15000) {
      remindSecondBtn = `<button class="btn-sm js-remind-second-btn" data-id="${app.id}" style="background:#d35400; color:white; border:none; padding:4px 8px; font-size:0.75rem; margin-left:5px;">Remind 2nd</button>`;
    }

    // Table Row
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${app.id}</td>
      <td><span style="font-weight:600;">${escapeHtml(app.fullName)}</span></td>
      <td>${escapeHtml(app.email)}</td>
      <td>${escapeHtml(app.mobile)}</td>
      <td>${escapeHtml(app.degreeLevel)}</td>
      <td><span class="status ${badgeClass}">${loopDisplayStatus}</span></td>
      <td><span style="font-weight:bold; color:#555;">${app.payment_type === 'course_fee' ? 'Course Fee' : 'Registration'}</span></td>
      <td><span class="status ${payStatus === 'verified' ? 'accepted' : (payStatus === 'uploaded' ? 'reviewing' : 'rejected')}">${payStatus}</span></td>
      <td>${new Date(app.created_at).toLocaleDateString()}</td>
      <td style="white-space:nowrap;">
        <button class="btn-sm js-view-btn" data-id="${app.id}">View</button>
        ${remindBtn}
        ${requestFeeBtn}
        ${remindSecondBtn}
      </td>
    `;
    tableBody.appendChild(tr);

    // Grid Card
    const card = document.createElement("div");
    card.className = "app-card";

    let gridRemindBtn = "";
    if (payStatus !== 'verified' && payStatus !== 'uploaded') {
      gridRemindBtn = `<button class="btn-sm js-remind-btn" data-id="${app.id}" style="background:transparent; border:1px solid var(--warning); color:var(--warning); margin-left:10px;">Remind</button>`;
    }

    let gridRequestFeeBtn = "";
    if (payStatus === 'verified' && (!app.course_status || app.course_status !== 'verified')) {
      gridRequestFeeBtn = `<button class="btn-sm js-request-fee-btn" data-id="${app.id}" style="background:transparent; border:1px solid #8e44ad; color:#8e44ad; margin-left:10px;">Req. Fee</button>`;
    }

    let gridRemindSecondBtn = "";
    if (app.course_emi_option === 'emi' && Number(app.total_course_paid || 0) >= 15000 && Number(app.total_course_paid || 0) < 30000) {
      gridRemindSecondBtn = `<button class="btn-sm js-remind-second-btn" data-id="${app.id}" style="background:transparent; border:1px solid #d35400; color:#d35400; margin-left:10px;">Remind 2nd</button>`;
    }

    card.innerHTML = `
       <div class="app-card-header">
         <div style="display:flex; justify-content:space-between; width:100%;">
            <span style="font-size:0.8rem; color:#999;">#${app.id}</span>
            <span class="status ${badgeClass}" style="font-size:0.7rem;">${loopDisplayStatus}</span>
         </div>
         <h4 style="margin-top:5px;">${escapeHtml(app.fullName)}</h4>
       </div>
       <div class="app-card-row">
         <span class="app-card-label">Email</span>
         <span>${escapeHtml(app.email)}</span>
       </div>
       <div class="app-card-row">
         <span class="app-card-label">Mobile</span>
         <span>${escapeHtml(app.mobile)}</span>
       </div>
       <div class="app-card-row">
         <span class="app-card-label">Degree</span>
         <span>${escapeHtml(app.degreeLevel)}</span>
       </div>
       <div class="app-card-row">
         <span class="app-card-label">Payment</span>
         <span class="status ${payStatus === 'verified' ? 'accepted' : (payStatus === 'uploaded' ? 'reviewing' : 'rejected')}" style="padding:2px 8px; font-size:0.7rem;">${payStatus}</span>
       </div>
       <div class="app-card-row">
         <span class="app-card-label">Applied</span>
         <span>${new Date(app.submitted_at || app.created_at).toLocaleDateString()}</span>
       </div>
       <div class="app-card-footer" style="display:flex; justify-content:flex-end; align-items:center;">
          <button class="btn-primary js-view-btn" data-id="${app.id}" style="flex:1;">View</button>
          ${gridRemindBtn}
          ${gridRequestFeeBtn}
          ${gridRemindSecondBtn}
       </div>
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
      <div><b>Communication Mode:</b> ${escapeHtml(app.commMode)}</div>
      <div><b>Declarations:</b> ${escapeHtml(app.declarations)}</div>
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
           <th style="padding:8px;">Type</th>
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
         <td style="padding:8px; border-bottom:1px solid #eee;"><strong>${p.payment_type === 'course_fee' ? 'Course Fee' : 'Registration'}</strong></td>
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
  fileDiv.style.display = "grid";
  fileDiv.style.gridTemplateColumns = "repeat(auto-fill, minmax(250px, 1fr))";
  fileDiv.style.gap = "15px";
  fileDiv.style.marginTop = "15px";

  files.forEach(f => {
    const el = document.createElement("div");
    el.className = "file-card";
    el.style.border = "1px solid #e0e0e0";
    el.style.borderRadius = "8px";
    el.style.padding = "15px";
    el.style.backgroundColor = "#fff";
    el.style.boxShadow = "0 2px 5px rgba(0,0,0,0.05)";
    el.style.display = "flex";
    el.style.flexDirection = "column";
    el.style.justifyContent = "space-between";

    // Icon based on type (simple text fallback or unicode)
    let icon = "📄";
    if (f.type.includes("Photo")) icon = "📷";
    if (f.type.includes("Degree")) icon = "🎓";
    if (f.type.includes("ID")) icon = "🆔";

    el.innerHTML = `
      <div style="display:flex; align-items:center; margin-bottom:10px;">
        <span style="font-size:1.5rem; margin-right:10px;">${icon}</span>
        <div>
           <div style="font-weight:bold; color:#333; font-size:0.9rem;">${escapeHtml(f.type)}</div>
           <div style="color:#777; font-size:0.8rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:180px;" title="${escapeHtml(f.original_name)}">${escapeHtml(f.original_name)}</div>
        </div>
      </div>
      <button class="download-btn" data-file="${f.id}" data-filename="${escapeHtml(f.original_name)}"
        style="background:#003366; color:white; border:none; padding:8px 12px; border-radius:4px; font-size:0.85rem; cursor:pointer; width:100%; text-align:center; transition:background 0.2s;">
        Download File
      </button>
    `;
    fileDiv.appendChild(el);
  });

  // Attach file download listeners
  document.querySelectorAll(".download-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const fileId = btn.getAttribute("data-file");
      const fileName = btn.getAttribute("data-filename");
      downloadFile(fileId, fileName);
    });
  });

  document.getElementById("detailModal").style.display = "block";

  // ACTION BUTTONS VISIBILITY
  // User Requirement: Hide actions if already accepted. Show if rejected (to allow re-evaluation).
  const approveBtn = document.getElementById("approveBtn");
  const reviewBtn = document.getElementById("reviewBtn");
  const rejectBtn = document.getElementById("rejectBtn");

  if (app.status === 'accepted') {
    if (approveBtn) approveBtn.style.display = 'none';
    if (reviewBtn) reviewBtn.style.display = 'none';
    if (rejectBtn) rejectBtn.style.display = 'none';
  } else {
    // Show them for others (submitted, reviewing, pending, rejected)
    if (approveBtn) approveBtn.style.display = 'inline-block';
    if (reviewBtn) reviewBtn.style.display = 'inline-block';
    if (rejectBtn) rejectBtn.style.display = 'inline-block';
  }
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

window.requestCourseFee = async (e, id) => {
  if (e) e.stopPropagation();
  if (!confirm("Send 'Course Fee Payment (30k)' request email to this verified applicant?")) return;

  const btn = e ? e.target : null;
  if (btn) { btn.innerText = "Sending..."; btn.disabled = true; }

  const res = await fetchWithAuth(`/api/admin/application/${id}/request-course-fee`, { method: "POST" });
  const data = await res.json();

  if (data.ok) {
    showToast("Course Fee Request Sent!", "success");
  } else {
    showToast("Error: " + (data.error || "Failed to send"), "error");
  }

  if (btn) { btn.innerText = "Req. Fee"; btn.disabled = false; }
};

// =====================
// DOWNLOAD FILE
// =====================
async function downloadFile(id, filename) {
  try {
    const res = await fetchWithAuth(`/application/file/${id}`);
    if (!res.ok) throw new Error("Download failed");

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "download";
    document.body.appendChild(a); // Append to body to ensure click works in Firefox
    a.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

  } catch (e) {
    console.error(e);
    showToast("Error downloading file", "error");
  }
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
  return String(str)
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

// =====================
// GROUP MAIL LOGIC
// =====================
const groupMailModal = document.getElementById("groupMailModal");
const openGroupMailBtn = document.getElementById("openGroupMailBtn");
const closeGroupMailBtn = document.getElementById("closeGroupMailBtn");
const sendGroupMailBtn = document.getElementById("sendGroupMailBtn");

if (openGroupMailBtn) {
  openGroupMailBtn.addEventListener("click", () => {
    groupMailModal.style.display = "block";
  });
}

if (closeGroupMailBtn) {
  closeGroupMailBtn.addEventListener("click", () => {
    groupMailModal.style.display = "none";
  });
}

if (sendGroupMailBtn) {
  sendGroupMailBtn.addEventListener("click", async () => {
    const target = document.getElementById("groupMailTarget").value;
    const subject = document.getElementById("groupMailSubject").value;
    const message = document.getElementById("groupMailMessage").value;

    if (!subject || !message) {
      return showToast("Subject and Message are required", "error");
    }

    if (!confirm(`Are you sure you want to send this email to ${target.toUpperCase()} candidates?`)) return;

    sendGroupMailBtn.innerText = "Sending...";
    sendGroupMailBtn.disabled = true;

    try {
      const res = await fetchWithAuth("/api/admin/applications/bulk-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target, subject, message }) // status maps to target
      });
      const data = await res.json();

      if (data.ok) {
        showToast(`Queued ${data.count} emails successfully.`, "success");
        groupMailModal.style.display = "none";
        document.getElementById("groupMailSubject").value = "";
        document.getElementById("groupMailMessage").value = "";
      } else {
        showToast("Error: " + data.error, "error");
      }
    } catch (e) {
      showToast("Network Error", "error");
    } finally {
      sendGroupMailBtn.innerText = "Send Broadcast";
      sendGroupMailBtn.disabled = false;
    }
  });
}

// =====================
// INDIVIDUAL MAIL LOGIC
// =====================
const individualMailModal = document.getElementById("individualMailModal");
const openIndivMailBtn = document.getElementById("openIndivMailBtn");
const sendIndivMailBtn = document.getElementById("sendIndivMailBtn");

if (openIndivMailBtn) {
  openIndivMailBtn.addEventListener("click", () => {
    const app = window.allApps.find(a => a.id == window.currentAppId);
    if (!app) return showToast("Applicant not found", "error");

    document.getElementById("indivMailName").innerText = app.fullName;
    document.getElementById("indivMailEmail").innerText = app.email;
    document.getElementById("indivMailSubject").value = "";
    document.getElementById("indivMailMessage").value = "";

    individualMailModal.style.display = "block";
  });
}

if (sendIndivMailBtn) {
  sendIndivMailBtn.addEventListener("click", async () => {
    const id = window.currentAppId;
    const subject = document.getElementById("indivMailSubject").value;
    const message = document.getElementById("indivMailMessage").value;

    if (!subject || !message) {
      return showToast("Subject and Message are required", "error");
    }

    sendIndivMailBtn.innerText = "Sending...";
    sendIndivMailBtn.disabled = true;

    try {
      const res = await fetchWithAuth(`/api/admin/application/${id}/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message })
      });
      const data = await res.json();

      if (data.ok) {
        showToast("Message sent successfully!", "success");
        individualMailModal.style.display = "none";
      } else {
        showToast("Error: " + data.error, "error");
      }
    } catch (e) {
      showToast("Network Error", "error");
    } finally {
      sendIndivMailBtn.innerText = "Send Email";
      sendIndivMailBtn.disabled = false;
    }
  });
}


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

  // 2b. Request Course Fee
  const reqFeeBtn = e.target.closest('.js-request-fee-btn');
  if (reqFeeBtn) {
    const id = reqFeeBtn.dataset.id;
    if (id) await window.requestCourseFee(e, id);
    return;
  }

  // 2c. Remind 2nd Installment
  const remindSecondBtn = e.target.closest('.js-remind-second-btn');
  if (remindSecondBtn) {
    const id = remindSecondBtn.dataset.id;
    if (!confirm("Send Second Installment Reminder?")) return;

    remindSecondBtn.innerText = "Sending...";
    remindSecondBtn.disabled = true;

    try {
      const res = await fetchWithAuth(`/api/admin/application/${id}/remind-second-installment`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) showToast("Reminder Sent!", "success");
      else showToast(data.error || "Failed", "error");
    } catch (err) {
      showToast("Network Error", "error");
    } finally {
      remindSecondBtn.innerText = "Remind 2nd";
      remindSecondBtn.disabled = false;
    }
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
