document.addEventListener("DOMContentLoaded", () => {
  const steps = document.querySelectorAll(".form-step");
  const indicators = document.querySelectorAll(".steps li");
  const progressBar = document.getElementById("progressBar");

  const nextBtn = document.getElementById("nextBtn");
  const prevBtn = document.getElementById("prevBtn");
  const submitContainer = document.getElementById("submitContainer");

  let current = 0;

  // Initialize: Attach Click Listeners to Indicators
  indicators.forEach((ind, index) => {
    ind.addEventListener("click", () => {
      // Allow jumping back to any completed step or the current step
      // Also allow jumping forward IF the user has already completed the intermediate steps (i.e., we are just navigating back and forth)
      // For simplicity, we typically allow going back freely.
      // To go forward, we usually force validation. 
      // Here, we'll allow clicking ONLY on steps that are <= (highest reached step).

      // Better Logic: Allow click if index < current (going back)
      if (index < current) {
        current = index;
        showStep(current);
      }
      // If we want to allow going forward to a previously visited step, we'd need to track "maxReached" step.
      // For now, let's strictly allow going BACK via stepper for safety/validation enforcement.
    });
  });

  function showStep(i) {
    // 1. Toggle Step Content
    steps.forEach((s, idx) => {
      if (idx === i) {
        s.classList.add("active");
        // Add subtle slide effect if needed
      } else {
        s.classList.remove("active");
      }
    });

    // 2. Update Indicators
    indicators.forEach((step, idx) => {
      step.classList.remove("active", "completed");
      if (idx < i) {
        step.classList.add("completed");
      }
      if (idx === i) {
        step.classList.add("active");
      }
    });

    // 3. Update Buttons
    prevBtn.classList.toggle("disabled", i === 0);
    // Disable prev button logic if at step 0 (CSS handles visual opacity)
    prevBtn.disabled = (i === 0);

    if (i === steps.length - 1) {
      nextBtn.style.display = "none";
      submitContainer.style.display = "block";
    } else {
      nextBtn.style.display = "inline-block";
      submitContainer.style.display = "none";
    }

    // 4. Update Progress Bar
    // Calculation: 0% at step 0, 100% at final step
    let percentage = (i / (steps.length - 1)) * 100;
    progressBar.style.width = percentage + "%";

    // Scroll to top for better UX on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextBtn.addEventListener("click", () => {
    // Validate current step before moving
    if (window.validateStepFields && !window.validateStepFields(steps[current])) {
      // Validation failed, toast should be triggered by validateStepFields
      return;
    }

    if (current < steps.length - 1) {
      current++;
      showStep(current);
    }
  });

  prevBtn.addEventListener("click", () => {
    if (current > 0) {
      current--;
      showStep(current);
    }
  });

  // Auto-fill passing years if dropdown exists
  const py = document.getElementById("passingYear");
  if (py && py.options.length <= 1) { // Only populate if empty
    const currentYear = new Date().getFullYear();
    for (let y = 1995; y <= currentYear; y++) {
      const o = document.createElement("option");
      o.value = y;
      o.textContent = y;
      py.appendChild(o);
    }
  }

  // Initial call
  showStep(current);
});
