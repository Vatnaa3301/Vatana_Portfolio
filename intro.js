/**
 * Intro Greeting Splash Animation (Khmer -> English -> Reveal Website)
 * Smoothly displays Khmer "សួស្តី" in the dead center, fades out to English "Hello",
 * then smoothly lifts the curtain to reveal the portfolio.
 */
(function () {
    'use strict';

    function startIntro() {
        if (document.body) {
            document.body.classList.add('intro-active');
        }
        const overlay = document.getElementById('introOverlay');
        const wordKhmer = document.getElementById('introKhmer');
        const wordEnglish = document.getElementById('introEnglish');

        if (!overlay || !wordKhmer || !wordEnglish) {
            document.body.classList.remove('intro-active');
            return;
        }

        // Honor prefers-reduced-motion
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) {
            overlay.style.display = 'none';
            document.body.classList.remove('intro-active');
            document.body.classList.add('intro-revealed');
            return;
        }

        let isFinished = false;

        const revealWebsite = () => {
            if (isFinished) return;
            isFinished = true;

            // Lift the curtain
            overlay.classList.add('intro-curtain-up');
            document.body.classList.remove('intro-active');
            document.body.classList.add('intro-revealed');

            // Complete cleanup after curtain lift finishes
            setTimeout(() => {
                overlay.style.display = 'none';
                overlay.setAttribute('aria-hidden', 'true');
            }, 950);
        };

        // Allow fast skip if user clicks or presses key
        overlay.addEventListener('click', revealWebsite, { once: true });
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.code === 'Space') revealWebsite();
        }, { once: true });

        // Timeline:
        // 1. Khmer "សួស្តី" fades in
        setTimeout(() => {
            if (isFinished) return;
            wordKhmer.classList.add('state-enter');
        }, 150);

        // 2. Khmer "សួស្តី" fades out
        setTimeout(() => {
            if (isFinished) return;
            wordKhmer.classList.remove('state-enter');
            wordKhmer.classList.add('state-exit');
        }, 1200);

        // 3. English "Hello" fades in
        setTimeout(() => {
            if (isFinished) return;
            wordEnglish.classList.add('state-enter');
        }, 1550);

        // 4. English "Hello" fades out
        setTimeout(() => {
            if (isFinished) return;
            wordEnglish.classList.remove('state-enter');
            wordEnglish.classList.add('state-exit');
        }, 2550);

        // 5. Curtain lifts to reveal the website
        setTimeout(() => {
            revealWebsite();
        }, 2950);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startIntro);
    } else {
        startIntro();
    }
})();
