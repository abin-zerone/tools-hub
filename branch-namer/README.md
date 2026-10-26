# Branch Namer

A small static form that builds standardized branch names for X-Fly G5 repos, following the ADO folder-grouping convention (release trains, work items cut from a release, work items cut from Dev/Production, and work items stacked on an unmerged branch).

No build step, no dependencies — plain HTML/CSS/JS.

## Run locally

Just open `index.html` in a browser, or serve it so relative paths behave normally:

```bash
cd branch-namer
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy on GitHub Pages

1. Push this folder to a repo (or a `docs/` folder / `gh-pages` branch of an existing one).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to the branch/folder containing `index.html`.
4. Save — GitHub gives you a URL like `https://<org>.github.io/<repo>/` within a minute or two.

## Editing the rules

All the naming logic lives in `script.js`:
- `PARENT_MAP` — the repo → Dev/Production parent-branch lookup table (section 3 of the convention).
- `VERSION_RE`, `TICKET_NUM_RE`, `DESC_RE` — format validation for version numbers, ticket IDs, and short descriptions.
- `generateReleaseTrain`, `generateFromRelease`, `generateFromDevProd`, `generateStacked` — one function per branch type, each returning the assembled name plus any validation messages.

If a repo gets renamed or a new Dev/Production pair is added, update `PARENT_MAP` and the `<option>` list in `index.html`'s `#dp-repo` select.
