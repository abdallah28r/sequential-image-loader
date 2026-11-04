# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.1.0] - 2026-11-04

### Added
- **URL rules** on a new *Advanced settings* page (Settings → Advanced settings: URL rules):
  - "Always on" list: turn sequential loading on for matching links, even if the site isn't enabled.
  - "Never on" list: turn it off for matching links. Always wins over everything else.
  - `*` wildcard anywhere in a link (`/comics/*`, `/node/*/8/simple`, `*.example.com`).
  - `http`/`https`, `www.`, letter case, trailing `/`, and `?query`/`#hash` (unless the rule has them) are ignored.
  - "Page you came from" box with one-click **+ Always on** / **+ Never on** buttons.
  - "Test a link" box that shows whether a link is on or off and which rule decided it.
- Popup shows when a URL rule turns the current page on or off.
- Rules are re-checked when a single-page site changes its URL without reloading; waiting images are released if the new URL is excluded.
- Settings and rule changes apply to new images right away, without reloading.

### Changed
- The page is watched from the moment settings load instead of waiting for `DOMContentLoaded`, so more images are caught before they start downloading.
- Images that have already finished loading are no longer reloaded.
- Translations moved to a shared `i18n.js`; links inside Arabic text are shown left-to-right correctly.

## [1.0.0] - 2026-11-04

First public release.

### Added
- Loads page images one at a time (or 2, 3 or 5 at a time) instead of all in parallel.
- Handles `<img src>`, `<img srcset>` and `<picture><source srcset>`.
- Picks up images added later (infinite scroll, AJAX) with a `MutationObserver`.
- Per-site on/off switch, off by default on every site.
- On-page progress pill (`⏳ 4/23`) that hides itself when loading finishes.
- Toolbar badge showing how many images are still waiting.
- Popup with live progress bar.
- Settings panel (gear icon) with:
  - Language switch: English (default) and Arabic with full right-to-left layout.
  - List of all enabled sites, each with a **Disable** button.

[Unreleased]: https://github.com/abdallah28r/sequential-image-loader/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/abdallah28r/sequential-image-loader/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/abdallah28r/sequential-image-loader/releases/tag/v1.0.0
