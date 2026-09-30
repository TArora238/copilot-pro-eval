const STORAGE_KEY = "airline-theme-code";

const STAR_ALLIANCE_DEFAULTS = Object.freeze({
    code: "STAR",
    primaryColor: "#1B365D",
    secondaryColor: "#FFFFFF",
    accentColor: "#C9A227",
    fontDisplay: "Arial",
    fontBody: "Arial",
    logoUrl: "/o/airline-theme/images/star-alliance-logo.svg",
    rtl: false
});

const CSS_PROPERTIES = {
    primaryColor: "--color-primary",
    secondaryColor: "--color-secondary",
    accentColor: "--color-accent",
    fontDisplay: "--font-display",
    fontBody: "--font-body",
    logoUrl: "--logo-url"
};

const listeners = new Set();

/**
 * Normalizes API data so a partial or malformed configuration remains usable.
 *
 * @param {Object} config Airline configuration from the theme API.
 * @param {string} code Requested airline code.
 * @returns {Object} Complete airline configuration.
 */
function normalizeConfig(config, code) {
    return {
        ...STAR_ALLIANCE_DEFAULTS,
        ...config,
        code: typeof config.code === "string" ? config.code : code,
        rtl: config.rtl === true
    };
}

/**
 * Notifies independent theme modules without allowing one listener to block another.
 *
 * @param {Object} config Applied airline configuration.
 * @returns {void}
 */
function notifyListeners(config) {
    listeners.forEach((listener) => {
        try {
            listener(config);
        } catch (error) {
            console.error("Airline theme change listener failed", error);
        }
    });
}

/**
 * Theme manager shared by all airline sites in the Liferay theme deployment.
 */
const AirlineThemeManager = {
    /**
     * Retrieves an airline brand configuration, falling back to Star Alliance defaults.
     *
     * @param {string} code Airline code, for example "SQ".
     * @returns {Promise<Object>} Complete airline configuration.
     */
    async fetch(code) {
        const requestedCode = String(code || "").trim().toUpperCase();

        try {
            const response = await window.fetch(
                `/api/themes/${encodeURIComponent(requestedCode)}`
            );

            if (!response.ok) {
                throw new Error(`Theme request failed: ${response.status}`);
            }

            const config = await response.json();

            if (!config || typeof config !== "object" || Array.isArray(config)) {
                throw new Error("Theme response must be an object");
            }

            return normalizeConfig(config, requestedCode);
        } catch (error) {
            console.warn(
                `Using Star Alliance fallback theme for ${requestedCode || "unknown airline"}`,
                error
            );

            return { ...STAR_ALLIANCE_DEFAULTS, code: requestedCode || STAR_ALLIANCE_DEFAULTS.code };
        }
    },

    /**
     * Writes brand variables to the document root and notifies theme consumers.
     *
     * @param {Object} config Airline brand configuration.
     * @returns {Object} The normalized configuration that was applied.
     */
    apply(config) {
        const themeConfig = normalizeConfig(config || {}, STAR_ALLIANCE_DEFAULTS.code);
        const root = document.documentElement;

        Object.entries(CSS_PROPERTIES).forEach(([configProperty, cssProperty]) => {
            root.style.setProperty(cssProperty, themeConfig[configProperty]);
        });

        root.setAttribute("dir", themeConfig.rtl ? "rtl" : "ltr");
        notifyListeners(themeConfig);

        return themeConfig;
    },

    /**
     * Saves the selected airline code for subsequent soft navigations.
     *
     * @param {string} code Airline code to persist.
     * @returns {void}
     */
    persist(code) {
        sessionStorage.setItem(STORAGE_KEY, String(code).trim().toUpperCase());
    },

    /**
     * Reloads and applies the airline theme selected earlier in this tab.
     *
     * @returns {Promise<Object|null>} Applied configuration, or null when none is saved.
     */
    async restore() {
        const code = sessionStorage.getItem(STORAGE_KEY);

        if (!code) {
            return null;
        }

        const config = await this.fetch(code);
        return this.apply(config);
    },

    /**
     * Adds a callback for all successful calls to apply(), including restore().
     *
     * @param {(config: Object) => void} callback Theme-change callback.
     * @returns {() => void} Removes the callback.
     */
    onChange(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("AirlineThemeManager.onChange requires a function");
        }

        listeners.add(callback);
        return () => listeners.delete(callback);
    }
};

export default AirlineThemeManager;

/**
 * portal_normal.ftl initialization:
 *
 * <script type="module">
 *   import AirlineThemeManager from "${themeDisplay.getPathThemeJavaScript()}/airline-theme-manager.js";
 *
 *   AirlineThemeManager.onChange((config) => {
 *     const logo = document.querySelector("[data-airline-logo]");
 *     if (logo) logo.src = config.logoUrl;
 *   });
 *
 *   const selectedCode = "${(request.getParameter('airline')!'')?js_string}";
 *   if (selectedCode) {
 *     AirlineThemeManager.fetch(selectedCode).then((config) => {
 *       AirlineThemeManager.persist(config.code);
 *       AirlineThemeManager.apply(config);
 *     });
 *   } else {
 *     AirlineThemeManager.restore();
 *   }
 * </script>
 */