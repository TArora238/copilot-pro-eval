/**
 * Initializes a responsive history timeline for one Liferay portlet instance.
 *
 * @param {Element} container The .timeline-section element that owns the timeline.
 * @returns {() => void} Removes animations, ScrollTriggers, and SPA listeners.
 */
export default function initHistoryTimeline(container) {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    if (!(container instanceof Element)) {
        throw new TypeError("initHistoryTimeline requires a .timeline-section element");
    }

    if (!gsap || !ScrollTrigger) {
        console.warn("History timeline requires window.gsap and window.ScrollTrigger");
        return () => { };
    }

    const track = container.querySelector(".timeline-track");
    const cards = Array.from(container.querySelectorAll(".timeline-card"));
    const yearCounter = container.querySelector(".timeline-year-counter");
    const progressBar = container.querySelector(".timeline-progress__bar, .timeline-progress-bar");

    if (!track || cards.length === 0) {
        console.warn("History timeline requires a .timeline-track with .timeline-card elements");
        return () => { };
    }

    const initialTrackStyle = track.getAttribute("style");
    const initialContainerStyle = container.getAttribute("style");
    const initialProgressStyle = progressBar?.getAttribute("style") ?? null;
    const initialActiveCards = cards.map((card) => card.classList.contains("is-active"));
    const initialCardStyles = cards.map((card) => card.getAttribute("style"));
    const years = cards.map(getCardYear);
    const counterState = { value: years[0] };
    const portletBoundary = container.closest(".portlet-boundary");

    let activeCardIndex = -1;
    let counterTween = null;
    let destroyed = false;
    let navigationHandle = null;
    let removalObserver = null;

    gsap.registerPlugin(ScrollTrigger);

    /**
     * Reads a year from a card's data-year attribute or its year element.
     *
     * @param {Element} card A history timeline card.
     * @returns {number} The card year, or zero when no numeric year is available.
     */
    function getCardYear(card) {
        const yearElement = card.querySelector("[data-timeline-year], .timeline-card__year, .timeline-year");
        const value = card.dataset.year || yearElement?.textContent || "0";
        const year = Number.parseInt(value, 10);

        return Number.isFinite(year) ? year : 0;
    }

    /**
     * Restores an element's authored inline style, including the absence of one.
     *
    * @param {Element | null} element Element whose inline style should be restored.
     * @param {string | null} style Authored style attribute value.
     * @returns {void}
     */
    function restoreStyle(element, style) {
        if (!element) {
            return;
        }

        if (style === null) {
            element.removeAttribute("style");
        } else {
            element.setAttribute("style", style);
        }
    }

    /**
     * Sets exactly one active card and animates the counter to its year.
     *
     * @param {number} cardIndex Index of the card that has entered focus.
     * @param {boolean} immediate Whether to update the counter without a tween.
     * @returns {void}
     */
    function activateCard(cardIndex, immediate = false) {
        const nextIndex = Math.max(0, Math.min(cardIndex, cards.length - 1));

        if (nextIndex === activeCardIndex && !immediate) {
            return;
        }

        cards.forEach((card, index) => {
            card.classList.toggle("is-active", index === nextIndex);
        });
        activeCardIndex = nextIndex;

        if (!yearCounter) {
            return;
        }

        counterTween?.kill();
        const targetYear = years[nextIndex];

        if (immediate) {
            counterState.value = targetYear;
            yearCounter.textContent = String(targetYear);
            return;
        }

        counterTween = gsap.to(counterState, {
            value: targetYear,
            duration: 0.45,
            ease: "power1.out",
            overwrite: true,
            onUpdate: () => {
                yearCounter.textContent = String(Math.round(counterState.value));
            }
        });
    }

    /**
     * Creates the pinned desktop animation and child-card activation triggers.
     *
     * @returns {() => void} Kills animations and restores authored DOM state.
     */
    function createDesktopTimeline() {
        const getDistance = () => Math.max(0, track.scrollWidth - container.clientWidth);
        const initialMinHeight = container.style.minHeight;

        function reservePinSpace() {
            container.style.minHeight = initialMinHeight;
            const viewportHeight = container.getBoundingClientRect?.().height || container.clientHeight;
            container.style.minHeight = `${viewportHeight + getDistance()}px`;
        }

        // Reserve pin space ourselves. Liferay Bootstrap columns can be destabilized
        // when ScrollTrigger injects its own spacer as a flex-grid child.
        reservePinSpace();

        const horizontalTween = gsap.to(track, {
            x: () => -getDistance(),
            ease: "none",
            scrollTrigger: {
                trigger: container,
                start: "top top",
                end: () => `+=${getDistance()}`,
                pin: true,
                pinSpacing: false,
                pinReparent: true,
                scrub: 1,
                invalidateOnRefresh: true,
                anticipatePin: 1,
                onRefresh: reservePinSpace,
                onUpdate: (self) => {
                    if (progressBar) {
                        gsap.set(progressBar, {
                            scaleX: self.progress,
                            transformOrigin: "left center"
                        });
                    }
                }
            }
        });

        const cardTriggers = cards.map((card, index) => ScrollTrigger.create({
            trigger: card,
            containerAnimation: horizontalTween,
            start: "left 55%",
            onEnter: () => activateCard(index),
            onEnterBack: () => activateCard(index)
        }));

        activateCard(0, true);

        return () => {
            counterTween?.kill();
            horizontalTween.scrollTrigger?.kill(true);
            horizontalTween.kill();
            cardTriggers.forEach((trigger) => trigger.kill());
            restoreStyle(track, initialTrackStyle);
            restoreStyle(container, initialContainerStyle);
            restoreStyle(progressBar, initialProgressStyle);
        };
    }

    /**
     * Creates stacked mobile card reveals with no pinning or horizontal movement.
     *
     * @returns {() => void} Kills the mobile reveal animations.
     */
    function createMobileTimeline() {
        const reveals = cards.map((card, index) => gsap.fromTo(
            card,
            { autoAlpha: 0, y: 24 },
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.45,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: card,
                    start: "top 85%",
                    toggleActions: "play none none none",
                    once: true,
                    onEnter: () => activateCard(index)
                }
            }
        ));

        activateCard(0, true);

        return () => {
            counterTween?.kill();
            reveals.forEach((animation) => {
                animation.scrollTrigger?.kill();
                animation.kill();
            });
            cards.forEach((card, index) => restoreStyle(card, initialCardStyles[index]));
            restoreStyle(progressBar, initialProgressStyle);
        };
    }

    const media = gsap.matchMedia();
    media.add("(min-width: 768px)", createDesktopTimeline);
    media.add("(max-width: 767px)", createMobileTimeline);

    function cleanup() {
        if (destroyed) {
            return;
        }

        destroyed = true;
        media.revert();
        counterTween?.kill();
        cards.forEach((card, index) => {
            card.classList.toggle("is-active", initialActiveCards[index]);
            restoreStyle(card, initialCardStyles[index]);
        });
        restoreStyle(track, initialTrackStyle);
        restoreStyle(container, initialContainerStyle);
        restoreStyle(progressBar, initialProgressStyle);
        navigationHandle?.detach();
        navigationHandle = null;
        removalObserver?.disconnect();
        removalObserver = null;
    }

    if (window.Liferay?.on) {
        navigationHandle = window.Liferay.on("beforeNavigate", cleanup);
    }

    if (portletBoundary && window.MutationObserver && document.body) {
        removalObserver = new window.MutationObserver(() => {
            // pinReparent can keep the pinned section connected under <body> after
            // Liferay has discarded the portlet that originally owned it.
            if (!portletBoundary.isConnected) {
                cleanup();
            }
        });
        removalObserver.observe(document.body, { childList: true, subtree: true });
    }

    return cleanup;
}

/**
 * Liferay portlet setup:
 *
 * const timeline = document.querySelector(".timeline-section");
 * const destroyTimeline = timeline ? initHistoryTimeline(timeline) : () => {};
 *
 * Place .timeline-section in a full-width portlet wrapper rather than directly
 * inside a Bootstrap .row or .col-* flex container. pinSpacing: false avoids added
 * spacer space changing the DXP column structure; the initializer instead reserves
 * the needed height on the section. ScrollTrigger still creates a pin-spacer, which
 * is removed by killing the pin trigger with reversion during teardown. pinReparent:
 * true prevents inherited column transforms from breaking the fixed pinned state.
 * A scoped MutationObserver is a fallback when Liferay removes the portlet boundary
 * before its SPA event handler runs, while the pinned section is under <body>.
 *
 * The initializer unregisters itself before Senna SPA navigation, so the pin,
 * counter animations, child triggers, and temporary inline styles cannot survive
 * after this portlet is replaced.
 */