# CMS content sync

`cms-snapshot.json` is the **source of truth for page content** that travels with git.

## Localhost (edit → commit)

1. Edit pages in the admin as usual.
2. Each Save also refreshes `cms-snapshot.json`.
3. Commit and push this file (and any new files under `public/uploads/`).

Or run manually:

```bash
npm run content:export
```

## Server (pull → update)

On app start, `ensureSeeded` imports this snapshot into the server database.

You can also run:

```bash
npm run content:import
```

**Note:** New photos must be committed under `public/uploads/` as well — the snapshot only stores CMS text/structure, not binary uploads.
