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

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("pgcForm");
  if (!form) return; // Safety

  const LS_PREFIX = "pgcForm_";

  // -------------------------------
  // Restore saved form values
  // -------------------------------
  Object.keys(localStorage).forEach(key => {
    if (!key.startsWith(LS_PREFIX)) return;

    const fieldName = key.replace(LS_PREFIX, "");
    const savedValue = localStorage.getItem(key);

    const field = form.querySelector(`[name="${fieldName}"]`);
    if (!field) return;

    // Radios / checkboxes
    if (field.type === "checkbox" || field.type === "radio") {
      form.querySelectorAll(`[name="${fieldName}"]`).forEach(el => {
        if (el.value === savedValue) el.checked = true;
      });
    } else {
      field.value = savedValue;
    }
  });

  // -------------------------------
  // Save changes automatically
  // -------------------------------
  form.querySelectorAll("input, select, textarea").forEach(field => {
    field.addEventListener("input", () => {
      const key = LS_PREFIX + field.name;

      if (field.type === "checkbox" || field.type === "radio") {
        if (field.checked) localStorage.setItem(key, field.value);
      } else {
        localStorage.setItem(key, field.value);
      }
    });
  });

  // -------------------------------
  // On form submit → clear storage
  // -------------------------------
  form.addEventListener("submit", () => {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(LS_PREFIX)) localStorage.removeItem(k);
    });
  });
});
