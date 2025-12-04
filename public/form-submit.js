document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("pgcForm");
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      console.log("Submit triggered.");   // <--- MUST SEE THIS IN BROWSER
  
      const fd = new FormData(form);
      console.log("FormData prepared:", fd); // <--- CHECK IF FormData IS PREPARED
  
      const r = await fetch("/application/submit", {
        method: "POST",
        body: fd,
      });
  
      const j = await r.json().catch(() => ({ ok: false }));
  
      console.log("Response received:", j);
  
      if (j.ok) {
        window.location.href = j.redirect || "/thank-you.html";
      } else {
        alert("Error submitting: " + j.error);
      }
    });
  });

document.addEventListener("DOMContentLoaded", function() {
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
// });