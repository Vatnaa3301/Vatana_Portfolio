/**
 * ScrollExpand — Vanilla JS implementation of the React component provided by user
 * Smooth scroll-scrubbed expanding media card with smoothstep easing and momentum.
 */
(function () {
    'use strict';

    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

    const smoothstep = (edge0, edge1, x) => {
        const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
        return t * t * (3 - 2 * t);
    };

    function initScrollExpand() {
        const root = document.getElementById('aboutScrollExpand');
        const track = document.getElementById('aboutExpandTrack');
        const stage = document.getElementById('aboutExpandStage');
        const frame = document.getElementById('aboutExpandFrame');
        const media = document.getElementById('aboutExpandMedia');
        const scrim = document.getElementById('aboutExpandScrim');
        const overlay = document.getElementById('aboutExpandOverlay');
        const title = document.getElementById('aboutExpandTitle');
        const hint = document.getElementById('aboutExpandHint');

        if (!root || !track || !stage || !frame || !media) return;

        // Props matching user's component defaults
        const props = {
            startWidth: 42,
            startHeight: 58,
            startRadius: 24,
            endRadius: 0,
            mediaZoom: 1.35,
            scrollDistance: 1.1,
            holdDistance: 0.35,
            smoothing: 0.08,
            overlayScrim: 0.55,
            useWindowScroll: true,
            enabled: true
        };

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        let raf = 0;
        let current = 0;
        let target = 0;
        let stageH = 0;
        let running = false;
        let trackTopDoc = 0;
        let trackSpan = 1;
        let isNearViewport = true;

        const measure = () => {
            const vw = window.innerWidth;
            const isMobile = vw < 768;

            stageH = props.useWindowScroll ? window.innerHeight : root.clientHeight;
            if (stageH <= 0) return;

            stage.style.height = `${stageH}px`;
            const totalScroll = 1 + Math.max(0, props.scrollDistance) + Math.max(0, props.holdDistance);
            track.style.height = `${stageH * totalScroll}px`;

            const w = root.clientWidth || window.innerWidth || stageH;
            stage.style.setProperty('--se-title-size', `${clamp(w * 0.075, 22, 84)}px`);

            // Cache track position relative to document to eliminate getBoundingClientRect() during scroll
            const rect = track.getBoundingClientRect();
            trackTopDoc = rect.top + (window.scrollY || window.pageYOffset);
            trackSpan = stageH * Math.max(0.01, props.scrollDistance);
        };

        const readProgress = () => {
            if (!props.enabled) return 1;
            if (props.useWindowScroll) {
                const scrollY = window.scrollY || window.pageYOffset;
                const top = trackTopDoc - scrollY;
                return clamp(-top / (trackSpan || 1), 0, 1);
            }
            return clamp(root.scrollTop / (trackSpan || 1), 0, 1);
        };

        const applyProgress = (p) => {
            const e = smoothstep(0, 1, p);
            const vw = window.innerWidth;
            const isMobile = vw < 768;

            // Responsive start/end dimensions
            const sW = isMobile ? 86 : props.startWidth;
            const sH = isMobile ? 54 : props.startHeight;
            const targetW = isMobile ? 98 : 100;
            const targetH = isMobile ? 92 : 100;
            const targetR = isMobile ? 8 : props.endRadius;

            const w = sW + (targetW - sW) * e;
            const h = sH + (targetH - sH) * e;
            const ix = Math.max(0, (100 - w) / 2);
            const iy = Math.max(0, (100 - h) / 2);
            const r = props.startRadius + (targetR - props.startRadius) * e;

            const clipVal = `inset(${iy.toFixed(2)}% ${ix.toFixed(2)}% ${iy.toFixed(2)}% ${ix.toFixed(2)}% round ${r.toFixed(1)}px)`;
            frame.style.clipPath = clipVal;
            frame.style.setProperty('-webkit-clip-path', clipVal);

            // Media Zoom
            const scale = props.mediaZoom + (1 - props.mediaZoom) * e;
            media.style.transform = `scale(${scale.toFixed(3)})`;

            // Scrim Opacity
            if (scrim) {
                scrim.style.opacity = `${(props.overlayScrim * e).toFixed(3)}`;
            }

            // Optional Title fade-out
            if (title) {
                const out = smoothstep(0.3, 0.75, p);
                title.style.opacity = `${(1 - out).toFixed(3)}`;
                title.style.transform = `translate3d(0, ${(-28 * out).toFixed(1)}px, 0) scale(${(1 + 0.06 * out).toFixed(3)})`;
            }

            // Scroll Hint fade-out
            if (hint) {
                const gone = smoothstep(0, 0.14, p);
                hint.style.opacity = `${(1 - gone).toFixed(3)}`;
                hint.style.transform = `translate3d(0, ${(8 * gone).toFixed(1)}px, 0)`;
            }

            // Overlay statement fade-in
            if (overlay) {
                const inn = smoothstep(0.42, 0.85, p);
                overlay.style.opacity = `${inn.toFixed(3)}`;
                overlay.style.transform = `translate3d(0, ${(18 * (1 - inn)).toFixed(1)}px, 0)`;
            }
        };

        const tick = () => {
            const k = props.smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * props.smoothing));
            current += (target - current) * k;

            if (Math.abs(target - current) < 0.0004) {
                current = target;
                running = false;
            }

            applyProgress(current);

            if (running) {
                raf = requestAnimationFrame(tick);
            } else {
                raf = 0;
            }
        };

        const kick = () => {
            if (running) return;
            running = true;
            if (!raf) raf = requestAnimationFrame(tick);
        };

        const onScroll = () => {
            if (!isNearViewport) return;
            target = readProgress();
            if (Math.abs(target - current) < 0.0002 && !running) return;

            if (props.smoothing <= 0 || reduceMotion) {
                current = target;
                applyProgress(current);
                return;
            }
            kick();
        };

        const onResize = () => {
            measure();
            target = readProgress();
            current = target;
            applyProgress(current);
        };

        // IntersectionObserver skips scroll calculations when About section is not near viewport
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries) => {
                isNearViewport = entries[0].isIntersecting;
                if (isNearViewport) {
                    onScroll();
                }
            }, { rootMargin: '300px 0px 300px 0px' });
            io.observe(root);
        }

        measure();
        target = readProgress();
        current = target;
        applyProgress(current);

        const scroller = props.useWindowScroll ? window : root;
        scroller.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);

        const ro = new ResizeObserver(onResize);
        ro.observe(root);

        // Delayed check to guarantee correct layout after all assets settle
        setTimeout(() => {
            measure();
            onScroll();
        }, 150);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollExpand);
    } else {
        initScrollExpand();
    }
})();
