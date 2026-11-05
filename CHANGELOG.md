# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.3.0] - 2026-11-05

### Changed
- **New look ("Compact pro").** The popup and the Advanced settings page were redesigned: tighter spacing, one blue accent with an amber highlight, clearer status colors, and no emoji in the interface.
- **New logo**: stacked image frames, for the toolbar icon (now also at 32 px), the popup and the settings page.
- **New on-page counter**: a small pill with the logo, the count and a progress bar, which turns into a check mark when every image has loaded. It is isolated from the page's own styles.
- Interface text was cleaned up: unused text removed, "Remove" used everywhere, and "1 rule" instead of "1 rules".

### Added
- **Light, Dark and Auto themes.** Pick one in the popup's settings or at the top of the Advanced settings page; Auto (the default) follows your system. Both windows stay in sync.

## [1.2.0] - 2026-11-05

### Changed
- **Everything is a rule now.** The separate "Enable for this site" switch is gone; turning a whole site on simply adds the rule `site.com/*`. Sites you enabled in an earlier version are converted to that rule automatically, so nothing stops working.
- **Simpler popup.** It shows whether the extension runs on the current page and why, and only the buttons that make sense there: *Turn on for the whole site*, *Turn on for this page only*, *Never on this page*, or *Unblock this page*. It also lists the rules that affect the page, each with a *Remove* button.
- **New Advanced settings page.** Rules are grouped by site. Each site is a folded row with its logo and rule counts; opening it shows the full links under *Always on* and *Never on*, each section with its own *+ Add* button (the site name is filled in for you). Changes save immediately, with no Save button.
- Adding a link to one list removes it from the other, so a rule can't be in both.
- Links with non-Latin letters (for example Arabic) are stored and shown readably instead of as `%D8%…` codes, and both forms match.

### Added
- *Open Advanced settings* link at the bottom of the popup.
- *+ Add site* on the Advanced settings page for sites that have no rules yet.
- The popup and the Advanced settings page stay in sync while both are open.
- `favicon` permission, used only to show site logos from Chrome's own icon cache.

### Removed
- The list of enabled sites in the popup's settings panel (all rules are on the Advanced settings page now).

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

[Unreleased]: https://github.com/abdallah28r/sequential-image-loader/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/abdallah28r/sequential-image-loader/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/abdallah28r/sequential-image-loader/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/abdallah28r/sequential-image-loader/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/abdallah28r/sequential-image-loader/releases/tag/v1.0.0
