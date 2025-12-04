document.addEventListener("DOMContentLoaded", () => {

  const steps = Array.from(document.querySelectorAll(".step-panel"));
  const stepIndicator = Array.from(document.querySelectorAll(".steps li"));

  let currentStep = 0;

  function updateStep() {
    steps.forEach((panel, idx) => {
      panel.classList.remove("active", "slide-left", "slide-right");

      if (idx === currentStep) {
        panel.classList.add("active");
      } else if (idx < currentStep) {
        panel.classList.add("slide-left");
      } else {
        panel.classList.add("slide-right");
      }
    });

    stepIndicator.forEach((li, idx) =>
      li.classList.toggle("active", idx === currentStep)
    );
  }

  document.querySelectorAll(".next-btn").forEach(btn =>
    btn.addEventListener("click", () => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        updateStep();
      }
    })
  );

  document.querySelectorAll(".back-btn").forEach(btn =>
    btn.addEventListener("click", () => {
      if (currentStep > 0) {
        currentStep--;
        updateStep();
      }
    })
  );

  // auto-fill passing years
  const py = document.getElementById("passingYear");
  if (py) {
    for (let y = 1995; y <= new Date().getFullYear(); y++) {
      const o = document.createElement("option");
      o.value = y;
      o.textContent = y;
      py.appendChild(o);
    }
  }

});


document.addEventListener("DOMContentLoaded", () => {
  const steps = document.querySelectorAll(".form-step");
  const indicators = document.querySelectorAll(".steps li");
  const progressBar = document.getElementById("progressBar");

  const nextBtn = document.getElementById("nextBtn");
  const prevBtn = document.getElementById("prevBtn");
  const submitContainer = document.getElementById("submitContainer");

  let current = 0;

  function showStep(i) {
    steps.forEach(s => s.classList.remove("active"));
    steps[i].classList.add("active");

    indicators.forEach((step, idx) => {
      step.classList.remove("active", "completed");
      if (idx < i) step.classList.add("completed");
      if (idx === i) step.classList.add("active");
    });

    prevBtn.classList.toggle("disabled", i === 0);

    if (i === steps.length - 1) {
      nextBtn.style.display = "none";
      submitContainer.style.display = "block";
    } else {
      nextBtn.style.display = "inline-block";
      submitContainer.style.display = "none";
    }

    let percentage = (i / (steps.length - 1)) * 100;
    progressBar.style.width = percentage + "%";
  }

  nextBtn.addEventListener("click", () => {
    if (!window.validateStepFields(steps[current])) return;
    current++;
    showStep(current);
  });

  prevBtn.addEventListener("click", () => {
    if (current > 0) {
      current--;
      showStep(current);
    }
  });

  showStep(current);
});
