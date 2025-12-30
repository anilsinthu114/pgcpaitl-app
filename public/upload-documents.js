document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Document upload page loaded.");

    const form = document.getElementById("uploadForm");
    const msg = document.getElementById("uploadMsg");
    const hiddenId = document.getElementById("application_id");

    // ---------------------------------------------
    // Extract & Resolve ID
    // ---------------------------------------------
    const url = new URL(window.location.href);
    const prettyId = url.searchParams.get("id");

    if (prettyId) {
        document.getElementById("displayAppId").innerText = prettyId;
    } else {
        alert("Invalid link — Application ID missing.");
        window.location.href = "/";
        return;
    }

    try {
        const res = await fetch(`/api/resolve-id?pretty=${encodeURIComponent(prettyId)}`);
        const j = await res.json();
        if (j.ok) {
            hiddenId.value = j.id;
        } else {
            alert("Invalid Application ID.");
        }
    } catch (err) {
        console.error("Error resolving ID", err);
    }

    // ---------------------------------------------
    // Handle Form Submission
    // ---------------------------------------------
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        msg.textContent = "Uploading files, please wait...";
        msg.style.color = "#004c97";
        document.getElementById("submitBtn").disabled = true;

        const fd = new FormData(form);

        try {
            const res = await fetch("/api/application/upload-documents", {
                method: "POST",
                body: fd,
            });

            const j = await res.json();

            if (j.ok) {
                msg.style.color = "green";
                msg.textContent = "Documents uploaded successfully! Redirecting...";
                setTimeout(() => {
                    window.location.href = "/upload-success.html";
                }, 1500);
            } else {
                msg.style.color = "#c0392b";
                msg.textContent = j.error || "Upload failed.";
                document.getElementById("submitBtn").disabled = false;
            }
        } catch (err) {
            console.error("Upload error:", err);
            msg.style.color = "#c0392b";
            msg.textContent = "Network error. Try again.";
            document.getElementById("submitBtn").disabled = false;
        }
    });
});
