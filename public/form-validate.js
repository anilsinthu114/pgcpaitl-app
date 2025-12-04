document.addEventListener("DOMContentLoaded", () => {

  function validateField(field) {
    const errorId = field.name + "_error";
    let errorEl = document.getElementById(errorId);

    if (!field.validity.valid) {
      field.classList.add("invalid-field");

      if (!errorEl) {
        errorEl = document.createElement("div");
        errorEl.id = errorId;
        errorEl.className = "error-text";
        field.insertAdjacentElement("afterend", errorEl);
      }

      errorEl.textContent = field.validationMessage || "Required field";
      return false;
    }

    field.classList.remove("invalid-field");
    if (errorEl) errorEl.remove();
    return true;
  }

  document.querySelectorAll("input, select, textarea").forEach(field => {
    field.addEventListener("input", () => validateField(field));
    field.addEventListener("blur", () => validateField(field));
  });

  // Validate entire step
  window.validateStepFields = function (stepEl) {
    let valid = true;

    stepEl.querySelectorAll("input, select, textarea").forEach(field => {
      if (!validateField(field)) valid = false;
    });

    return valid;
  };
});
