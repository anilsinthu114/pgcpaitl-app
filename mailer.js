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
		<p style ="text-align:left; color:#777; font-size:12px;">
		PGCPAITL Admisions team 
		JNTUGV & DSNLU
</p>

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
// function announcementBlock() {
//   return `
//   <div style="
//     padding:16px;
//     border-left:4px solid #e67e22;
//     background:#fff4e6;
//     border-radius:8px;
//     margin-bottom:20px;
//   ">
//     <h3 style="margin:0;color:#c06500;">Important Information for Applicants</h3>
//     <p style="margin:8px 0;font-size:14px;color:#5a4635;">
//       Applicants may submit the Online Application Form through the portal at present.
//     </p>
//     <p style="margin:6px 0;font-size:14px;color:#5a4635;">
//       The <strong>₹1,000/- non-refundable registration fee</strong> payment link will be activated shortly.
//       Email notification will follow once the payment system is live.
//     </p>
//     <p style="margin:6px 0;font-size:14px;color:#5a4635;font-weight:600;">
//       All applications remain provisional until fee payment is completed.
//     </p>
//     <p style="margin-top:10px;font-size:13px;">
//       For official updates, visit:
//       <a href="https://pgcpaitl.jntugv.edu.in" target="_blank" style="color:#003c7a;font-weight:600;">
//         pgcpaitl.jntugv.edu.in
//       </a>
//     </p>
//   </div>
//   `;
// }

// ------------------------------------------------------------------
// EMAIL TEMPLATE 2: Applicant Submission Acknowledgement
// ------------------------------------------------------------------
function applicantSubmissionEmail(app, id) {
  return layout(`

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
       Your application has been submitted successfully. Please make the payment of ₹1,000/- through the payment link provided in the application form.
       Then only Your Application will be processed and Accpeted for the Certification Course.

    </p>
    <div style="text-align:center;margin-top:20px;">
      <a href="https://application.pgcpaitl.jntugv.edu.in/payment.html?id=${id}" 
         style="background-color:#003c7a;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:bold;display:inline-block;">
        Pay Now
      </a>
    </div>
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
    Be Formal and Professional in your communication.
    <br>
     You may Contact us through a mail at <a href="mailto:pgcpaitl@jntugv.edu.in">pgcpaitl@jntugv.edu.in</a>
    </p>
  `);
}

// ------------------------------------------------------------------
// EMAIL TEMPLATE 6: Payment Received Acknowledgement
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// EMAIL TEMPLATE 6: Payment Received Acknowledgement
// ------------------------------------------------------------------
function paymentReceivedEmail(appObj, paymentId, prettyId, utr) {
  return layout(`
    <h2 style="color:#004c97; margin-top:0;">Payment Submission Received</h2>

    <p>Dear <strong>${escapeHtml(appObj.fullName)}</strong>,</p>

    <p>
      We acknowledge the receipt of your <strong>payment proof submission</strong> 
      for your application to the 
      <strong>PG Certificate Programme in Artificial Intelligence, Technology & Law (PGCPAITL)</strong>.
    </p>

    <div style="background:#f8fbff; border:1px solid #dce6f5; padding:15px; border-radius:8px; margin-top:15px;">
      <table cellpadding="6" style="font-size:14px; color:#333; width:100%;">
        <tr>
          <td style="width:140px; font-weight:bold;">Application ID:</td>
          <td>${prettyId}</td>
        </tr>
        <tr>
          <td style="font-weight:bold;">Payment ID:</td>
          <td>${paymentId}</td>
        </tr>
        <tr>
          <td style="font-weight:bold;">UTR / Ref No:</td>
          <td>${escapeHtml(utr)}</td>
        </tr>
        <tr>
          <td style="font-weight:bold;">Submission Time:</td>
          <td>${new Date().toLocaleString("en-IN")}</td>
        </tr>
      </table>
    </div>

    <p style="margin-top:20px;">
      <strong>Your payment is currently under verification</strong> by the Admissions Team.
      You will be notified via email once the verification is completed.
    </p>

    <p>
      If there is any discrepancy or additional information required, we will contact you.
    </p>

    <p style="margin-top:20px;">
      Regards,<br/>
      <strong>PGCPAITL Admissions Team</strong>
      JNTU-GV & DSNLU
    </p>
  `);
}

