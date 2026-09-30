/**
 * Initializes a scroll-scrubbed plane route for one Liferay portlet instance.
 *
 * The route-map SVG must share its positioned coordinate space with .plane-wrapper.
 *
 * @param {Element} container The .route-map section that owns the markers and SVG.
 * @returns {() => void} Removes animations, ScrollTriggers, and event listeners.
 */
export default function initRouteMapPlane(container) {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    const MotionPathPlugin = window.MotionPathPlugin;

    if (!(container instanceof Element)) {
        throw new TypeError("initRouteMapPlane requires a .route-map element");
    }

    if (!gsap || !ScrollTrigger || !MotionPathPlugin) {
        console.warn("Route map requires window.gsap, window.ScrollTrigger, and window.MotionPathPlugin");
        return () => { };
    }

    const origin = container.querySelector(".airport-origin");
    const destination = container.querySelector(".airport-destination");
    const plane = container.querySelector(".plane-wrapper");
    const svg = container.querySelector("svg.route-map-svg, svg");

    if (!origin || !destination || !plane || !svg) {
        console.warn("Route map requires origin, destination, plane, and SVG elements");
        return () => { };
    }

    const initialPlaneStyle = plane.getAttribute("style");
    const initialPlaneTransform = plane.getAttribute("transform");

    gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

    const svgNamespace = "http://www.w3.org/2000/svg";
    const path = document.createElementNS(svgNamespace, "path");
    path.classList.add("route-map-path");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "none");

    const maskId = `route-map-reveal-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const revealMask = document.createElementNS(svgNamespace, "mask");
    const revealPath = document.createElementNS(svgNamespace, "path");
    revealMask.setAttribute("id", maskId);
    revealPath.setAttribute("fill", "none");
    revealPath.setAttribute("stroke", "white");
    revealPath.setAttribute("stroke-width", "6");
    revealMask.appendChild(revealPath);

    const trail = document.createElementNS(svgNamespace, "path");
    trail.classList.add("route-map-trail");
    trail.setAttribute("fill", "none");
    trail.setAttribute("stroke", "currentColor");
    trail.setAttribute("stroke-width", "2");
    trail.setAttribute("stroke-dasharray", "6 8");
    trail.setAttribute("mask", `url(#${maskId})`);

    path.setAttribute("stroke-width", "2");
    svg.appendChild(path);
    svg.appendChild(revealMask);
    svg.appendChild(trail);

    let animation = null;
    let resizeTimer = null;
    let frameId = null;
    let destroyed = false;
    let navigationHandle = null;

    /**
     * Converts a marker's viewport bounds to the SVG overlay's coordinate space.
     *
     * @param {Element} marker Airport marker element.
     * @param {DOMRect} svgBounds Bounds of the route-map SVG.
     * @returns {{ x: number, y: number }} Center point relative to the SVG.
     */
    function getMarkerCenter(marker, svgBounds) {
        const bounds = marker.getBoundingClientRect();

        return {
            x: bounds.left - svgBounds.left + bounds.width / 2,
            y: bounds.top - svgBounds.top + bounds.height / 2
        };
    }

    /**
     * Builds a cubic Bezier route with control points 30% of its horizontal span above it.
     *
     * @returns {string} SVG path data.
     */
    function createPathData() {
        const svgBounds = svg.getBoundingClientRect();
        const start = getMarkerCenter(origin, svgBounds);
        const end = getMarkerCenter(destination, svgBounds);
        const arcHeight = Math.abs(end.x - start.x) * 0.3;

        return `M ${start.x} ${start.y} C ${start.x} ${start.y - arcHeight}, ${end.x} ${end.y - arcHeight}, ${end.x} ${end.y}`;
    }

    /**
     * Returns the viewport coordinate for 70% through the space below the sticky header.
     *
     * @returns {string} ScrollTrigger start value.
     */
    function getTriggerStart() {
        const stickyHeaderHeight = 60;
        const visibleHeight = Math.max(0, window.innerHeight - stickyHeaderHeight);
        const triggerPoint = stickyHeaderHeight + visibleHeight * 0.7;

        return `top ${Math.round(triggerPoint)}px`;
    }

    /**
     * Removes GSAP's current MotionPath transform without discarding authored SVG state.
     *
     * @returns {void}
     */
    function restorePlanePosition() {
        if (initialPlaneStyle === null) {
            plane.removeAttribute("style");
        } else {
            plane.setAttribute("style", initialPlaneStyle);
        }

        if (initialPlaneTransform === null) {
            plane.removeAttribute("transform");
        } else {
            plane.setAttribute("transform", initialPlaneTransform);
        }
    }

    /**
     * Recalculates the geometry and replaces the timeline that owns this route's trigger.
     *
     * @returns {void}
     */
    function buildAnimation() {
        animation?.scrollTrigger?.kill();
        animation?.kill();
        restorePlanePosition();

        const pathData = createPathData();
        path.setAttribute("d", pathData);
        revealPath.setAttribute("d", pathData);
        trail.setAttribute("d", pathData);
        const pathLength = path.getTotalLength();
        gsap.set(revealPath, {
            strokeDasharray: pathLength,
            strokeDashoffset: pathLength
        });

        animation = gsap.timeline({
            scrollTrigger: {
                trigger: container,
                start: getTriggerStart,
                end: "bottom top",
                scrub: 1.5,
                invalidateOnRefresh: true
            }
        });

        // The shorter mask reveal keeps the visible dashed trail ahead of the plane.
        animation.to(revealPath, {
            strokeDashoffset: 0,
            duration: 0.9,
            ease: "none"
        }, 0);
        animation.to(plane, {
            duration: 1,
            ease: "none",
            motionPath: {
                path,
                align: path,
                alignOrigin: [0.5, 0.5],
                autoRotate: true
            }
        }, 0);
    }

    function rebuildAfterResize() {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
            if (!destroyed) {
                buildAnimation();
                ScrollTrigger.refresh();
            }
        }, 250);
    }

    function cleanup() {
        if (destroyed) {
            return;
        }

        destroyed = true;
        window.clearTimeout(resizeTimer);
        if (frameId !== null) {
            window.cancelAnimationFrame(frameId);
        }
        window.removeEventListener("resize", rebuildAfterResize);
        animation?.scrollTrigger?.kill();
        animation?.kill();
        restorePlanePosition();
        path.remove();
        revealMask.remove();
        trail.remove();
        navigationHandle?.detach();
        navigationHandle = null;
    }

    buildAnimation();
    window.addEventListener("resize", rebuildAfterResize);

    // DXP headers can apply their sticky offset after the portlet's first layout pass.
    frameId = window.requestAnimationFrame(() => {
        if (!destroyed) {
            buildAnimation();
            ScrollTrigger.refresh();
        }
    });

    if (window.Liferay?.on) {
        navigationHandle = window.Liferay.on("beforeNavigate", cleanup);
    }

    return cleanup;
}

/**
 * Liferay portlet usage:
 *
 * const routeMap = document.querySelector(".route-map");
 * const destroyRouteMap = routeMap ? initRouteMapPlane(routeMap) : () => {};
 *
 * ScrollTrigger.refresh() recalculates trigger boundaries, but it does not rerun
 * getBoundingClientRect() or replace the MotionPath. The rebuild therefore updates
 * both the curve geometry and trigger measurements after the sticky DXP header has
 * shifted layout, and then refreshes ScrollTrigger's cached start/end positions.
 */