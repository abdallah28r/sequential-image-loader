# Sequential Image Loader

**Make slow, image-heavy pages usable again by loading images one at a time.**

Some pages (long galleries, comic readers, photo archives) ask the browser to download dozens of images at once. On a slow connection or a busy server, that makes *everything* slow: nothing finishes, and the page feels frozen.

Sequential Image Loader is a small Chrome extension that puts those images in a queue and loads them **in order, one after another** (or a few at a time, your choice). The first images appear quickly and the page stays responsive.

- 🔌 **Off by default.** It does nothing until you turn it on for a site or a page.
- 🎯 **You choose where it runs.** A whole site, one section (`https://example.com/comics/*`), or a single page. You can also block pages where it should never run.
- 📊 **Live progress.** A small badge on the page and on the toolbar icon shows how many images are left.
- 🌓 **Light, Dark or Auto.** The interface follows your system, or the theme you pick.
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
2. Click the extension icon. The popup tells you whether it's running on this page.
3. Click **Turn on for the whole site** or **Turn on for this page only**. The page reloads automatically.
4. Images now load in order. A small counter in the corner (for example `4 / 23` with a progress bar) shows progress and disappears when everything has loaded.

The popup only shows the buttons that make sense for the page you're on:

| The page is… | Buttons you see |
|---|---|
| Off | **Turn on for the whole site**, **Turn on for this page only** |
| On, by a whole-site or section rule | **Never on this page** (and **whole site** if it's only a section) |
| On, by a "this page only" rule | **Turn on for the whole site** |
| Blocked by a "Never on" rule | **Unblock this page** |

The popup also lists the rules that affect the current page, each with a **Remove** button.

**Images at a time:** choose `1` for strictly one at a time, or `2`, `3` or `5` for a bit more speed while still avoiding the flood.

### Settings ⚙️

Click the gear icon in the popup to change the language (English by default, or العربية with a right-to-left layout) and the appearance (**Light**, **Dark** or **Auto**, which follows your system). Click **Open Advanced settings** at the bottom of the popup to manage all your rules.

### Advanced settings: all your rules

Every choice you make is saved as a **rule**. The Advanced settings page lists them by site:

- Each site is one row with its logo and how many rules it has (✓ always on, ✕ never on). Click it to open it.
- Inside, the full links are listed in two sections: **✓ Always on** and **✕ Never on**.
- Each section has its own **+ Add** button. It opens a box that already contains the site name, so you only type the rest (for example `/comics/*`).
- **✕** next to a link deletes it. Changes are saved immediately.
- **+ Add site** at the top adds a site that has no rules yet.

**"Never on" always wins.** If a link matches both lists, the extension stays off. Adding a link to one list removes it from the other.

The page and the popup stay in sync: a change in one shows up in the other right away.

Use `*` to mean "anything":

```text
https://example.com/comics/*            every page under /comics/
https://example.com/node/*/8/simple     any id in the middle
https://*.example.com/*                 every subdomain
https://example.com/comics/ABD          just this page
```

Matching rules:

- `http` / `https` and `www.` are ignored, and so is letter case.
- `?…` and `#…` at the end of a link are ignored (so `/comics/ABD` also matches `/comics/ABD?page=2`), unless your rule contains `?` or `#` itself.
- A trailing `/` is ignored, and `/*` at the end also matches the page itself (`/comics/*` matches `/comics`).

When you open the page from the popup, the site you were on is already open. A **Test a link** box tells you whether a link will be on or off, and which rule decided it.

Rules apply right away to new images. On sites that change the URL without reloading the page, the rules are checked again on every URL change.

---

## How it works

At page start, the extension checks your rules. If the page is active, it finds every `<img>` (and `<picture><source>`), temporarily removes its `src`/`srcset` before the download begins, and puts the image in a queue. It then restores one image at a time and waits for its `load` or `error` event before starting the next. A `MutationObserver` also catches images that are added later (infinite scroll, AJAX content).

## Permissions

| Permission | Why it's needed |
|---|---|
| `storage` | Remember your rules, your "images at a time" choice and your language. |
| `tabs` | Read the current tab's address so the popup knows which page you're on, and reload it after you change a setting. |
| `favicon` | Show each site's logo on the Advanced settings page. The logo comes from Chrome's own icon cache; nothing is downloaded. |
| Content script on all sites | The script has to be present early on any page you *might* turn it on for. Where no rule turns it on, it reads your rules and stops. |

## Privacy

This extension collects **no data**. It sends nothing anywhere, has no analytics, and makes no network requests of its own. Your rules are stored locally with `chrome.storage.local`. See [PRIVACY.md](PRIVACY.md).

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
