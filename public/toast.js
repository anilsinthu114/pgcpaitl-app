/**
 * Toast Notification System
 * Usage: showToast("Message", "success" | "error" | "info" | "warning", durationMs)
 */

function showToast(message, type = "info", duration = 4000) {
    // 1. Ensure container exists
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }

    // 2. Create toast element
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    // Icon based on type (optional simple unicode icons)
    let icon = "";
    if (type === "success") icon = "✅ ";
    if (type === "error") icon = "❌ ";
    if (type === "warning") icon = "⚠️ ";
    if (type === "info") icon = "ℹ️ ";

    toast.innerHTML = `
        <span>${icon}${message}</span>
        <button class="toast-close">&times;</button>
    `;

    // 3. Add to container
    container.appendChild(toast);

    // 4. Trigger animation (next frame)
    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    // 5. Cleanup function
    const removeToast = () => {
        toast.classList.remove("show");
        // Wait for transition to finish before removing from DOM
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 300);
    };

    // 6. Auto remove
    setTimeout(removeToast, duration);

    // 7. Manual close
    toast.querySelector(".toast-close").addEventListener("click", removeToast);
}

// Expose globally if needed, though strictly not necessary if included as script
window.showToast = showToast;
