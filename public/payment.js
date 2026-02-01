document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Payment page loaded.");

  const form = document.getElementById("payForm");
  const msg = document.getElementById("payMsg");
  const hiddenId = document.getElementById("application_id");

  if (!form) {
    console.error("❌ payForm not found in DOM");
    return;
  }
  if (!msg) {
    console.error("❌ payMsg element missing");
    return;
  }
  if (!hiddenId) {
    console.error("❌ Hidden application_id field missing");
    return;
  }

  // ---------------------------------------------
  // 1️⃣ Extract prettyId from URL
  // ---------------------------------------------
  const url = new URL(window.location.href);
  const prettyId =
    url.searchParams.get("id") ||
    url.searchParams.get("application_id");

  console.log("🔍 Extracted prettyId:", prettyId);
  if (prettyId) {
    const dispEl = document.getElementById("displayAppId");
    if (dispEl) dispEl.innerText = prettyId;
  }

  if (!prettyId) {
    alert("Invalid payment link — Application ID missing.");
    window.location.href = "/";
    return;
  }

  // ---------------------------------------------
  // 2️⃣ Resolve prettyId → numeric ID via backend
  // ---------------------------------------------
  try {
    const res = await fetch(`/api/resolve-id?pretty=${encodeURIComponent(prettyId)}`);
    const j = await res.json();

    console.log("🔁 resolve-id response:", j);

    if (!j.ok) {
      alert("Invalid Application ID.");
      window.location.href = "/";
      return;
    }

    hiddenId.value = j.id;
    if (j.prettyId) {
      const dispEl = document.getElementById("displayAppId");
      if (dispEl) dispEl.innerText = j.prettyId;
    }
    console.log("✅ Numeric ID set:", j.id);

    // ---------------------------------------------
    // NEW: Handle Course Fee Installment UI
    // ---------------------------------------------
    if (window.location.pathname.includes("course-fee.html")) {
      const coursePaid = Number(j.coursePaid || 0);
      console.log(`💰 Course Fee already paid: ₹${coursePaid}`);

      if (coursePaid >= 15000 && coursePaid < 30000) {
        // Switch UI to 2nd Installment
        console.log("🔄 Switching to 2nd Installment UI");
        const emiRadio = document.querySelector('input[name="fee_opt"][value="emi"]');
        const fullRadio = document.querySelector('input[name="fee_opt"][value="full"]');

        if (emiRadio) {
          emiRadio.checked = true;
          // Hide full payment option as 1st is done
          if (fullRadio) fullRadio.parentElement.style.display = 'none';

          // Modify labels to reflect 2nd installment
          if (typeof updateFee === 'function') {
            updateFee(15000, 'Second Installment (EMI)');

            // Further refine UI for clarity
            const emiLabel = document.getElementById('emiLabel');
            if (emiLabel) emiLabel.style.borderColor = '#2ecc71'; // Success green

            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) submitBtn.style.background = 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)';
          }
        }
      } else if (coursePaid >= 30000) {
        // Fully paid logic
        const content = document.querySelector('.payment-content');
        if (content) {
          content.innerHTML = `
            <div style="text-align:center; padding: 40px; background:#f0fdf4; border-radius:12px; border:1px solid #bbf7d0;">
              <h2 style="color:#166534; margin-bottom:10px;">Course Fee Fully Paid</h2>
              <p style="color:#15803d;">You have already completed the full course fee payment of ₹30,000.</p>
              <div style="margin-top:25px;">
                <a href="/upload-documents.html?id=${encodeURIComponent(prettyId)}" class="btn-primary" style="text-decoration:none;">Proceed to Document Upload</a>
              </div>
            </div>
          `;
        }
        const emiSelection = document.querySelector('.emi-selection');
        if (emiSelection) emiSelection.style.display = 'none';

        const banner = document.getElementById('infoBanner');
        if (banner) banner.innerText = "Payment completed. Please upload your documents for verification.";
      }
    }

  } catch (err) {
    console.error("❌ Error resolving ID:", err);
    alert("Server error.");
    window.location.href = "/";
    return;
  }

  // ---------------------------------------------
  // 3️⃣ Handle payment form submission
  // ---------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";
    msg.style.color = "#004c97";

    const fd = new FormData(form);


    // ---------------------------------------------
    // ENFORCE VALUES BASED ON PAGE CONTEXT (WITH EMI SUPPORT)
    // ---------------------------------------------
    const isCourseFeePage = window.location.pathname.includes("course-fee.html");

    if (isCourseFeePage) {
      fd.set("payment_type", "course_fee");

      // Get selected fee option from form
      const feeOpt = fd.get("fee_opt");
      const currentAmount = fd.get("amount") || "30000"; // fallback to full

      console.log(`ℹ️ Context: Course Fee Page | Option: ${feeOpt} | Amount: ${currentAmount}`);
    } else {
      // Registration Fee: 1,000
      fd.set("payment_type", "registration");
      fd.set("amount", "1000");
      console.log("ℹ️ Context: Registration Page (Force set 1000)");
    }

    console.log("📤 Uploading payment:", Object.fromEntries(fd.entries()));

    try {
      const res = await fetch("/payment/submit", {
        method: "POST",
        body: fd,
      });

      const j = await res.json();
      console.log("📥 Payment submit response:", j);

      if (j.ok) {
        msg.style.color = "green";
        msg.textContent = "Payment submitted. Redirecting…";

        // clear local storage (if used)
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith("payment_") || k.startsWith("pgcForm_")) {
            localStorage.removeItem(k);
          }
        });

        if (j.message) {
          console.log("🔔 Notification:", j.message);
          const type = (j.status && j.status.includes('duplicate')) ? 'warning' : 'success';

          if (typeof window.showToast === 'function') {
            window.showToast(j.message, type, 5000);
          } else if (typeof window.toast === 'function') {
            window.toast(j.message, type, 5000);
          } else {
            alert(j.message);
          }
        }

        const safeId = encodeURIComponent(prettyId || hiddenId.value || 'APP');

        // If it's a duplicate, we might want to redirect immediately or let them read the alert
        setTimeout(() => {
          // Use server provided redirect if available, otherwise fallback
          if (j.redirect) {
            window.location.href = j.redirect;
          } else {
            window.location.href = "/payment-success.html?id=" + safeId;
          }
        }, j.message ? 2000 : 2500); // Faster redirect if alert handled, but alert blocks execution anyway

      } else {
        msg.style.color = "#c0392b";
        msg.textContent = j.error || "Submission failed.";
      }
    } catch (err) {
      console.error("❌ Payment submit error:", err);
      msg.style.color = "#c0392b";
      msg.textContent = "Network error. Try again.";
    }
  });
});
