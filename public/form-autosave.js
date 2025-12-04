document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("pgcForm");

  // Load saved fields
  Object.keys(localStorage).forEach(key => {
    const field = form.querySelector(`[name="${key}"]`);
    if (!field) return;

    if (field.type === "checkbox" || field.type === "radio") {
      form.querySelectorAll(`[name="${key}"]`).forEach(el => {
        if (el.value === localStorage.getItem(key)) el.checked = true;
      });
    } else {
      field.value = localStorage.getItem(key);
    }
  });

  // Save on change
  form.querySelectorAll("input, select, textarea").forEach(field => {
    field.addEventListener("input", () => {
      if (field.type === "checkbox" || field.type === "radio") {
        if (field.checked) localStorage.setItem(field.name, field.value);
      } else {
        localStorage.setItem(field.name, field.value);
      }
    });
  });
});
