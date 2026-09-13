/* ==========================================================================
   NATIVE HIGH-PERFORMANCE VIDEO HERO (ZERO LAG, DIRECT HARDWARE DECODE)
   ========================================================================== */
const heroContainer = document.getElementById('hero-media-container');
const heroVideo = document.getElementById('heroVideo');

let isHeroInView = true;

// Ensure video autoplays and loops seamlessly with zero interruption
if (heroVideo) {
    heroVideo.loop = true;
    heroVideo.muted = true;

    const playVideo = () => {
        const playPromise = heroVideo.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                heroVideo.muted = true;
                heroVideo.play().catch(() => {});
            });
        }
    };

    playVideo();

    // Fallback seamless loop listener if native loop reaches end
    heroVideo.addEventListener('ended', () => {
        heroVideo.currentTime = 0;
        playVideo();
    });

    heroVideo.addEventListener('playing', () => {
        if (heroContainer) heroContainer.classList.add('video-ready');
    }, { once: true });
}

// Hero viewport observer: pause video when scrolled past, play again when scrolling back
const heroSection = document.getElementById('hero');
if (heroSection && heroVideo) {
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                isHeroInView = true;
                if (heroContainer) heroContainer.style.visibility = 'visible';
                if (heroVideo.paused) {
                    heroVideo.play().catch(() => {});
                }
            } else {
                isHeroInView = false;
                if (!heroVideo.paused) {
                    heroVideo.pause();
                }
                if (heroContainer) heroContainer.style.visibility = 'hidden';
            }
        });
    }, { threshold: 0.1 });
    heroObserver.observe(heroSection);
}

// Interactive Preview Button Alert Trigger on Scroll into Projects Section
const projectsSection = document.getElementById('projects');
const previewPointerCallout = document.getElementById('previewPointerCallout');
const vaultpaperPreviewBtn = document.getElementById('vaultpaperPreviewBtn');

if (projectsSection && (previewPointerCallout || vaultpaperPreviewBtn)) {
    const projectAlertObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                // Trigger alert animation with corner waves, diagonal arrow, and floating text
                if (previewPointerCallout) previewPointerCallout.classList.add('is-active');
                if (vaultpaperPreviewBtn) vaultpaperPreviewBtn.classList.add('has-alert');
            }
        });
    }, { threshold: 0.15 });

    projectAlertObserver.observe(projectsSection);

    // Interactive hover & click reactions
    if (vaultpaperPreviewBtn) {
        vaultpaperPreviewBtn.addEventListener('mouseenter', () => {
            if (previewPointerCallout) previewPointerCallout.classList.add('is-hovered');
        });
        vaultpaperPreviewBtn.addEventListener('mouseleave', () => {
            if (previewPointerCallout) previewPointerCallout.classList.remove('is-hovered');
        });
        vaultpaperPreviewBtn.addEventListener('click', () => {
            if (previewPointerCallout) previewPointerCallout.classList.add('is-clicked');
        });
    }
}

