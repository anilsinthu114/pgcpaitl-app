//  // 1️⃣ ANNOUNCEMENT TEMPLATE (sent to applicant)
//         const announcementEmail = `
// <div style="padding:16px;border-left:5px solid #f39c12;background:#fff7ed;border-radius:8px;font-family:Arial;">
//   <h2 style="color:#b45309;margin:0 0 10px 0;">Important Information for Applicants</h2>
//   <p>Applicants may submit the Online Application Form through the portal at present.</p>

//   <p>
//     The <strong>₹1,000/- non-refundable registration fee</strong> payment link 
//     will be activated shortly on the same portal.  
//     You will receive automatic <strong>Email / SMS notifications</strong> once the payment gateway is live.
//   </p>

//   <p><strong>All applications shall remain provisional until payment is completed.</strong></p>
//   <p>The registration fee is strictly non-refundable.</p>

//   <p style="margin-top:10px;">
//     For official updates, visit:  
//     <a href="https://pgcpaitl.jntugv.edu.in" target="_blank">pgcpaitl.jntugv.edu.in</a>
//   </p>
// </div>
// `;


//         // 2️⃣ APPLICATION SUBMISSION ACKNOWLEDGEMENT — applicant
//         const applicantSubmissionEmail = (appObj, applicationId) => `
// ${announcementEmail}

// <h2 style="color:#004c97;font-family:Arial;">Your Application is Received</h2>
// <p>Dear <strong>${escapeHtml(appObj.fullName)}</strong>,</p>

// <p>Your application has been successfully submitted.</p>

// <p><strong>Application ID:</strong> ${applicationId}</p>

// <h3 style="color:#004c97;margin-top:20px;">Applicant Details</h3>
// <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:Arial;">
//   <tr><td><b>Name:</b></td><td>${escapeHtml(appObj.fullName)}</td></tr>
//   <tr><td><b>Father/Mother:</b></td><td>${escapeHtml(appObj.parentName)}</td></tr>
//   <tr><td><b>Email:</b></td><td>${escapeHtml(appObj.email)}</td></tr>
//   <tr><td><b>Mobile:</b></td><td>${escapeHtml(appObj.mobile)}</td></tr>
//   <tr><td><b>Qualification:</b></td><td>${escapeHtml(appObj.degreeLevel)}</td></tr>
//   <tr><td><b>Specialization:</b></td><td>${escapeHtml(appObj.specialization)}</td></tr>
//   <tr><td><b>University:</b></td><td>${escapeHtml(appObj.university)}</td></tr>
//   <tr><td><b>Year of Passing:</b></td><td>${escapeHtml(appObj.passingYear)}</td></tr>
// </table>

// <p style="margin-top:12px;">
// You will be notified once the payment portal is activated.
// </p>

// <p>Regards,<br>
// <strong>PGCPAITL Admissions Team</strong><br>
// JNTU-GV & DSNLU</p>
// `;


//         // 3️⃣ NOTIFICATION TO AUTHORITY — admin
//         const adminNotificationEmail = (appObj, applicationId) => `
// <h2 style="color:#004c97;font-family:Arial;">New PGCPAITL Application Submitted</h2>

// <p>A new application has been received.</p>

// <p><strong>Application ID:</strong> ${applicationId}</p>

// <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:Arial;">
//   <tr><td><b>Name:</b></td><td>${escapeHtml(appObj.fullName)}</td></tr>
//   <tr><td><b>Email:</b></td><td>${escapeHtml(appObj.email)}</td></tr>
//   <tr><td><b>Mobile:</b></td><td>${escapeHtml(appObj.mobile)}</td></tr>
//   <tr><td><b>Qualification:</b></td><td>${escapeHtml(appObj.degreeLevel)}</td></tr>
//   <tr><td><b>Status:</b></td><td>submitted</td></tr>
// </table>
// `;


//         // 4️⃣ STATUS UPDATE EMAIL (to applicant)
//         const statusUpdateEmail = (appObj, newStatus) => `
// <h2 style="color:#004c97;font-family:Arial;">Your Application Status Has Changed</h2>
// <p>Dear ${escapeHtml(appObj.fullName)},</p>

// <p>Your PGCPAITL application status has been updated.</p>

// <p><strong>New Status:</strong> ${newStatus}</p>

// <p>You may log in to the portal for details.</p>

// <p>Regards,<br>
// PGCPAITL Admissions Team</p>
// `;


//         // 5️⃣ PAYMENT ACTIVATION EMAIL (to applicant)
//         const paymentActivationEmail = (appObj, applicationId) => `
// <h2 style="color:#004c97;font-family:Arial;">Registration Fee Payment Activated</h2>

// <p>Dear ${escapeHtml(appObj.fullName)},</p>

// <p>Your application (ID <strong>${applicationId}</strong>) is now ready for payment.</p>

// <p>Please pay the <strong>₹1,000 non-refundable registration fee</strong> to proceed with the admission process.</p>

// <p><a href="https://pgcpaitl.jntugv.edu.in/pay" 
//    style="padding:10px 18px;background:#004c97;color:#fff;border-radius:6px;text-decoration:none;">
//    Pay Registration Fee
// </a></p>

// <p>Regards,<br>PGCPAITL Admissions Team</p>
// `;


// -------------------------------------------------------------
// Resolve prettyId → numeric internal application ID
// Example: PGCPAITL-2025-000123 → 123
// -------------------------------------------------------------