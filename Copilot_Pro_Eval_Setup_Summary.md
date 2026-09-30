# Copilot Pro Evaluation Setup Summary

## 1. Purpose

This document records the setup used to evaluate Copilot (Pro account) against the Frontend AI Tools prompt set, covering both cold-prompt quality and agentic, in-context theme builds.

## 2. Folder Structure

The workspace is one Git working tree rooted at `Copilot Pro/`; `.git/` is at the root rather than inside the output folders. The Git-tracked `copilot-eval-outputs/` and `raw-outupts/` folders keep static prompt/response captures separate from the real Liferay theme edits in `vanilla-theme/`, so path-scoped diffs and history remain clear. `raw-outupts/` is the existing filesystem spelling.

```text
Copilot Pro/
├── .git/
├── .vscode/
├── Frontend_AI_Tools_Evaluation_Prompts.md
├── Copilot_Pro_Eval_Setup_Summary.md
├── copilot-eval-outputs/
│   ├── 01-js-core/
│   │   ├── 1.1-array-transform.js
│   │   ├── 1.2-cache-module.js
│   │   └── 1.3-parallel-airline-fetch.js
│   ├── 02-vanilla-js-state/
│   │   ├── 2.1-airline-theme-manager.js
│   │   └── 2.2-flight-search-state.js
│   ├── 03-gsap-scrolltrigger/
│   │   ├── 3.1-journey-steps.js
│   │   ├── 3.2-plane-animation.js
│   │   └── 3.3-history-timeline.js
│   ├── 04-scss-theming/
│   │   ├── _airlines.scss
│   │   ├── _components.scss
│   │   ├── _theme-airline.scss
│   │   ├── _tokens.scss
│   │   ├── _typography.scss
│   │   └── main.scss
│   ├── 04-scss-bem-clay/
│   │   ├── .validation.css.map
│   │   ├── _airlines.scss
│   │   ├── _components.scss
│   │   ├── _hero.scss
│   │   ├── _reset-clay.scss
│   │   ├── _scope.scss
│   │   ├── _theme-airline.scss
│   │   ├── _tokens.scss
│   │   ├── liferay-look-and-feel.xml
│   │   └── main.scss
│   └── 05-freemarker/
│       ├── 5.1-navigation-menu.ftl
│       ├── 5.2-airline-hub.css
│       └── 5.2-airline-hub.tpl
├── raw-outupts/
│   ├── 1.1-array-transform.md
│   ├── 1.2-cache-module.md
│   ├── 1.3-parallel-airline-fetch.md
│   ├── 2.1-airline-theme-manager.md
│   ├── 2.2-flight-search-state.md
│   ├── 3.1-journey-steps.md
│   ├── 3.2-plane-animation.md
│   ├── 3.3-history-timeline.md
│   ├── 4.1-scss-token-system.md
│   ├── 4.2-bem-clay-strategy.md
│   ├── 5.1-navigation-menu.md
│   └── 5.2-airline-hub.md
└── vanilla-theme/
    ├── .gitignore
    ├── build/
    │   ├── css/
    │   ├── font/
    │   ├── images/
    │   ├── js/
    │   ├── templates/
    │   └── WEB-INF/
    ├── dist/
    ├── gulpfile.js
    ├── liferay-theme.json
    ├── node_modules/
    ├── package-lock.json
    ├── package.json
    └── src/
        ├── css/_custom.scss
        ├── images/thumbnail.png
        ├── js/airline-theme-manager.js
        ├── templates/portal_normal.ftl
        └── WEB-INF/
            ├── liferay-look-and-feel.xml
            └── liferay-plugin-package.properties
```

## 3. Track A - Prompt Evaluation

The prompt evaluation used direct chat prompts, with and without file access, at Terra Medium and High. The intended scope was the full Frontend AI Tools prompt set. Although the run is described as an 11-prompt evaluation, the source file and stored captures contain twelve numbered prompts: `1.1`, `1.2`, `1.3`, `2.1`, `2.2`, `3.1`, `3.2`, `3.3`, `4.1`, `4.2`, `5.1`, and `5.2`.

For each prompt, a static implementation is stored in `copilot-eval-outputs/` and a corresponding Markdown response is stored in `raw-outupts/`. The Git history records the initial prompt and a follow-up for every numbered prompt. The recorded messages begin with `initial commit with 1st prompt response`, continue through `Prompt 1.1 follow up`, `Prompt 1.2`, and the later numbered prompt/follow-up pairs, and end this track with `Prompt 5.2` and `Prompt 5.2 Follow Up`. Prompt `3.3` also has the correction commit `Prompt 3.3 Follow Up - md file updated`.

## 4. Track B - Agentic/Theme Build

The agentic track used the `vanilla-theme/` project. It was scaffolded with `yo liferay-theme`, producing the Liferay theme configuration, Gulp setup, dependency manifests, source directory, generated `build/` output, and `dist/` directory. Prompt `2.1`, the AirlineThemeManager module, was then executed in context and applied to the theme through `src/js/airline-theme-manager.js`, with initialization support in `src/templates/portal_normal.ftl`.

The related committed history is:

- `181becd` - `Prompt 2.1`: creates `copilot-eval-outputs/02-vanilla-js-state/2.1-airline-theme-manager.js` and `raw-outupts/2.1-airline-theme-manager.md`.
- `73c9d1d` - `Prompt 2.1 Follow Up`: revises both captured `2.1` artifacts.
- `df6ec2c` - `Vanilla theme generation + prompt tasks and build creation steps on Max mode`: creates the tracked `vanilla-theme/` project files, including `src/js/airline-theme-manager.js` and `src/templates/portal_normal.ftl`.

There is one Git commit scoped to `vanilla-theme/`: `df6ec2c`. Therefore, the scaffold, in-context `2.1` integration, and tracked build setup are recorded together in that commit rather than as separate theme-path commits.

## 5. Status

### Done

- [x] The complete stored prompt inventory is present for the twelve actual prompt IDs from `1.1` through `5.2`.
- [x] Static code captures and Markdown responses are present for every numbered prompt.
- [x] The Git history contains initial and follow-up commits for every numbered prompt, with an additional Markdown correction for `3.3`.
- [x] The Liferay theme scaffold, dependencies, source files, generated `build/` directory, and `dist/` directory are present.
- [x] The in-context AirlineThemeManager implementation and its portal template initialization are committed in `df6ec2c`.