// Click on lower part of hero scrolls smoothly to projects
if (heroContainer) {
    heroContainer.addEventListener('click', (e) => {
        const rect = heroContainer.getBoundingClientRect();
        const clientY = e.clientY || 0;
        const yRel = (clientY - rect.top) / rect.height;
        if (yRel > 0.65 && window.scrollY < 200) {
            const projectsSec = document.getElementById('projects');
            if (projectsSec) {
                projectsSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
}

// Tab visibility handler: pause video when tab is hidden, resume when tab is active
document.addEventListener('visibilitychange', () => {
    if (!heroVideo) return;
    if (document.hidden) {
        if (!heroVideo.paused) heroVideo.pause();
    } else {
        if (isHeroInView && heroVideo.paused) {
            heroVideo.play().catch(() => {});
        }
    }
});

/* ==========================================================================
   CENTRALIZED 60 FPS MASTER SCROLL CONTROLLER & GEOMETRY CACHE
   ========================================================================== */
const navbar = document.getElementById('navbar');
const indicatorLine = document.getElementById('navIndicatorLine');
const navLinks = Array.from(document.querySelectorAll('.nav-links .nav-link:not(.nav-link-cta)'));

const scrollRail = document.getElementById('scrollRail');
const railActiveNum = document.getElementById('railActiveNum');
const railActiveLabel = document.getElementById('railActiveLabel');
const railTrackFill = document.getElementById('railTrackFill');
const railDots = Array.from(document.querySelectorAll('.rail-dot'));

const sectionElements = Array.from(document.querySelectorAll('section[id]'));
const railSectionData = [
    { id: 'hero', num: '00', label: 'HERO' },
    { id: 'projects', num: '01', label: 'PROJECTS' },
    { id: 'about', num: '02', label: 'ABOUT' },
    { id: 'skills', num: '03', label: 'SKILLS' },
    { id: 'services', num: '04', label: 'CAPABILITIES' },
    { id: 'contact', num: '05', label: 'CONTACT' },
];

let cachedSectionOffsets = [];
let cachedDotCenters = [];
let cachedNavLinks = [];
let currentRailIndex = -1;
let currentActiveNavId = '';
let isScrollTicking = false;

function cacheLayoutGeometry() {
    cachedSectionOffsets = sectionElements.map((sec, idx) => ({
        id: sec.id,
        top: sec.offsetTop,
        height: sec.offsetHeight,
        index: idx
    }));

    if (railDots.length) {
        cachedDotCenters = railDots.map((dot) => dot.offsetTop + dot.offsetHeight / 2);
    }

    if (navLinks.length) {
        cachedNavLinks = navLinks.map((link) => ({
            element: link,
            href: link.getAttribute('href'),
            offsetLeft: link.offsetLeft,
            offsetWidth: link.offsetWidth
        }));
    }
}

function updateScrollFrame() {
    const scrollY = window.scrollY || window.pageYOffset;
    const vh = window.innerHeight;

    // A. Hero Video & Media Suspension (Immediate resume on scroll back)
    if (scrollY >= vh * 0.85) {
        if (isHeroInView) {
            isHeroInView = false;
            if (heroVideo && !heroVideo.paused) {
                heroVideo.pause();
            }
            if (heroContainer) {
                heroContainer.style.visibility = 'hidden';
            }
        }
    } else {
        if (!isHeroInView) {
            isHeroInView = true;
            if (heroContainer) {
                heroContainer.style.visibility = 'visible';
            }
            if (heroVideo && heroVideo.paused) {
                heroVideo.play().catch(() => {});
            }
        }
    }

    // B. Navbar scroll state
    if (navbar) {
        if (scrollY > 30) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    // C. Section Index & ID Detection (from cached offsets)
    const scrollCenter = scrollY + vh * 0.45;
    let activeIdx = 0;
    let activeSectionId = cachedSectionOffsets.length ? cachedSectionOffsets[0].id : 'hero';

    for (let i = cachedSectionOffsets.length - 1; i >= 0; i--) {
        if (scrollCenter >= cachedSectionOffsets[i].top) {
            activeIdx = cachedSectionOffsets[i].index;
            activeSectionId = cachedSectionOffsets[i].id;
            break;
        }
    }

    // D. Active Navbar Link & Indicator Line
    if (activeSectionId !== currentActiveNavId && cachedNavLinks.length) {
        currentActiveNavId = activeSectionId;
        let activeLinkObj = null;

        cachedNavLinks.forEach((linkObj) => {
            if (linkObj.href === `#${activeSectionId}`) {
                linkObj.element.classList.add('active');
                activeLinkObj = linkObj;
            } else {
                linkObj.element.classList.remove('active');
            }
        });

        if (indicatorLine) {
            if (activeLinkObj) {
                indicatorLine.style.transform = `translate3d(${activeLinkObj.offsetLeft}px, 0, 0)`;
                indicatorLine.style.width = `${activeLinkObj.offsetWidth}px`;
                indicatorLine.style.opacity = '1';
            } else {
                indicatorLine.style.opacity = '0';
            }
        }
    }

    // E. Left Rail Continuous Track Fill & Section Indicator
    if (scrollRail && cachedDotCenters.length && cachedSectionOffsets.length) {
        const numSections = cachedSectionOffsets.length;
        let currentFillY = cachedDotCenters[0];

        if (scrollCenter <= cachedSectionOffsets[0].top) {
            currentFillY = cachedDotCenters[0];
        } else if (scrollCenter >= cachedSectionOffsets[numSections - 1].top) {
            currentFillY = cachedDotCenters[cachedDotCenters.length - 1];
        } else {
            for (let i = 0; i < numSections - 1; i++) {
                const startOffset = cachedSectionOffsets[i].top;
                const endOffset = cachedSectionOffsets[i + 1].top;
                if (scrollCenter >= startOffset && scrollCenter < endOffset) {
                    const progress = (scrollCenter - startOffset) / (endOffset - startOffset || 1);
                    currentFillY = cachedDotCenters[i] + (cachedDotCenters[i + 1] - cachedDotCenters[i]) * progress;
                    break;
                }
            }
        }

        if (railTrackFill) {
            railTrackFill.style.height = `${currentFillY}px`;
        }

        if (activeIdx !== currentRailIndex) {
            currentRailIndex = activeIdx;
            const currentData = railSectionData[activeIdx] || railSectionData[0];

            if (railActiveNum && railActiveNum.textContent !== currentData.num) {
                railActiveNum.classList.add('num-changing');
                setTimeout(() => {
                    railActiveNum.textContent = currentData.num;
                    railActiveNum.classList.remove('num-changing');
                }, 140);
            }

            if (railActiveLabel) {
                railActiveLabel.textContent = currentData.label;
            }

            railDots.forEach((dot, idx) => {
                if (idx === activeIdx) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }
    }

    isScrollTicking = false;
}

// Single unified master passive scroll listener
window.addEventListener('scroll', () => {
    if (!isScrollTicking) {
        isScrollTicking = true;
        requestAnimationFrame(updateScrollFrame);
    }
}, { passive: true });

// Resize debouncer to re-cache geometry
let resizeTimer = null;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        cacheLayoutGeometry();
        updateScrollFrame();
    }, 150);
}, { passive: true });

// Initial layout geometry settlement
cacheLayoutGeometry();
setTimeout(() => {
    cacheLayoutGeometry();
    updateScrollFrame();
}, 200);
setTimeout(() => {
    cacheLayoutGeometry();
    updateScrollFrame();
}, 1000);

/* ==========================================================================
   NATIVE SMOOTH ANCHOR NAVIGATION
   ========================================================================== */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#' || !targetId) return;

        const targetEl = document.querySelector(targetId);
        if (targetEl) {
            e.preventDefault();
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

/* ==========================================================================
   SMOOTH 60 FPS SCROLL REVEAL (AUTOMATIC STAGGER & ZERO-LAG OPTIMIZATION)
   ========================================================================== */
function initScrollReveal() {
    // Add graceful cascading delays to child cards inside grids & rows
    const gridContainers = document.querySelectorAll(
        '.projects-grid, .skills-matrix-grid, .services-grid, .stats-row, .about-grid'
    );

    gridContainers.forEach((container) => {
        const items = container.querySelectorAll('.reveal-item');
        items.forEach((item, index) => {
            item.style.transitionDelay = `${index * 90}ms`;
        });
    });

    const revealObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    el.classList.add('is-visible');

                    // Release GPU layer memory after transition completes to ensure 60fps
                    const cleanGPU = () => {
                        el.style.willChange = 'auto';
                        el.removeEventListener('transitionend', cleanGPU);
                    };
                    el.addEventListener('transitionend', cleanGPU, { once: true });

                    // Unobserve immediately after reveal
                    observer.unobserve(el);
                }
            });
        },
        {
            threshold: 0.08,
            rootMargin: '0px 0px -40px 0px',
        }
    );

    document.querySelectorAll('.reveal-item').forEach((el) => {
        revealObserver.observe(el);
    });
}
initScrollReveal();

