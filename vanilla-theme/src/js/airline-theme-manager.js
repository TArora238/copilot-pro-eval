(function (global) {
    "use strict";

    if (global.AirlineThemeManager) {
        return;
    }

    var STORAGE_KEY = "vanilla-theme-airline-code";
    var STAR_ALLIANCE_DEFAULTS = Object.freeze({
        code: "STAR",
        primaryColor: "#1B365D",
        secondaryColor: "#FFFFFF",
        accentColor: "#C9A227",
        fontDisplay: "Arial",
        fontBody: "Arial",
        logoUrl: "/o/vanilla-theme/images/star-alliance-logo.svg",
        rtl: false,
    });
    var CSS_PROPERTIES = {
        primaryColor: "--color-primary",
        secondaryColor: "--color-secondary",
        accentColor: "--color-accent",
        fontDisplay: "--font-display",
        fontBody: "--font-body",
        logoUrl: "--logo-url",
    };
    var listeners = new Set();
    var pendingFetches = new Map();
    var restorePromises = new Map();
    var appliedConfig = null;
    var appliedSignature = "";
    var restoredCode = "";

    function toAirlineCode(value) {
        return typeof value === "string" ? value.trim().toUpperCase() : "";
    }

    function getString(value, fallback) {
        return typeof value === "string" && value.trim() ? value : fallback;
    }

    function fallbackConfig(code) {
        var config = Object.assign({}, STAR_ALLIANCE_DEFAULTS);

        if (code) {
            config.code = code;
        }

        return config;
    }

    function normalizeConfig(config, requestedCode) {
        var source = config && typeof config === "object" && !Array.isArray(config) ? config : {};

        return {
            code: toAirlineCode(source.code) || requestedCode || STAR_ALLIANCE_DEFAULTS.code,
            primaryColor: getString(source.primaryColor, STAR_ALLIANCE_DEFAULTS.primaryColor),
            secondaryColor: getString(source.secondaryColor, STAR_ALLIANCE_DEFAULTS.secondaryColor),
            accentColor: getString(source.accentColor, STAR_ALLIANCE_DEFAULTS.accentColor),
            fontDisplay: getString(source.fontDisplay, STAR_ALLIANCE_DEFAULTS.fontDisplay),
            fontBody: getString(source.fontBody, STAR_ALLIANCE_DEFAULTS.fontBody),
            logoUrl: getString(source.logoUrl, STAR_ALLIANCE_DEFAULTS.logoUrl),
            rtl: source.rtl === true,
        };
    }

    function configSignature(config) {
        return [
            config.code,
            config.primaryColor,
            config.secondaryColor,
            config.accentColor,
            config.fontDisplay,
            config.fontBody,
            config.logoUrl,
            config.rtl,
        ].join("\u001f");
    }

    function notifyListeners(config) {
        listeners.forEach(function (listener) {
            try {
                listener(config);
            } catch (error) {
                if (global.console && typeof global.console.error === "function") {
                    global.console.error("Airline theme change listener failed", error);
                }
            }
        });
    }

    function getStoredCode() {
        try {
            return toAirlineCode(global.sessionStorage.getItem(STORAGE_KEY));
        } catch (error) {
            return "";
        }
    }

    function fetchTheme(code) {
        var requestedCode = toAirlineCode(code);

        if (!requestedCode) {
            return Promise.resolve(fallbackConfig());
        }

        if (pendingFetches.has(requestedCode)) {
            return pendingFetches.get(requestedCode);
        }

        var request = Promise.resolve()
            .then(function () {
                if (typeof global.fetch !== "function") {
                    throw new Error("Fetch is not available");
                }

                return global.fetch("/api/themes/" + encodeURIComponent(requestedCode));
            })
            .then(function (response) {
                if (!response || !response.ok || typeof response.json !== "function") {
                    throw new Error("Theme request failed");
                }

                return response.json();
            })
            .then(function (config) {
                if (!config || typeof config !== "object" || Array.isArray(config)) {
                    throw new Error("Theme response must be an object");
                }

                return normalizeConfig(config, requestedCode);
            })
            .catch(function (error) {
                if (global.console && typeof global.console.warn === "function") {
                    global.console.warn(
                        "Using Star Alliance fallback theme for " + requestedCode,
                        error
                    );
                }

                return fallbackConfig(requestedCode);
            });

        pendingFetches.set(requestedCode, request);
        request.then(
            function () {
                pendingFetches.delete(requestedCode);
            },
            function () {
                pendingFetches.delete(requestedCode);
            }
        );

        return request;
    }

    function applyTheme(config) {
        var themeConfig = normalizeConfig(config, STAR_ALLIANCE_DEFAULTS.code);
        var root = document.documentElement;
        var signature = configSignature(themeConfig);
        var changed = signature !== appliedSignature;

        Object.keys(CSS_PROPERTIES).forEach(function (configProperty) {
            root.style.setProperty(CSS_PROPERTIES[configProperty], themeConfig[configProperty]);
        });

        root.setAttribute("dir", themeConfig.rtl ? "rtl" : "ltr");
        appliedConfig = themeConfig;
        appliedSignature = signature;

        if (changed) {
            notifyListeners(themeConfig);
        }

        return themeConfig;
    }

    function persist(code) {
        var airlineCode = toAirlineCode(code);

        if (!airlineCode) {
            return null;
        }

        try {
            var previousCode = getStoredCode();
            global.sessionStorage.setItem(STORAGE_KEY, airlineCode);

            if (previousCode !== airlineCode) {
                restoredCode = "";
            }
        } catch (error) {
            if (global.console && typeof global.console.warn === "function") {
                global.console.warn("Unable to persist the airline theme", error);
            }
        }

        return airlineCode;
    }

    function restore() {
        var airlineCode = getStoredCode();

        if (!airlineCode) {
            return Promise.resolve(null);
        }

        if (restoredCode === airlineCode && appliedConfig) {
            return Promise.resolve(appliedConfig);
        }

        if (restorePromises.has(airlineCode)) {
            return restorePromises.get(airlineCode);
        }

        var restorePromise = fetchTheme(airlineCode).then(function (config) {
            if (getStoredCode() !== airlineCode) {
                return appliedConfig;
            }

            var appliedTheme = applyTheme(config);
            restoredCode = airlineCode;

            return appliedTheme;
        });

        restorePromises.set(airlineCode, restorePromise);
        restorePromise.then(
            function () {
                restorePromises.delete(airlineCode);
            },
            function () {
                restorePromises.delete(airlineCode);
            }
        );

        return restorePromise;
    }

    function onChange(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("AirlineThemeManager.onChange requires a function");
        }

        listeners.add(callback);

        return function () {
            listeners.delete(callback);
        };
    }

    global.AirlineThemeManager = Object.freeze({
        fetch: fetchTheme,
        apply: applyTheme,
        persist: persist,
        restore: restore,
        onChange: onChange,
    });
})(window);