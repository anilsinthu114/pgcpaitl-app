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
    console.log("✅ Numeric ID set:", j.id);

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
    // STRICTLY ENFORCE VALUES BASED ON PAGE CONTEXT
    // ---------------------------------------------
    const isCourseFeePage = window.location.pathname.includes("course-fee.html");

    if (isCourseFeePage) {
      // Course Fee: 30,000
      fd.set("payment_type", "course_fee");
      fd.set("amount", "30000");
      console.log("ℹ️ Context: Course Fee Page (Force set 30000)");
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
          // Redirect to success page WITH ID for button usage
          const baseRedirect = j.redirect ? j.redirect.split('?')[0] : "/payment-success.html";
          window.location.href = baseRedirect + "?id=" + safeId;
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
