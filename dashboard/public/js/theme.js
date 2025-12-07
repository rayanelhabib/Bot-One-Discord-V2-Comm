// Gestionnaire de thème simplifié
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('theme-dark');
            document.body.classList.toggle('theme-light');
            
            // Changer l'icône
            const icon = themeToggle.querySelector('i');
            if (document.body.classList.contains('theme-light')) {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        });
    }
});