/* ==========================================================================
   EMAIL COPY BUTTON
   ========================================================================== */
const emailCopyBtn = document.getElementById('emailCopyBtn');
const copyBadge = document.getElementById('copyBadge');

if (emailCopyBtn) {
    emailCopyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const email = 'Vatanaking20@gmail.com';

        function showCopied() {
            emailCopyBtn.classList.add('copied');
            if (copyBadge) copyBadge.textContent = 'Copied';
            setTimeout(() => {
                emailCopyBtn.classList.remove('copied');
                if (copyBadge) copyBadge.textContent = 'Copy';
            }, 2000);
        }

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(email).then(showCopied).catch(fallbackCopy);
        } else {
            fallbackCopy();
        }

        function fallbackCopy() {
            const textArea = document.createElement('textarea');
            textArea.value = email;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
            } catch (err) {}
            document.body.removeChild(textArea);
            showCopied();
        }
    });
}

/* ==========================================================================
   CONTACT FORM SUBMISSION (Powered by Web3Forms / Formspree)
   ========================================================================== */
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');

// PASTE YOUR FREE WEB3FORMS ACCESS KEY HERE:
// Get your free key instantly at https://web3forms.com by entering Vatanaking20@gmail.com
const WEB3FORMS_ACCESS_KEY = 'bd463f00-6650-45fc-8998-213251304b62';

