const initialState = () => ({
    searchParams: null,
    results: [],
    status: "idle",
    error: null,
    selectedFlight: null,
    filters: {
        airlines: [],
        maxDuration: null,
        cabinClass: null
    },
    pagination: {
        page: 1,
        pageSize: 10,
        totalCount: 0
    }
});

let state = initialState();
let requestId = 0;
const listeners = new Set();

/**
 * Creates a snapshot so subscribers cannot mutate the module's private state.
 *
 * @returns {Object} Current search state.
 */
function createSnapshot() {
    return {
        ...state,
        searchParams: state.searchParams ? { ...state.searchParams } : null,
        results: [...state.results],
        filters: {
            ...state.filters,
            airlines: [...state.filters.airlines]
        },
        pagination: { ...state.pagination }
    };
}

/**
 * Commits a state transition and informs all independent portlet consumers.
 *
 * @returns {void}
 */
function notify() {
    const snapshot = createSnapshot();

    listeners.forEach((listener) => {
        try {
            listener(snapshot);
        } catch (error) {
            console.error("Flight search state listener failed", error);
        }
    });
}

/**
 * Builds a search URL, omitting empty optional values.
 *
 * @param {Object} params Flight-search parameters.
 * @returns {string} Search endpoint with query parameters.
 */
function createSearchUrl(params) {
    const query = new URLSearchParams();

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
            query.set(key, String(value));
        }
    });

    const queryString = query.toString();
    return `/api/search/flights${queryString ? `?${queryString}` : ""}`;
}

/**
 * Shared flight-search store for all portlets rendered on the current DXP page.
 */
const FlightSearchState = {
    /**
     * Returns a snapshot of the current state.
     *
     * @returns {Object} Current state.
     */
    getState() {
        return createSnapshot();
    },

    /**
     * Retrieves flights and ignores stale responses from an earlier search.
     *
     * @param {Object} params Search parameters sent to the flights API.
     * @returns {Promise<Array>} Retrieved flight results.
     */
    async search(params) {
        const currentRequestId = ++requestId;
        const searchParams = { ...(params || {}) };

        state = {
            ...state,
            searchParams,
            status: "loading",
            error: null,
            selectedFlight: null,
            pagination: {
                ...state.pagination,
                page: 1
            }
        };
        notify();

        try {
            const response = await window.fetch(createSearchUrl(searchParams));

            if (!response.ok) {
                throw new Error(`Flight search failed: ${response.status}`);
            }

            const payload = await response.json();
            const results = Array.isArray(payload) ? payload : payload.results;

            if (!Array.isArray(results)) {
                throw new TypeError("Flight search response must contain a results array");
            }

            if (currentRequestId !== requestId) {
                return results;
            }

            state = {
                ...state,
                results,
                status: "succeeded",
                pagination: {
                    ...state.pagination,
                    totalCount: Number.isFinite(payload.totalCount) ? payload.totalCount : results.length
                }
            };
            notify();

            return results;
        } catch (error) {
            if (currentRequestId === requestId) {
                state = {
                    ...state,
                    results: [],
                    status: "failed",
                    error,
                    pagination: {
                        ...state.pagination,
                        totalCount: 0
                    }
                };
                notify();
            }

            throw error;
        }
    },

    /**
     * Selects a flight that is already loaded in the current results.
     *
     * @param {string} id Flight identifier.
     * @returns {Object|null} Selected flight, or null when it is not in the results.
     */
    selectFlight(id) {
        const selectedFlight = state.results.find((flight) => String(flight.id) === String(id)) || null;
        state = { ...state, selectedFlight };
        notify();

        return selectedFlight;
    },

    /**
     * Updates client-side filters and returns the user to the first page.
     *
     * @param {Object} partial Filter values to merge.
     * @returns {void}
     */
    updateFilters(partial) {
        const filters = {
            ...state.filters,
            ...(partial || {})
        };

        filters.airlines = Array.isArray(filters.airlines) ? [...filters.airlines] : [];
        state = {
            ...state,
            filters,
            pagination: {
                ...state.pagination,
                page: 1
            }
        };
        notify();
    },

    /**
     * Clears the current search while retaining the user's selected filters.
     *
     * @returns {void}
     */
    resetSearch() {
        requestId += 1;
        state = {
            ...initialState(),
            filters: {
                ...state.filters,
                airlines: [...state.filters.airlines]
            },
            pagination: {
                ...initialState().pagination,
                pageSize: state.pagination.pageSize
            }
        };
        notify();
    },

    /**
     * Applies the selected filters without issuing another API request.
     *
     * @returns {Array} Filtered flight results.
     */
    getFilteredResults() {
        const { airlines, maxDuration, cabinClass } = state.filters;

        return state.results.filter((flight) => {
            const duration = Number(flight.durationMinutes);
            const flightCabinClass = flight.cabinClass || flight.seatClass;

            return (
                (airlines.length === 0 || airlines.includes(flight.airline)) &&
                (maxDuration === null || maxDuration === "" || duration <= Number(maxDuration)) &&
                (!cabinClass || flightCabinClass === cabinClass)
            );
        });
    },

    /**
     * Registers a state-change listener.
     *
     * @param {(state: Object) => void} listener State-change callback.
     * @returns {() => void} Removes the listener.
     */
    subscribe(listener) {
        if (typeof listener !== "function") {
            throw new TypeError("FlightSearchState.subscribe requires a function");
        }

        listeners.add(listener);
        return () => listeners.delete(listener);
    },

    /**
     * Calculates the number of result pages from the current pagination state.
     *
     * @returns {number} Number of available pages.
     */
    getTotalPages() {
        const { pageSize, totalCount } = state.pagination;
        return pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;
    }
};

export default FlightSearchState;

/**
 * Two portlets can import this same theme module on a page and communicate through it:
 *
 * // search-form-portlet.js
 * import FlightSearchState from "${themeDisplay.getPathThemeJavaScript()}/flight-search-state.js";
 * document.querySelector("[data-flight-search-form]").addEventListener("submit", (event) => {
 *   event.preventDefault();
 *   FlightSearchState.search(Object.fromEntries(new FormData(event.currentTarget)));
 * });
 *
 * // results-list-portlet.js
 * import FlightSearchState from "${themeDisplay.getPathThemeJavaScript()}/flight-search-state.js";
 * const unsubscribe = FlightSearchState.subscribe((currentState) => {
 *   renderResults(FlightSearchState.getFilteredResults(), currentState.status, currentState.error);
 * });
 *
 * // Call unsubscribe when the results portlet is removed during Liferay SPA navigation.
 */