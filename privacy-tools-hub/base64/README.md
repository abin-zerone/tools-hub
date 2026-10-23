# Base64 Toolkit

A lightweight, responsive, static Base64 encoder/decoder. It supports UTF-8 text, URL-safe Base64, local file-to-Base64 conversion, and Base64-to-file downloads.

## Features

- Text encoding and decoding with UTF-8 support, including emoji and non-Latin scripts.
- Optional URL-safe Base64 (`-` and `_`, without padding).
- Local file selection and drag-and-drop; optional data URI output.
- Decode Base64 into a downloaded file with a configurable filename and MIME type.
- Copy, swap, clear, and text character/byte counts.
- Responsive light/dark themes based on the operating system preference.
- No framework, external fonts, CDN, analytics, trackers, or backend.

## Privacy and security

All processing happens in the browser. The app does not send requests to a server or third party, and it does not use cookies, localStorage, sessionStorage, IndexedDB, or other persistence APIs. File contents are read locally and held in memory only while the page is open. Refreshing or closing the page clears the in-page state.

The page includes a restrictive Content Security Policy, a `no-referrer` policy, and no external resources. User-provided content is placed in form values or text nodes rather than injected as HTML.

**Note:** the browser may retain downloaded files according to your browser's normal download settings, and clipboard contents are controlled by the browser/OS. The app itself does not persist input or output. Avoid pasting sensitive data into a browser if your device or browser is managed by someone else.

## Files

- `index.html` — page structure and security meta tags.
- `style.css` — responsive styling and system light/dark mode.
- `script.js` — all encoding, decoding, file handling, and UI logic.

## Deploy to GitHub Pages

1. Create a new repository on GitHub.
2. Put `index.html`, `style.css`, `script.js`, and `README.md` in the repository root.
3. Commit and push the files to the `main` branch. For example:
   ```bash
   git init
   git add index.html style.css script.js README.md
   git commit -m "Add private Base64 toolkit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
   git push -u origin main
   ```
4. In GitHub, open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select branch **main** and folder **/(root)**, then click **Save**.
7. Wait for GitHub Pages to publish the site. Open the URL shown in the Pages settings.

Because this is a static site with no build step, the repository root can be deployed directly.

## Verify there are no app network requests

1. Open the deployed page in a browser.
2. Open Developer Tools (`F12` or `Ctrl+Shift+I`) and select **Network**.
3. Enable **Preserve log** if desired, then reload the page with the Network panel open.
4. Confirm the only page resources are the same-origin `index.html`, `style.css`, and `script.js` files. The app does not reference remote resources.
5. Try encoding text and selecting a file while watching Network. These actions should not create requests. File reads use the browser's local `FileReader` API.
6. Optionally, use the Network panel's request-type filters and search for requests to other domains.

The first page load necessarily retrieves the static files from the host (GitHub Pages, or your local server). “No network requests” means the app makes no additional outbound requests for encoding, decoding, file reads, analytics, or other processing after those files have loaded.

## Notes

- Files larger than 50 MB display a warning because converting a file to a Base64 string can require significant memory. The conversion is performed locally; the app does not upload the file.
- The CSP intentionally uses `script-src 'self'` and `style-src 'self'`, so JavaScript and CSS are in separate same-origin files rather than inline blocks.
