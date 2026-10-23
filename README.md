# Private Dev Tools

A lightweight hub for privacy-focused developer utilities. Tools are static pages that process data locally in the browser, with no backend, analytics, trackers, third-party dependencies, or persistent browser storage.

## Privacy guarantees

- No API or backend calls. The Content Security Policy sets `connect-src 'none'`.
- No `localStorage`, `sessionStorage`, IndexedDB, cookies, or other app-managed persistence.
- No analytics, trackers, external fonts, CDNs, or remotely loaded registry.
- User-provided content is rendered using form values, `createElement`, and `textContent`; never inserted as dynamic HTML.
- Every page has a restrictive CSP and `referrer` policy of `no-referrer`.
- Search and category selection are held in memory and reset on refresh.

The site must retrieve its static HTML, CSS, and JavaScript from the hosting origin on initial page load. The app does not make additional outbound requests to process input.

## Structure

```text
/
├── index.html                 # Landing page
├── 404.html                   # Styled not-found page
├── README.md
├── assets/
│   ├── style.css              # Shared styles and color themes
│   ├── tools.js               # Tool registry (single source of truth)
│   └── main.js                # Search, filters, and card rendering
├── base64/
│   ├── index.html
│   └── script.js
├── _template/
│   └── index.html             # Copy this to start a new tool
├── url-encode/
├── json-formatter/
├── hash-generator/
├── jwt-decoder/
└── uuid-generator/
```

The tool folders other than `base64/` currently have no tool page; their registry cards are marked **Coming soon** and are non-clickable.

## Add a new tool

1. Copy `_template/` to a new folder, such as `url-encode/`.
2. Update the page title and visible tool heading in `url-encode/index.html`.
3. Keep the shared stylesheet reference `../assets/style.css`, the shared header link `../`, the CSP meta tag, and the `no-referrer` meta tag.
4. Put tool-specific JavaScript in a same-folder `script.js` file and load it with a same-origin `<script src="script.js" defer></script>` tag. Do not use inline scripts or inline event handlers.
5. Build all interactions with browser APIs only. Do not add network calls, analytics, remote assets, or persistent storage.
6. Add one object to `window.TOOL_REGISTRY` in `assets/tools.js` with these fields:
   - `id`: stable unique identifier
   - `name`: card title
   - `description`: short summary
   - `category`: e.g. `Encoding`, `Formatting`, `Security`, or `Generators`
   - `folder`: relative folder path, e.g. `url-encode/`
   - `icon`: emoji or simple text
   - `tags`: array of search keywords
   - `status`: `live` or `coming soon`
7. Ensure the folder path is relative and ends with `/`. When the tool is ready, set `status` to `live`.
8. Test the page locally and through GitHub Pages. Check keyboard navigation, narrow screens, and browser console errors.

The category filter chips are generated from categories in the registry. You do not need to update the landing page HTML or JavaScript when adding a tool.

## Deploy to GitHub Pages

1. Create a new GitHub repository.
2. Copy all files and folders in this project to the repository root.
3. Commit and push to the `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Add private developer tools hub"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
   git push -u origin main
   ```
4. In GitHub, open **Settings → Pages**.
5. Under **Build and deployment**, select **Deploy from a branch**.
6. Select branch **main** and folder **/(root)**, then click **Save**.
7. Wait for the published URL to appear in Pages settings.

All internal links and assets use relative paths, so the site works at a GitHub Pages project path (`/<repo>/`) and on a custom domain.

## Verify network behavior

1. Open the deployed site and press `F12` to open Developer Tools.
2. Select **Network**, then reload.
3. Initial requests should be limited to this site's own static files.
4. Search, change category filters, and open the Base64 tool. Encoding, decoding, and file conversion should not cause additional network requests.
5. Check the Console for CSP violations and the Network panel for requests to other domains.

## Security notes

- Base64 is an encoding, not encryption.
- JWT decoding only becomes useful when a future tool is implemented; decoding a JWT does not verify its signature.
- Browser extensions, device management software, the operating system clipboard, and browser download settings are outside this app's control.
- Large files may consume substantial memory while being converted.
