// إدارة الوضع الليلي والنهاري (Theme Switcher)
(function () {
    const savedTheme = localStorage.getItem('khadamatak_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    window.addEventListener('DOMContentLoaded', () => {
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        if (themeToggleBtn) {
            updateThemeIcon(savedTheme);
            themeToggleBtn.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
                const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', nextTheme);
                localStorage.setItem('khadamatak_theme', nextTheme);
                updateThemeIcon(nextTheme);
            });
        }
    });

    function updateThemeIcon(theme) {
        const iconContainer = document.getElementById('theme-icon-container');
        if (!iconContainer) return;
        
        if (theme === 'light') {
            // أيقونة القمر للتحويل إلى الوضع الليلي
            iconContainer.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>`;
        } else {
            // أيقونة الشمس للتحويل إلى الوضع النهاري
            iconContainer.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>`;
        }
    }
})();