if (contactForm && formStatus && submitBtn) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const messageInput = document.getElementById('message');

        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const message = messageInput ? messageInput.value.trim() : '';

        if (!name || !email || !message) return;

        // Check if access key has been configured
        if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === 'YOUR_ACCESS_KEY_HERE') {
            formStatus.style.color = '#f59e0b';
            formStatus.textContent = 'To receive emails, please paste your Web3Forms Access Key into main-spline.js (Get it free at web3forms.com).';
            return;
        }

        submitBtn.disabled = true;
        const originalBtnHtml = submitBtn.innerHTML;
        submitBtn.innerHTML = `<span>Sending...</span>`;
        formStatus.textContent = '';
        formStatus.style.color = 'var(--text-secondary)';

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    access_key: WEB3FORMS_ACCESS_KEY,
                    name: name,
                    email: email,
                    message: message,
                    from_name: 'Portfolio Contact Form',
                    subject: `New Portfolio Message from ${name}`
                })
            });

            const result = await response.json();

            if (result.success) {
                submitBtn.innerHTML = `<span>Message Sent</span>`;
                formStatus.style.color = '#4ade80'; // emerald green
                formStatus.textContent = 'Thank you! Your message has been sent successfully.';
                contactForm.reset();
            } else {
                throw new Error(result.message || 'Submission failed');
            }
        } catch (error) {
            formStatus.style.color = '#f87171'; // rose red
            formStatus.textContent = 'Failed to send message. Please try again or email directly to Vatanaking20@gmail.com.';
        } finally {
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml;
            }, 3500);
        }
    });
}

/* ==========================================================================
   SECTION TITLE TYPING ANIMATION
   ========================================================================== */
function initTypingAnimation() {
    const sectionTitles = document.querySelectorAll('.section-title');
    const CHAR_DELAY = 28;   // ms between each character
    const CURSOR_LINGER = 800; // ms cursor stays after last character

    sectionTitles.forEach((title) => {
        const originalText = title.textContent;
        title.textContent = '';
        title.setAttribute('data-original-text', originalText);

        // Split text into words and spaces, then wrap chars inside word-level containers
        // This prevents mid-word line breaks on multi-line titles
        const words = originalText.split(/( )/); // split keeping spaces as separate items
        const chars = [];
        let charIndex = 0;

        words.forEach((word) => {
            if (word === ' ') {
                // Space between words — inline element that allows line break
                const spaceSpan = document.createElement('span');
                spaceSpan.className = 'char-space';
                spaceSpan.textContent = ' ';
                spaceSpan.style.transitionDelay = `${charIndex * CHAR_DELAY}ms`;
                title.appendChild(spaceSpan);
                chars.push(spaceSpan);
                charIndex++;
            } else if (word.length > 0) {
                // Wrap the entire word in a nowrap container so it never splits
                const wordWrapper = document.createElement('span');
                wordWrapper.style.whiteSpace = 'nowrap';
                wordWrapper.style.display = 'inline';

                for (let i = 0; i < word.length; i++) {
                    const span = document.createElement('span');
                    span.className = 'char';
                    span.textContent = word[i];
                    span.style.transitionDelay = `${charIndex * CHAR_DELAY}ms`;
                    wordWrapper.appendChild(span);
                    chars.push(span);
                    charIndex++;
                }
                title.appendChild(wordWrapper);
            }
        });

        // Add blinking cursor element
        const cursor = document.createElement('span');
        cursor.className = 'typing-cursor';
        title.appendChild(cursor);

        // Store metadata for observer callback
        title._typingChars = chars;
        title._typingCursor = cursor;
        title._totalDuration = charIndex * CHAR_DELAY + 350; // +350 for transition
        title._cursorLinger = CURSOR_LINGER;
    });

    // Create an observer specifically for section-titles to trigger cursor animation
    const typingObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const title = entry.target;
                    const cursor = title._typingCursor;
                    const totalDuration = title._totalDuration;
                    const cursorLinger = title._cursorLinger;

                    // Activate cursor blink immediately
                    cursor.classList.add('cursor-active');

                    // Also add typing-active class for titles inside .about-left
                    // (the about section title is the reveal-item itself via parent)
                    title.classList.add('typing-active');

                    // After all characters have appeared, linger then fade cursor
                    setTimeout(() => {
                        cursor.classList.remove('cursor-active');
                        cursor.classList.add('cursor-done');
                    }, totalDuration + cursorLinger);

                    typingObserver.unobserve(title);
                }
            });
        },
        {
            threshold: 0.15,
            rootMargin: '0px 0px -30px 0px',
        }
    );

    sectionTitles.forEach((title) => {
        typingObserver.observe(title);
    });
}

