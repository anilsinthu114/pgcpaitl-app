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

    if (!fd.get("amount")) fd.set("amount", "1000");

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

        setTimeout(() => {
          window.location.href = j.redirect || "/payment-success.html";
        }, 900);

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
