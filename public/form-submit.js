document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("pgcForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Get Buttons
    const submitBtn = form.querySelector('button[type="submit"]');
    const prevBtns = document.querySelectorAll('.step-btn'); // Select all nav buttons

    // 2. Disable UI
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.innerText;
      submitBtn.innerText = "Submitting...";
      submitBtn.style.opacity = "0.7";
      submitBtn.style.cursor = "wait";
    }
    prevBtns.forEach(btn => btn.disabled = true);

    console.log("Submit triggered. Buttons disabled.");

    const fd = new FormData(form);
    console.log("FormData prepared:", fd);

    try {
      const r = await fetch("/draft", {
        method: "POST",
        body: fd,
      });

      let j;
      try {
        j = await r.json();
      } catch (jsonError) {
        // Response wasn't JSON
      }

      if (!r.ok) {
        // Server returned an error (4xx or 5xx)
        const errorMsg = (j && j.error) ? j.error : `Server responded with status ${r.status}`;
        console.error(`Server Error (${r.status}):`, errorMsg);
        throw new Error(errorMsg);
      }

      if (!j) {
        throw new Error("Empty response from server");
      }

      console.log("Response received:", j);

      if (j.ok) {
        // Clear autosaved data
        Object.keys(localStorage).forEach(key => {
          if (key !== "adminToken" && (form.elements[key] || key.startsWith("pgcForm_"))) {
            localStorage.removeItem(key);
          }
        });
        window.location.href = j.redirect;
      } else {
        console.error("Application Error:", j.error);
        const friendlyMsg = getFriendlyErrorMessage(j.error);
        showToast(friendlyMsg, "error");
        resetButtons(); // Re-enable on application error
      }
    } catch (err) {
      console.error("Network or Unexpected Error:", err);
      const friendlyMsg = getFriendlyErrorMessage(err.message || "Network Error");
      showToast(friendlyMsg, "error");
      resetButtons(); // Re-enable on network error
    }

    function resetButtons() {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = submitBtn.dataset.originalText || "Submit Application";
        submitBtn.style.opacity = "1";
        submitBtn.style.cursor = "pointer";
      }
      prevBtns.forEach(btn => btn.disabled = false);
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const passingYearSelect = document.getElementById("passingYear");
  const startYear = 1995;
  const endYear = new Date().getFullYear() + 1; // current year + 1
  passingYearSelect.innerHTML = '<option value="">Select year</option>';

  for (let year = endYear; year >= startYear; year--) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    passingYearSelect.appendChild(option);
  }
});

// document.getElementById('loginForm').addEventListener('submit', async (e) => {
//   e.preventDefault();
//   const username = document.getElementById('username').value.trim();
//   const password = document.getElementById('password').value.trim();
//   const errorDiv = document.getElementById('error');

//   try {
//     const res = await fetch('/admin/login', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ username, password })
//     });

//     const data = await res.json();
//     console.log('Login response:', data);

//     if (data.ok) {
//       localStorage.setItem('adminToken', data.token);
//       window.location.href = '/admin/dashboard';
//     } else {
//       errorDiv.textContent = data.error || 'Invalid credentials';
//       errorDiv.style.display = 'block';
//     }
//   } catch (err) {
//     errorDiv.textContent = 'Login failed. Please try again.';
//     errorDiv.style.display = 'block';
//   }
// Helper to translate technical errors to user-friendly messages
function getFriendlyErrorMessage(technicalError) {
  if (!technicalError) return "We could not process your submission. Please try again.";

  const err = technicalError.toLowerCase();

  if (err.includes("duplicate entry")) {
    return "This email or mobile number is already registered.";
  }
  if (err.includes("data truncated")) {
    return "One of your input fields is too long. Please shorten your answers.";
  }
  if (err.includes("missing fields")) {
    return "Please fill in all required fields.";
  }
  if (err.includes("invalid credentials")) {
    return "Incorrect username or password.";
  }
  if (err.includes("foreign key")) {
    return "Invalid reference data. Please refresh the page and try again.";
  }
  if (err.includes("network") || err.includes("fetch") || err.includes("failed to fetch")) {
    return "Unable to reach the server. Please check your internet connection.";
  }
  return "We could not process your submission. Please try again.";
}