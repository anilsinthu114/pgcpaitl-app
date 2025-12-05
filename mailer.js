/********************************************************************
 * PGCPAITL – MAILER COMPONENT (Enhanced UI/UX)
 * Modern academic-grade email templates for all notifications
 ********************************************************************/
const nodemailer = require("nodemailer");

// ------------------------------------------------------------------
// 1. Transporter Setup
// ------------------------------------------------------------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_SECURE === "false" ? false : true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// ------------------------------------------------------------------
// HTML Escaper
// ------------------------------------------------------------------
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ------------------------------------------------------------------
// UNIVERSAL EMAIL LAYOUT WRAPPER
// ------------------------------------------------------------------
function layout(content) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f4f6fb;padding:30px;">
    <div style="
      max-width:650px;
      margin:auto;
      background:#ffffff;
      border-radius:10px;
      padding:25px 35px;
      box-shadow:0 4px 14px rgba(0,0,0,0.08);
    ">

      <!-- HEADER -->
      <div style="text-align:center;margin-bottom:20px;">
        <img src="https://jntugv.edu.in/static/media/jntugvcev.b33bb43b07b2037ab043.jpg" alt="JNTU-GV Logo"
          style="height:70px;margin-bottom:10px;">
        <h2 style="margin:0;font-size:20px;color:#003c7a;font-weight:700">
          Jawaharlal Nehru Technological University – Gurajada Vizianagaram
        </h2>
        <h3 style="margin:4px 0 0;font-size:16px;color:#555;">
          PGCPAITL – Artificial Intelligence · Technology · Law
        </h3>
      </div>

      <div style="border-top:1px solid #e3e6ed;margin:20px 0;"></div>

      <!-- CONTENT -->
      ${content}

      <div style="border-top:1px solid #e3e6ed;margin:25px 0;"></div>

      <!-- FOOTER -->
      <p style="text-align:center;color:#777;font-size:12px;margin-top:25px;">
        This is an automated academic notification. Please do not reply.
        <br>
        © ${new Date().getFullYear()} JNTU-GV · All Rights Reserved.
      </p>
    </div>
  </div>
  `;
}

// ------------------------------------------------------------------
// EMAIL TEMPLATE 1: Announcement Block (Improved)
// ------------------------------------------------------------------
function announcementBlock() {
  return `
  <div style="
    padding:16px;
    border-left:4px solid #e67e22;
    background:#fff4e6;
    border-radius:8px;
    margin-bottom:20px;
  ">
    <h3 style="margin:0;color:#c06500;">Important Information for Applicants</h3>
    <p style="margin:8px 0;font-size:14px;color:#5a4635;">
      Applicants may submit the Online Application Form through the portal at present.
    </p>
    <p style="margin:6px 0;font-size:14px;color:#5a4635;">
      The <strong>₹1,000/- non-refundable registration fee</strong> payment link will be activated shortly.
      Email notification will follow once the payment system is live.
    </p>
    <p style="margin:6px 0;font-size:14px;color:#5a4635;font-weight:600;">
      All applications remain provisional until fee payment is completed.
    </p>
    <p style="margin-top:10px;font-size:13px;">
      For official updates, visit:
      <a href="https://pgcpaitl.jntugv.edu.in" target="_blank" style="color:#003c7a;font-weight:600;">
        pgcpaitl.jntugv.edu.in
      </a>
    </p>
  </div>
  `;
}

// ------------------------------------------------------------------
// EMAIL TEMPLATE 2: Applicant Submission Acknowledgement
// ------------------------------------------------------------------
function applicantSubmissionEmail(app, id) {
  return layout(`
    ${announcementBlock()}

    <h2 style="color:#003c7a;margin-top:10px;">Application Successfully Submitted</h2>

    <p>Dear <strong>${escapeHtml(app.fullName)}</strong>,</p>

    <p style="font-size:14px;color:#444;line-height:1.6;">
      Thank you for applying to the 
      <strong>PG Certificate Programme in Artificial Intelligence, Technology & Law (PGCPAITL)</strong>.
    </p>

    <p style="font-size:14px;"><b>Application ID:</b> ${id}</p>

    <div style="
      background:#f8fbff;
      border:1px solid #dce6f5;
      padding:14px;
      border-radius:8px;
      margin-top:15px;
    ">
      <h3 style="margin-top:0;color:#003c7a;">Applicant Details</h3>
      <table cellpadding="6" style="font-size:14px;color:#333;">
        <tr><td><b>Name</b></td><td>${escapeHtml(app.fullName)}</td></tr>
        <tr><td><b>Parent Name</b></td><td>${escapeHtml(app.parentName)}</td></tr>
        <tr><td><b>Email</b></td><td>${escapeHtml(app.email)}</td></tr>
        <tr><td><b>Mobile</b></td><td>${escapeHtml(app.mobile)}</td></tr>
        <tr><td><b>Qualification</b></td><td>${escapeHtml(app.degreeLevel)}</td></tr>
        <tr><td><b>Institution </b></td><td>${escapeHtml(app.institution)}</td></tr>
        <tr><td><b>University</b></td><td>${escapeHtml(app.university)}</td></tr>
        <tr><td><b>Passing Year</b></td><td>${escapeHtml(app.passingYear)}</td></tr>
      </table>
    </div>

    <p style="margin-top:20px;color:#444;font-size:14px;">
      You will be notified once the payment gateway is activated.
    </p>
  `);
}

// ------------------------------------------------------------------
// EMAIL TEMPLATE 3: Admin Notification
// ------------------------------------------------------------------
function adminNotificationEmail(app, id) {
  return layout(`
    <h2 style="color:#003c7a;margin-top:0;">New PGCPAITL Application Received</h2>

    <p style="font-size:14px;color:#444;">A new applicant has submitted their form.</p>

    <p><strong>Application ID:</strong> ${id}</p>

    <table cellpadding="6" style="font-size:14px;color:#333;">
      <tr><td><b>Name</b></td><td>${escapeHtml(app.fullName)}</td></tr>
      <tr><td><b>Email</b></td><td>${escapeHtml(app.email)}</td></tr>
      <tr><td><b>Mobile</b></td><td>${escapeHtml(app.mobile)}</td></tr>
      <tr><td><b>Degree</b></td><td>${escapeHtml(app.degreeLevel)}</td></tr>
    </table>
  `);
}

// ------------------------------------------------------------------
// EMAIL TEMPLATE 4: Status Update Email
// ------------------------------------------------------------------
function statusUpdateEmail(app, status) {
  const statusColors = {
    submitted: "#0275d8",
    reviewing: "#f0ad4e",
    accepted: "#28a745",
    rejected: "#d9534f"
  };

  return layout(`
    <h2 style="color:#003c7a;">Application Status Updated</h2>

    <p>Dear <strong>${escapeHtml(app.fullName)}</strong>,</p>

    <p>Your PGCPAITL application status has been updated.</p>

    <div style="
      background:${statusColors[status]}20;
      padding:12px;
      border-left:5px solid ${statusColors[status]};
      border-radius:6px;
      margin-top:10px;
      font-size:15px;
    ">
      <strong>Status:</strong> <span style="color:${statusColors[status]};font-weight:700;">
        ${status.toUpperCase()}
      </span>
    </div>

    <p style="margin-top:18px;">
      You may log in to the portal to view additional updates.
    </p>
  `);
}

// ------------------------------------------------------------------
// EMAIL TEMPLATE 5: Payment Activation
// ------------------------------------------------------------------
function paymentActivationEmail(app, id) {
  return layout(`
    <h2 style="color:#003c7a;">Registration Fee Payment Activated</h2>

    <p>Dear <strong>${escapeHtml(app.fullName)}</strong>,</p>

    <p>
      Your PGCPAITL application (ID <b>${id}</b>) is now ready for payment.
      Please complete the <strong>₹1,000 non-refundable registration fee</strong>.
    </p>

    <div style="text-align:center;margin:25px 0;">
      <a href="https://dummy-payment.pgcpaitl.jntugv.edu.in"
         style="padding:12px 24px;background:#003c7a;color:#fff;
         border-radius:6px;text-decoration:none;font-size:16px;">
         Proceed to Payment
      </a>
    </div>

    <div style="
      background:#fff8e6;
      border-left:4px solid #e4a11b;
      padding:12px;
      border-radius:8px;
      font-size:14px;
      color:#6a4a00;
      margin-top:20px;
    ">
      <strong>Note:</strong>
      <ul style="margin:6px 0 0 18px;padding:0;">
        <li>The fee is non-refundable.</li>
        <li>Applications remain provisional until payment is completed.</li>
        <li>If you already paid, you may ignore this message.</li>
      </ul>
    </div>
  `);
}

// ------------------------------------------------------------------
// MAIL SENDER WRAPPER
// ------------------------------------------------------------------
async function sendMail(to, subject, html, cc = process.env.EMAIL_TO) {
  return transporter.sendMail({ from: process.env.EMAIL_FROM, to, cc, subject, html });
}

// ------------------------------------------------------------------
// EXPORTS
// ------------------------------------------------------------------
module.exports = {
  sendMail,
  applicantSubmissionEmail,
  adminNotificationEmail,
  statusUpdateEmail,
  paymentActivationEmail,
  announcementBlock,
  layout
};
