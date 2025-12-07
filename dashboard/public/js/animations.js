// Animations simplifiées
document.addEventListener('DOMContentLoaded', function() {
    // Animation des éléments au scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fadeInUp');
            }
        });
    }, {
        threshold: 0.1
    });

    // Observer tous les éléments avec data-animate
    document.querySelectorAll('[data-animate]').forEach(el => {
        observer.observe(el);
    });
});