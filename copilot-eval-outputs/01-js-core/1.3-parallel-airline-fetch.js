/**
 * Creates an AbortError compatible with browser fetch cancellation errors.
 *
 * @returns {DOMException} Abort error.
 */
function createAbortError() {
    return new DOMException("The operation was aborted.", "AbortError");
}

/**
 * Waits for a duration unless the supplied signal aborts first.
 *
 * @param {number} delayMs Delay in milliseconds.
 * @param {AbortSignal} [signal] Optional cancellation signal.
 * @returns {Promise<void>} Resolves after the delay.
 */
function waitForRetry(delayMs, signal) {
    if (signal?.aborted) {
        return Promise.reject(createAbortError());
    }

    return new Promise((resolve, reject) => {
        const timeoutId = window.setTimeout(finish, delayMs);

        function finish() {
            signal?.removeEventListener("abort", abort);
            resolve();
        }

        function abort() {
            window.clearTimeout(timeoutId);
            signal.removeEventListener("abort", abort);
            reject(createAbortError());
        }

        signal?.addEventListener("abort", abort, { once: true });
    });
}

/**
 * Fetches and parses JSON, retrying failed requests at 200ms and 400ms.
 *
 * @param {string} url Request URL.
 * @param {AbortSignal} [signal] Optional cancellation signal.
 * @returns {Promise<Object|Array>} Parsed response JSON.
 */
async function fetchJsonWithRetry(url, signal) {
    const maxRetries = 2;
    let response;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        try {
            response = await fetch(url, { signal });

            if (!response.ok) {
                throw new Error(`Request failed (${response.status}): ${url}`);
            }

            break;
        } catch (error) {
            const isFinalAttempt = attempt === maxRetries;

            if (signal?.aborted || error.name === "AbortError" || isFinalAttempt) {
                throw error;
            }

            await waitForRetry(200 * 2 ** attempt, signal);
        }
    }

    try {
        return await response.json();
    } catch (error) {
        throw new Error(`Invalid JSON response: ${url}`);
    }
}

/**
 * Fetches profile, route, and lounge data for multiple airlines concurrently.
 * Airlines whose profiles cannot be loaded are omitted. Route or lounge failures
 * leave that collection empty and mark the airline as having partial data.
 *
 * @param {string[]} airlineCodes Airline codes, for example ["LH", "SQ"].
 * @param {AbortSignal} [signal] Optional signal used to cancel every request.
 * @returns {Promise<{
 *   airlines: Array<{
 *     code: string,
 *     profile: Object,
 *     routes: Array,
 *     lounges: Array,
 *     partialData: boolean
 *   }>,
 *   failedCodes: string[]
 * }>} Bundle results and codes whose profiles failed.
 */
export async function fetchAirlineBundle(airlineCodes, signal) {
    const airlineTasks = airlineCodes.map(async (code) => {
        const baseUrl = `/api/airlines/${encodeURIComponent(code)}`;
        const [profileResult, routesResult, loungesResult] = await Promise.allSettled([
            fetchJsonWithRetry(`${baseUrl}/profile`, signal),
            fetchJsonWithRetry(`${baseUrl}/routes`, signal),
            fetchJsonWithRetry(`${baseUrl}/lounges`, signal)
        ]);

        if (profileResult.status === "rejected") {
            return { code, failed: true };
        }

        const routesLoaded = routesResult.status === "fulfilled";
        const loungesLoaded = loungesResult.status === "fulfilled";

        return {
            code,
            profile: profileResult.value,
            routes: routesLoaded ? routesResult.value : [],
            lounges: loungesLoaded ? loungesResult.value : [],
            partialData: !routesLoaded || !loungesLoaded,
            failed: false
        };
    });

    const settledAirlines = await Promise.allSettled(airlineTasks);

    if (signal?.aborted) {
        throw createAbortError();
    }

    return settledAirlines.reduce(
        (bundle, result, index) => {
            const code = airlineCodes[index];

            if (result.status === "rejected" || result.value.failed) {
                bundle.failedCodes.push(code);
            } else {
                const { failed, ...airline } = result.value;
                bundle.airlines.push(airline);
            }

            return bundle;
        },
        { airlines: [], failedCodes: [] }
    );
}

/**
 * Example Liferay theme usage. Call the returned cleanup during portlet teardown.
 *
 * @param {Element} portletElement Mounted portlet root element.
 * @returns {() => void} Cancels requests and stops observing the portlet.
 */
export function loadPortletAirlineBundle(portletElement) {
    const controller = new AbortController();

    fetchAirlineBundle(["LH", "SQ", "UA"], controller.signal)
        .then(({ airlines, failedCodes }) => {
            if (!portletElement.isConnected) {
                return;
            }

            console.log("Loaded airlines:", airlines);
            console.warn("Profiles unavailable for:", failedCodes);
        })
        .catch((error) => {
            if (error.name !== "AbortError") {
                console.error("Unable to load airline data", error);
            }
        });

    const observer = new MutationObserver(() => {
        if (!portletElement.isConnected) {
            controller.abort();
            observer.disconnect();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
        controller.abort();
        observer.disconnect();
    };
}

// Theme portlet lifecycle example:
// const portletRoot = document.querySelector(".airline-results-portlet");
// const cleanup = portletRoot ? loadPortletAirlineBundle(portletRoot) : () => {};
// Liferay.on("destroyPortlet", cleanup);