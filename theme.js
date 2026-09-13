(function () {
    'use strict';

    const root = document.documentElement;
    const storageKey = 'theme';

    function currentTheme() {
        return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    function applyTheme(theme) {
        if (theme === 'light') {
            root.setAttribute('data-theme', 'light');
        } else {
            root.removeAttribute('data-theme');
        }

        try {
            localStorage.setItem(storageKey, theme);
        } catch (err) {}

        const btn = document.getElementById('themeToggle');
        if (!btn) return;
        const next = theme === 'light' ? 'dark' : 'light';
        btn.setAttribute('aria-label', 'Switch to ' + next + ' mode');
        btn.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
    }

    function toggleTheme(event) {
        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!document.startViewTransition || reduceMotion) {
            applyTheme(next);
            return;
        }

        const x = event.clientX;
        const y = event.clientY;
        const transition = document.startViewTransition(function () {
            applyTheme(next);
        });

        transition.ready.then(function () {
            const radius = Math.hypot(
                Math.max(x, window.innerWidth - x),
                Math.max(y, window.innerHeight - y)
            );

            root.animate(
                {
                    clipPath: [
                        'circle(0px at ' + x + 'px ' + y + 'px)',
                        'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'
                    ]
                },
                {
                    duration: 780,
                    easing: 'cubic-bezier(0.77, 0, 0.175, 1)',
                    pseudoElement: '::view-transition-new(root)'
                }
            );
        }).catch(function () {});
    }

    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.addEventListener('click', toggleTheme);
    }

    applyTheme(currentTheme());
})();
