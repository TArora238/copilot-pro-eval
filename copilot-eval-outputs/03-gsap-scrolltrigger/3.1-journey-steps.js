/**
 * Initializes the Journey Steps reveal animation for one portlet instance.
 *
 * @param {Element} container The .journey-steps section that owns the step cards.
 * @returns {() => void} Removes animations, observers, and ScrollTriggers.
 */
export default function initJourneySteps(container) {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    if (!(container instanceof Element)) {
        throw new TypeError("initJourneySteps requires a .journey-steps element");
    }

    if (!gsap || !ScrollTrigger) {
        console.warn("Journey Steps requires window.gsap and window.ScrollTrigger");
        return () => { };
    }

    const cards = Array.from(container.querySelectorAll(".step-card"));

    if (cards.length === 0) {
        return () => { };
    }

    gsap.registerPlugin(ScrollTrigger);

    const media = gsap.matchMedia();
    let refreshTimer = null;
    let destroyed = false;
    let navigationHandle = null;

    /**
     * Creates one responsive, play-once ScrollTrigger animation.
     *
     * @param {number} stagger Delay between successive cards in seconds.
     * @param {number} offset Initial vertical offset in pixels.
     * @returns {() => void} Kills the animation and its ScrollTrigger.
     */
    function createReveal(stagger, offset) {
        const animation = gsap.fromTo(
            cards,
            { autoAlpha: 0, y: offset },
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.5,
                stagger,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: container,
                    start: "top 80%",
                    toggleActions: "play none none none",
                    once: true
                }
            }
        );

        return () => {
            if (animation.scrollTrigger) {
                animation.scrollTrigger.kill();
            }

            animation.kill();
        };
    }

    media.add("(min-width: 768px)", () => createReveal(0.15, 40));
    media.add("(max-width: 767px)", () => createReveal(0.08, 20));

    const resizeObserver = new ResizeObserver(() => {
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(() => {
            if (!destroyed) {
                ScrollTrigger.refresh();
            }
        }, 200);
    });

    resizeObserver.observe(container);

    function cleanup() {
        if (destroyed) {
            return;
        }

        destroyed = true;
        window.clearTimeout(refreshTimer);
        resizeObserver.disconnect();
        media.revert();
        navigationHandle?.detach();
        navigationHandle = null;
    }

    if (window.Liferay?.on) {
        navigationHandle = window.Liferay.on("beforeNavigate", cleanup);
    }

    return cleanup;
}

/**
 * Liferay portlet usage:
 *
 * const section = document.querySelector(".journey-steps");
 * const destroyJourneySteps = section ? initJourneySteps(section) : () => {};
 *
 * The initializer automatically tears down before Liferay Senna SPA navigation.
 * Call destroyJourneySteps() only when this portlet is removed independently.
 *
 * Dynamic portlet stacking can change this section's document position after its
 * initial render. The ResizeObserver debounces ScrollTrigger.refresh() so its
 * start position is recalculated after adjacent portlets, async content, or
 * responsive layout changes alter the page height.
 */