// Initialize after DOM is ready
initTypingAnimation();

/* ==========================================================================
   SPOTLIGHT CURSOR GLOW ON CARDS (RAF THROTTLED & MOUSEENTER CACHED)
   ========================================================================== */
function initSpotlightGlow() {
    if (window.matchMedia('(hover: none)').matches) return;

    const cards = document.querySelectorAll(
        '.project-card, .skills-category-card, .service-card, .stat-card, .contact-box'
    );

    cards.forEach((card) => {
        let cardRect = null;
        let rafId = null;

        card.addEventListener('mouseenter', () => {
            cardRect = card.getBoundingClientRect();
            card.style.setProperty('--spotlight-opacity', '1');
        }, { passive: true });

        card.addEventListener('mousemove', (e) => {
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
                rafId = null;
                if (!cardRect) cardRect = card.getBoundingClientRect();
                const x = e.clientX - cardRect.left;
                const y = e.clientY - cardRect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });
        }, { passive: true });

        card.addEventListener('mouseleave', () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            cardRect = null;
            card.style.setProperty('--spotlight-opacity', '0');
        }, { passive: true });
    });
}
initSpotlightGlow();

/* ==========================================================================
   ANIMATED NUMBER COUNTERS (ABOUT STATS)
   ========================================================================== */
function initStatCounters() {
    const counters = document.querySelectorAll('.stat-counter');
    if (!counters.length) return;

    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.getAttribute('data-target'), 10) || 0;
                    const prefix = el.getAttribute('data-prefix') || '';
                    const suffix = el.getAttribute('data-suffix') || '';
                    const duration = 2200; // Slower, graceful counting duration (2.2s)
                    const startTime = performance.now();

                    function updateNumber(now) {
                        const elapsed = now - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        // Ease-out cubic curve for organic deceleration
                        const easeProgress = 1 - Math.pow(1 - progress, 3);
                        const current = Math.round(easeProgress * target);

                        el.textContent = `${prefix}${current}${suffix}`;

                        if (progress < 1) {
                            requestAnimationFrame(updateNumber);
                        } else {
                            el.textContent = `${prefix}${target}${suffix}`;
                        }
                    }

                    requestAnimationFrame(updateNumber);
                    obs.unobserve(el);
                }
            });
        },
        { threshold: 0.2 }
    );

    counters.forEach((counter) => observer.observe(counter));
}
initStatCounters();

/* Note: Active navbar indicator is managed smoothly by the master centralized scroll controller */

/* ==========================================================================
   INTERACTIVE TECH STACK CROSS-HIGHLIGHTING
   ========================================================================== */
