# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/abdallah28r/sequential-image-loader/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/abdallah28r/sequential-image-loader/releases/tag/v1.0.0