// ------------------------------------------------------------------
// EMAIL TEMPLATE 7: Payment Status Update (Verified / Rejected)
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// EMAIL TEMPLATE 7a: Payment Verified
// ------------------------------------------------------------------
function paymentVerifiedEmail(app, prettyId) {
  return layout(`
    <h2 style="color:#1b7a1b; margin-top:0;">Payment Successfully Verified</h2>

    <p>Dear <strong>${escapeHtml(app.fullName)}</strong>,</p>

    <p>
      We are pleased to inform you that your payment for the  
      <strong>PGCPAITL Application</strong> has been 
      <span style="font-weight:bold; color:#1b7a1b;">verified and approved</span>.
    </p>

    <p><b>Application ID:</b> ${prettyId}</p>

    <div style="background:#e8f5e9; border:1px solid #c3e6cb; border-radius:6px; padding:15px; margin:20px 0;">
      <p style="margin:0; color:#155724;">
        ✅ <strong>Status Verified</strong><br>
        Your application will now proceed to the next stage of admission processing.
      </p>
    </div>

    <p>
      You will receive further communication from the Admissions Team shortly.
    </p>

    <p style="margin-top:20px;">
      Regards,<br/>
      <strong>PGCPAITL Admissions Team</strong>
      <br/> 
      JNTU-GV & DSNLU
    </p>
  `);
}

// ------------------------------------------------------------------
// EMAIL TEMPLATE 7b: Payment Rejected
// ------------------------------------------------------------------
function paymentRejectedEmail(app, prettyId) {
  return layout(`
    <h2 style="color:#b00020; margin-top:0;">Payment Verification Failed</h2>

    <p>Dear <strong>${escapeHtml(app.fullName)}</strong>,</p>

    <p>
      Unfortunately, we could not verify your payment submission for the 
      <strong>PGCPAITL Application</strong>.
    </p>

    <p><b>Application ID:</b> ${prettyId}</p>

    <div style="background:#fdecea; border:1px solid #f5c6cb; border-radius:6px; padding:15px; margin:20px 0;">
      <p style="margin:0; color:#721c24;">
        ❌ <strong>Action Required</strong><br>
        Please re-upload a clear payment proof (UTR screenshot) ensuring the UTR number is visible and matches your transaction.
      </p>
    </div>

    <p>
      You can re-upload your proof using the payment link 
      <a href= "https://application.pgcpaitl.jntugv.edu.in/payment.html/?id=${prettyId}">Proceed to Re-upload</a>
      <br/>
      If you believe this is an error, please contact us with supporting documents.
    </p>

    <p style="margin-top:20px;">
      Regards,<br/>
      <strong>PGCPAITL Admissions Team</strong>
    </p>
  `);
}


// ------------------------------------------------------------------
// EMAIL TEMPLATE 8: Payment Pending Notification
// ------------------------------------------------------------------
function paymentPendingEmail(app, prettyId) {
  return layout(`
    <h2 style="color:#d9534f; margin-top:0;">Action Required: Payment Pending</h2>

    <p>Dear <strong>${escapeHtml(app.fullName)}</strong>,</p>

    <p>
      We have received your request to submit your application (ID: <strong>${prettyId}</strong>).
    </p>

    <p>
      However, our records indicate that the <strong>Registration Fee Payment</strong> has not yet been verified.
      Your application status is temporarily set to <span style="color:#d9534f; font-weight:bold;">PAYMENT PENDING</span>.
    </p>

    <div style="
      background:#fff8e6;
      border-left:4px solid #e4a11b;
      padding:12px;
      border-radius:8px;
      font-size:14px;
      color:#6a4a00;
      margin:20px 0;
    ">
      <strong>Next Steps:</strong>
      <ul style="margin:6px 0 0 18px;padding:0;">
        <li>If you haven't paid yet, please complete the payment immediately.</li>
        <li>If you have paid, please upload the payment proof (UTR screenshot) via the portal.</li>
        <li>Once verified, your application will be automatically marked as <strong>SUBMITTED</strong>.</li>
      </ul>
    </div>

    <p style="text-align:center; margin-top:25px;">
      <a href="https://application.pgcpaitl.jntugv.edu.in/payment.html?id=${prettyId}" 
         style="padding:12px 24px; background:#004c97; color:#white; border-radius:6px; text-decoration:none; font-weight:bold;">
        Proceed to Payment
      </a>
    </p>
  `);
}


// ------------------------------------------------------------------
// EMAIL TEMPLATE 5: Payment Activation
// ------------------------------------------------------------------
// function paymentActivationEmail(app, id) {
//   return layout(`
//     <h2 style="color:#003c7a;">Registration Fee Payment Activated</h2>

//     <p>Dear <strong>${escapeHtml(app.fullName)}</strong>,</p>

//     <p>
//       Your PGCPAITL application (ID <b>${id}</b>) is now ready for payment.
//       Please complete the <strong>₹1,000 non-refundable registration fee</strong>.
//     </p>

