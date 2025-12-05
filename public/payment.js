document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("paymentForm");
  const msg = document.getElementById("msg");

  if (!form) {
    console.error("paymentForm not found in DOM");
    return;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    msg.textContent = "";
    msg.style.color = "#004c97";

    const fd = new FormData(form);

    // Ensure default amount = 1000
    if (!fd.get("amount") || fd.get("amount").trim() === "") {
      fd.set("amount", "1000");
    }

    try {
      const res = await fetch("/payment/submit", {
        method: "POST",
        body: fd,
      });

      const j = await res.json().catch(() => ({ ok: false }));

      if (j.ok) {
        // Show success message
        msg.style.color = "green";
        msg.textContent = "Payment details submitted successfully. Redirecting…";

        // Auto-clear saved fields (if you use auto-save)
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith("payment_") || k.startsWith("pgcForm_")) {
            localStorage.removeItem(k);
          }
        });

        // Redirect if provided by backend (NO API CHANGE)
        if (j.redirect) {
          setTimeout(() => {
            window.location.href = j.redirect;
          }, 900);
        } else {
          // fallback if redirect not provided
          setTimeout(() => {
            form.reset();
            msg.textContent = "Payment submitted, awaiting admin verification.";
          }, 1200);
        }
      } else {
        // Backend returned an error
        msg.style.color = "#c0392b";

        msg.textContent =
          j.error ||
          (j.errors ? j.errors.map((x) => x.msg).join(", ") : "Submission failed");
      }
    } catch (err) {
      msg.style.color = "#c0392b";
      msg.textContent = "Network or server error. Try again.";
      console.error(err);
    }
  });
});
