document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab-btn");

  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelector(".tab-btn.active")?.classList.remove("active");
      btn.classList.add("active");

      const target = btn.dataset.tab;

      document.querySelectorAll("section").forEach(sec => sec.classList.remove("active"));

      document.getElementById(`tab-${target}`).classList.add("active");
    });
  });

  // Logout
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/login.html";
  });
});