function initTechStackHighlighting() {
    const stackBadges = document.querySelectorAll('.stack-badge');
    const projectCards = document.querySelectorAll('.project-card');
    if (!stackBadges.length || !projectCards.length) return;

    // Cache project tags
    const projectTechMap = new Map();
    projectCards.forEach((card) => {
        const tags = Array.from(card.querySelectorAll('.tag')).map((tag) => ({
            element: tag,
            name: tag.textContent.trim().toLowerCase(),
        }));
        projectTechMap.set(card, tags);
    });

    function highlightTech(techName) {
        const normalizedTarget = techName.toLowerCase();
        let hasAnyMatch = false;

        projectCards.forEach((card) => {
            const cardTags = projectTechMap.get(card) || [];
            const isMatch = cardTags.some(
                (t) =>
                    t.name === normalizedTarget ||
                    normalizedTarget.includes(t.name) ||
                    t.name.includes(normalizedTarget)
            );

            if (isMatch) {
                hasAnyMatch = true;
                card.classList.add('tech-highlighted');
                card.classList.remove('tech-dimmed');

                cardTags.forEach((t) => {
                    if (
                        t.name === normalizedTarget ||
                        normalizedTarget.includes(t.name) ||
                        t.name.includes(normalizedTarget)
                    ) {
                        t.element.classList.add('tag-highlighted');
                    }
                });
            } else {
                card.classList.remove('tech-highlighted');
                card.classList.add('tech-dimmed');
            }
        });

        // If no project matches this specific skill, keep all cards neutral
        if (!hasAnyMatch) {
            projectCards.forEach((card) => card.classList.remove('tech-dimmed'));
        }
    }

    function resetTechHighlight() {
        projectCards.forEach((card) => {
            card.classList.remove('tech-highlighted', 'tech-dimmed');
            const cardTags = projectTechMap.get(card) || [];
            cardTags.forEach((t) => t.element.classList.remove('tag-highlighted'));
        });
        stackBadges.forEach((badge) => badge.classList.remove('stack-badge-active'));
    }

    // Hover on Skill Stack Badges -> Highlights matching Projects
    stackBadges.forEach((badge) => {
        badge.addEventListener('mouseenter', () => {
            badge.classList.add('stack-badge-active');
            highlightTech(badge.textContent.trim());
        });

        badge.addEventListener('mouseleave', () => {
            resetTechHighlight();
        });
    });

    // Hover on Project Card Tags -> Highlights matching Skill Badges
    projectCards.forEach((card) => {
        const cardTags = projectTechMap.get(card) || [];
        cardTags.forEach(({ element, name }) => {
            element.addEventListener('mouseenter', () => {
                element.classList.add('tag-highlighted');
                stackBadges.forEach((badge) => {
                    const badgeText = badge.textContent.trim().toLowerCase();
                    if (
                        badgeText === name ||
                        badgeText.includes(name) ||
                        name.includes(badgeText)
                    ) {
                        badge.classList.add('stack-badge-active');
                    }
                });
            });

            element.addEventListener('mouseleave', () => {
                element.classList.remove('tag-highlighted');
                stackBadges.forEach((badge) => badge.classList.remove('stack-badge-active'));
            });
        });
    });
}
initTechStackHighlighting();

/* Note: Scroll rail continuous tracking is managed smoothly by the master centralized scroll controller */

/* ==========================================================================
   MOBILE NAVIGATION MENU INTERACTION CONTROLLER
   ========================================================================== */
function initMobileNav() {
    const toggleBtn = document.getElementById('mobileMenuToggle');
    const overlay = document.getElementById('mobileNavOverlay');
    const links = document.querySelectorAll('.mobile-nav-link');

    if (!toggleBtn || !overlay) return;

    function setMobileNav(open) {
        const isOpen = open !== undefined ? open : !overlay.classList.contains('is-open');
        if (isOpen) {
            overlay.classList.add('is-open');
            toggleBtn.classList.add('is-active');
            overlay.setAttribute('aria-hidden', 'false');
            toggleBtn.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        } else {
            overlay.classList.remove('is-open');
            toggleBtn.classList.remove('is-active');
            overlay.setAttribute('aria-hidden', 'true');
            toggleBtn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    }

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setMobileNav();
    });

    links.forEach((link) => {
        link.addEventListener('click', () => {
            setMobileNav(false);
        });
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            setMobileNav(false);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
            setMobileNav(false);
        }
    });
}
initMobileNav();

/* ==========================================================================
   PREVIEW BUTTON ALERT & CORNER ARROW CONTROLLER (DISMISS ON CLICK)
   ========================================================================== */
function initPreviewCornerAlert() {
    const previewBtn = document.getElementById('vaultpaperPreviewBtn');
    if (!previewBtn) return;

    // Persist dismissed state across the session
    try {
        if (sessionStorage.getItem('preview_alert_dismissed') === 'true') {
            previewBtn.classList.add('is-dismissed');
        }
    } catch (e) {}

    // When clicked once, immediately and smoothly dismiss all alert lines & pointer
    previewBtn.addEventListener('click', () => {
        previewBtn.classList.add('is-dismissed');
        try {
            sessionStorage.setItem('preview_alert_dismissed', 'true');
        } catch (e) {}
    });
}
initPreviewCornerAlert();
