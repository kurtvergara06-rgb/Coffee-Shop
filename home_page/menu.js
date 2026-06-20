const filterButtons = document.querySelectorAll(".filter-btn");
const cards = document.querySelectorAll(".menu-card");

filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {

        // Update active button
        filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const category = btn.getAttribute("data-category");

        // Animate hide
        cards.forEach((card, index) => {
            card.style.transition = "opacity 0.3s, transform 0.3s";
            card.style.opacity = "0";
            card.style.transform = "translateY(20px)";
        });

        setTimeout(() => {
            cards.forEach(card => {
                if (category === "all" || card.classList.contains(category)) {
                    card.style.display = "block";
                } else {
                    card.style.display = "none";
                }
            });

            // Animate reappearance (stagger)
            setTimeout(() => {
                let delay = 0;

                cards.forEach(card => {
                    if (card.style.display === "block") {
                        card.style.transition = "opacity 0.35s ease, transform 0.35s ease";
                        card.style.transitionDelay = delay + "s";

                        card.style.opacity = "1";
                        card.style.transform = "translateY(0)";

                        delay += 0.08; // stagger timing
                    }
                });
            }, 100);

        }, 300);
    });
});
// PAGE FADE-IN
gsap.from(".menu-wrapper", {
    opacity: 0,
    y: 40,
    duration: 0.8,
    ease: "power2.out"
});

