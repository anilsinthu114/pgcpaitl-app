document.addEventListener("DOMContentLoaded", () => {
    const marquees = document.querySelectorAll("marquee");
    marquees.forEach(mq => {
        mq.addEventListener("mouseover", () => mq.stop());
        mq.addEventListener("mouseout", () => mq.start());
    });
});
