# Clueless Closet

A Clueless-style closet app with a 2000s desktop look, plus a "Code Closet" dashboard.
Built from the approved designs in `design/` (see `CLAUDE.md`).

## Run it

```bash
npm install
npm run dev
```

- `/` — My Closet.exe: pick tops, bottoms and extras, shuffle, save and re-wear looks, upload your own clothes
- `/dashboard` — Code Closet.exe: repos as outfit cards, pull requests, contribution calendar, activity feed

Everything (outfits, uploads, wallpaper, avatar, stars, calendar) is saved in localStorage.
Uploaded photos are downscaled before saving so they fit.

## Scripts

- `npm run dev` — dev server
- `npm run build` — typecheck + production build to `dist/`
- `npm run preview` — serve the build
