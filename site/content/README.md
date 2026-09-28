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

## Server (deploy.sh)

Run `./deploy.sh` from `site/`. It pulls code, then merges CMS content:

- Sections editors changed on the server stay.
- Sections that changed only in git are updated.
- If both sides changed the same section, the server edit is kept and the conflict is printed.

On app start, `ensureSeeded` imports `cms-snapshot.json` into the server database. After `deploy.sh`, that file is already the merge, so a restart does not put the raw GitHub copy back over live pages.

Do not `git checkout` or `git reset --hard` this file on the server. That deletes the live copy `deploy.sh` merges.

**Note:** New photos must be committed under `public/uploads/` as well — the snapshot only stores CMS text/structure, not binary uploads.