//     <div style="text-align:center;margin:25px 0;">
//       <a href="https://application.pgcpaitl.jntugv.edu.in/payment.html?appId=${encodeURIComponent(id)}"
//          style="padding:12px 24px;background:#003c7a;color:#fff;
//          border-radius:6px;text-decoration:none;font-size:16px;">
//          Proceed to Payment
//       </a>
//     </div>

//     <div style="
//       background:#fff8e6;
//       border-left:4px solid #e4a11b;
//       padding:12px;
//       border-radius:8px;
//       font-size:14px;
//       color:#6a4a00;
//       margin-top:20px;
//     ">
//       <strong>Note:</strong>
//       <ul style="margin:6px 0 0 18px;padding:0;">
//         <li>The fee is non-refundable.</li>
//         <li>Applications remain provisional until payment is completed.</li>
//         <li>If you already paid, you may ignore this message.</li>
//       </ul>
//     </div>
//   `);
// }

// ------------------------------------------------------------------
// EMAIL TEMPLATE 9: Verified Application Success
// ------------------------------------------------------------------
function applicationVerifiedSuccessEmail(app, id) {
  return layout(`
    <h2 style="color:#28a745; margin-top:0;">Application Submitted & Verified</h2>

    <p>Dear <strong>${escapeHtml(app.fullName)}</strong>,</p>

    <p>
      We are pleased to confirm that your application for the 
      <strong>PG Certificate Programme in Artificial Intelligence, Technology & Law (PGCPAITL)</strong> 
      has been successfully received.
    </p>
    
    <p><b>Application ID:</b> ${id}</p>

    <div style="background:#e8f5e9; border:1px solid #c3e6cb; border-radius:6px; padding:15px; margin:20px 0;">
      <p style="margin:0; color:#155724; font-weight:bold;">✅ Payment Status: Verified</p>
      <p style="margin:5px 0 0; color:#155724;">Your application is now complete and under final review by the Admissions Committee.</p>
    </div>

    <p>
      You will receive an official Offer Letter / Admission status update shortly via email.
    </p>

    <p style="margin-top:20px;">
      Regards,<br/>
      <strong>PGCPAITL Admissions Team</strong>
    </p>
  `);
}

// ------------------------------------------------------------------
// EMAIL TEMPLATE 10: Course Fee Request (30k)
// ------------------------------------------------------------------
function courseFeeRequestEmail(app, id) {
  return layout(`
    <h2 style="color:#003c7a; margin-top:0;">Course Fee Payment Request</h2>

    <p>Dear <strong>${escapeHtml(app.fullName)}</strong>,</p>

    <p>
      Congratulations! Your application (ID: <strong>${id}</strong>) for the 
      <strong>PG Certificate Programme in Artificial Intelligence, Technology & Law (PGCPAITL)</strong> 
      has been verifying and approved for the next stage.
    </p>

    <p>
      You are now requested to complete the <strong>Course Fee Payment</strong> of 
      <span style="font-size:16px; font-weight:bold; color:#d35400;">₹30,000/- (Thirty Thousand INR)</span> 
      to confirm your admission.
    </p>

    <div style="text-align:center; padding:20px; border:1px solid #eee; border-radius:8px; margin:25px 0; background:#f9f9f9;">
      <h3 style="margin-top:0; color:#e65100;">Pay Securely Online</h3>
      <p style="font-size:14px; color:#555;">
         Click the button below to open the secure payment gateway.<br>
         You can scan the QR code and upload proof on the page.
      </p>
      
      <a href="https://application.pgcpaitl.jntugv.edu.in/course-fee.html?id=${id}" 
         style="background-color:#d35400; color:#fff; padding:14px 28px; border-radius:4px; text-decoration:none; font-weight:bold; display:inline-block; font-size:16px;">
        Pay Course Fee (₹30,000)
      </a>

      <p style="margin-top:15px; font-size:12px; color:#888;">
        <strong>Application ID:</strong> ${id}
      </p>
    </div>

    <p>
      <strong>Important Instructions:</strong>
      <ul>
        <li>After payment, please reply to this email with the payment proof (Screenshot & UTR Number).</li>
        <li>Ensure your Application ID (<strong>${id}</strong>) is mentioned in the payment remarks/description.</li>
      </ul>
    </p>

    <p style="margin-top:20px;">
      Regards,<br/>
      <strong>PGCPAITL Admissions Team</strong>
    </p>
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
  // paymentActivationEmail,
  // announcementBlock,
  paymentReceivedEmail,
  paymentVerifiedEmail,
  paymentRejectedEmail,
  paymentPendingEmail,
  applicationVerifiedSuccessEmail,
  courseFeeRequestEmail,
  layout

};
