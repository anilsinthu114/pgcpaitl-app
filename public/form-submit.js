document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("pgcForm");
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      console.log("Submit triggered.");   // <--- MUST SEE THIS IN BROWSER
  
      const fd = new FormData(form);
  
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
