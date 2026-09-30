/**
 * Creates an in-memory cache for data that belongs to the current page lifetime.
 *
 * @returns {{
 *   get: (key: string) => *,
 *   set: (key: string, data: *, ttlMs: number) => void,
 *   getOrFetch: (key: string, fetchFn: () => Promise<*>, ttlMs: number) => Promise<*>,
 *   clear: (prefix?: string) => void
 * }} Cache API.
 */
function createCache() {
    const store = new Map();
    const pendingFetches = new Map();

    /**
     * Returns a valid cached value, removing it when it has expired.
     *
     * @param {string} key Cache key.
     * @returns {*} Cached data, or null when absent or expired.
     */
    function get(key) {
        const entry = store.get(key);

        if (!entry) {
            return null;
        }

        if (Date.now() >= entry.expiresAt) {
            store.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Stores data until the requested time-to-live has elapsed.
     *
     * @param {string} key Cache key.
     * @param {*} data Data to cache.
     * @param {number} ttlMs Time-to-live in milliseconds.
     * @returns {void}
     */
    function set(key, data, ttlMs) {
        store.set(key, {
            data,
            expiresAt: Date.now() + ttlMs
        });
    }

    /**
    * Returns a valid cached value or fetches and caches a fresh value. Concurrent
    * requests for the same missing key share one pending fetch promise.
     *
     * @param {string} key Cache key.
     * @param {() => Promise<*>} fetchFn Function that resolves to fresh data.
     * @param {number} ttlMs Time-to-live in milliseconds.
     * @returns {Promise<*>} Cached or freshly fetched data.
     */
    function getOrFetch(key, fetchFn, ttlMs) {
        const cachedData = get(key);

        if (cachedData !== null) {
            return Promise.resolve(cachedData);
        }

        const pendingFetch = pendingFetches.get(key);

        if (pendingFetch) {
            return pendingFetch;
        }

        const fetchPromise = Promise.resolve()
            .then(fetchFn)
            .then(
                (data) => {
                    set(key, data, ttlMs);
                    pendingFetches.delete(key);
                    return data;
                },
                (error) => {
                    pendingFetches.delete(key);
                    throw error;
                }
            );

        pendingFetches.set(key, fetchPromise);
        return fetchPromise;
    }

    /**
     * Clears every cache entry, or only entries whose keys begin with a prefix.
     *
     * @param {string} [prefix] Optional cache-key prefix.
     * @returns {void}
     */
    function clear(prefix) {
        if (typeof prefix === "undefined") {
            store.clear();
            return;
        }

        for (const key of store.keys()) {
            if (key.startsWith(prefix)) {
                store.delete(key);
            }
        }
    }

    return { get, set, getOrFetch, clear };
}

/**
 * Page-scoped singleton cache. Import this same binding from each theme module.
 */
const apiCache = createCache();

export default apiCache;

/**
 * Loads the Lufthansa profile, caching it for five minutes.
 *
 * @returns {Promise<Object>} Airline profile response.
 */
export function getLufthansaProfile() {
    return apiCache.getOrFetch(
        "airline:LH:profile",
        () =>
            fetch("/api/airlines/LH/profile").then((response) => {
                if (!response.ok) {
                    throw new Error(`Unable to load airline profile: ${response.status}`);
                }

                return response.json();
            }),
        5 * 60 * 1000
    );
}