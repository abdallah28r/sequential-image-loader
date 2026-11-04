# Sequential Image Loader

**Make slow, image-heavy pages usable again by loading images one at a time.**

Some pages (long galleries, comic readers, photo archives) ask the browser to download dozens of images at once. On a slow connection or a busy server, that makes *everything* slow: nothing finishes, and the page feels frozen.

Sequential Image Loader is a small Chrome extension that puts those images in a queue and loads them **in order, one after another** (or a few at a time, your choice). The first images appear quickly and the page stays responsive.

- 🔌 **Off by default.** It does nothing until you turn it on for a specific site.
- 🌐 **Per-site setting.** Turn it on for one site and leave every other site untouched.
- 📊 **Live progress.** A small badge on the page and on the toolbar icon shows how many images are left.
- 🔒 **Private.** No tracking, no analytics, no network requests of its own. Settings stay in your browser.

---

## Installation

The extension is not on the Chrome Web Store yet. Installing it from this repository takes about a minute.

1. **Download** the latest `sequential-image-loader-vX.Y.Z.zip` from the [Releases](../../releases) page and **unzip** it.
   *(Or click **Code → Download ZIP** on this page, or `git clone` the repository.)*
2. Open Chrome and go to **`chrome://extensions`**.
3. Turn on **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the unzipped folder (the one that contains `manifest.json`).
5. Done. Pin the icon from the 🧩 puzzle menu so it stays in the toolbar.

Works in Chrome and other Chromium-based browsers (Edge, Brave, Opera, Vivaldi).

> **Updating:** download the new release, replace the old folder, then click the ↻ reload button on the extension's card in `chrome://extensions`.

---

## How to use

1. Open the page that loads slowly.
2. Click the extension icon.
3. Switch on **Enable for this site**. The page reloads automatically.
4. Images now load in order. A small counter in the corner (for example `⏳ 4/23`) shows progress and disappears when everything has loaded.

**Concurrent images:** choose `1` for strictly one at a time, or `2`, `3` or `5` for a bit more speed while still avoiding the flood.

To turn it off, open the popup on that site and switch it off again.

### Settings ⚙️

Click the gear icon in the popup to:

- **Change the language:** English (default) or العربية (Arabic, with a right-to-left layout).
- **Manage enabled sites:** see every site where the extension is on, and click **Disable** to turn any of them off without visiting it.

---

## How it works

At page start, the extension finds every `<img>` (and `<picture><source>`), temporarily removes its `src`/`srcset` before the download begins, and puts the image in a queue. It then restores one image at a time and waits for its `load` or `error` event before starting the next. A `MutationObserver` also catches images that are added later (infinite scroll, AJAX content).

## Permissions

| Permission | Why it's needed |
|---|---|
| `storage` | Remember which sites you enabled, your concurrency choice and your language. |
| `tabs` | Read the current tab's address so the popup knows which site you're on, and reload it after you change a setting. |
| Content script on all sites | The script has to be present early on any page you *might* enable. On sites you haven't enabled, it reads your setting and stops. |

## Privacy

This extension collects **no data**. It sends nothing anywhere, has no analytics, and makes no network requests of its own. Your per-site settings are stored locally with `chrome.storage.local`. See [PRIVACY.md](PRIVACY.md).

## Known limitations

- **The first few images may still load in parallel.** Browsers have a "preload scanner" that starts fetching images while the HTML is still being read, before any extension can run. Usually only the first 2–4 images are affected.
- **Site-managed lazy loading is left alone.** If a page keeps the real URL in `data-src` and loads it only when the image scrolls into view, the site is already loading gradually, so the extension doesn't interfere.
- **CSS background images** (`background-image`) are not queued.

## Roadmap

- More interface languages
- Optional network-level queueing via `declarativeNetRequest` to also cover the first images
- Chrome Web Store listing

## Contributing

Bug reports and pull requests are welcome. Please open an [issue](../../issues) describing the page type (no need to share private URLs) and what you expected to happen.

## License

[MIT](LICENSE). Free to use, modify and share.
