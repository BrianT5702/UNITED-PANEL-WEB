# United Panel — New Website (Phase 1)

Modern rebuild of [ur.com.my](https://www.ur.com.my/) starting with the **homepage** plus a **custom admin** to edit text and images.

## Quick start

```powershell
cd site
npm install
npm run db:setup
npm run dev
```

- Public homepage: [http://localhost:3000/](http://localhost:3000/)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)
- After login you get the **visual editor** (click text/photos on the real page layout)
- Default admin password: `unitedpanel-admin` (change in `.env`)
- Optional form editors: `/admin/advanced`

## Admin password

Set in `.env`:

```
ADMIN_PASSWORD=your-secure-password
SESSION_SECRET=long-random-string
DATABASE_URL="file:./dev.db"
```

## What admins can edit

Homepage sections only (for now):

- Site settings (logo, name)
- Navigation links
- Hero (text + background image)
- Proof points
- Product highlight cards (add / remove / reorder + images)
- Capability block
- Certificates strip
- News teaser (show/hide)
- Contact CTA details
- Footer / copyright

Admins **cannot** invent new page features — those stay in code.

## Project layout

- `src/app` — public pages + `/admin`
- `src/components/site` — public UI
- `src/components/admin` — custom admin UI
- `src/lib` — auth, content, defaults
- `prisma` — SQLite schema + seed
- `public/uploads` — uploaded images

## Notes

- The static RockWool prototype remains in the parent folder for reference.
- Later phases: About, Products, RockWool page, Contact, then remaining UR pages.
- Go-live needs Node.js hosting (not classic ASPX-only IIS).
