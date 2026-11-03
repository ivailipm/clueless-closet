# Clueless Closet

A Clueless-style closet app with a 2000s computer OS look, plus a "Code Closet" dashboard.

## Design reference

`design/closet.design.html` and `design/dashboard.design.html` are the approved designs. They were made in a
design tool and use its own component format (`<x-dc>`, `<sc-for>`, `<sc-if>`, `{{holes}}`, a `DCLogic` class),
so they do not run on their own. Treat them as the spec: copy the layout, colours, fonts, CSS, SVG clothing
paths, sample data and behaviour from them, and rebuild everything as normal React components.

## Stack

- React + Vite + TypeScript
- React Router for the two screens: `/` closet, `/dashboard` dashboard
- Plain CSS (or CSS modules), no UI library: the beveled look is custom
- Persist state in localStorage for now; uploaded photos as data URLs (keep an eye on size)

## Look and feel

- Fonts: Silkscreen (pixel headings, buttons) and Work Sans (body), from Google Fonts
- Ink #1D1A2B, purple accent #5B4BC4, pink #C2255C, button face #D4D0E0, frame #8E84F0
- Window frame with gradient title bar, decorative _ □ x buttons, File/Edit/View menu bar, sunken content area,
  status bar, and a taskbar with a live clock and links between the two screens
- Raised bevel buttons: light top-left border, dark bottom-right border, swapped when pressed or active
- Wallpaper: plaid (default), dots, plain, or a photo the user uploads

## Closet screen

Same "fashion" look as the dashboard (royal-blue frame, leopard area that can take a photo, blue panel headers with
pink hearts, beige tabs, bottom toolbar). The pill reads "♥ MY CLOSET ♥ < PICK · MATCH · SAVE >".

- Three row panels: top half (Tops, Sweaters, Shirts), bottom half (Jeans, Skirts, Trousers),
  extras (Jackets, Bags, Scarves, Gloves, Hats); category tabs sit in each panel header
- Each row: a carousel showing 3 items with ◀◀ ▶▶ arrows (wraps around); the pink footer "+ Add your own …" opens
  the Add to closet window (photo preview, name, category) with the row's current tab preselected
- The built-in clothes are placeholder drawings; uploads get a pencil (rename / change category / remove) and ×
- Click an item to wear it; extras toggle on/off, one per extras category
- Top half layers: one tee, shirt and sweater at once (back to front), each toggled on/off
- Side panels: Today's outfit (Shuffle, Save outfit, Clear), Extras, My collections (wear a saved outfit), My uploads
- Save outfit opens a window: name the outfit and pick a collection (e.g. winter-outfits) or start a new one with a style

## Collections (shared by both screens)

- A collection is a named group of saved outfits with a style (Casual, Cozy, Party, Work, Date night, Sporty,
  Vacation, Chic), a star, a fork count and an "updated" time; stored in the closet state (`collections`)
- On the dashboard each collection is a repo card: outfit preview, outfit count, style chip (a select), ★, forks,
  "Updated …", ··· menu (open, open in codespace, fork, rename, delete); opening one lists its outfits with Wear / remove

## Dashboard screen

The dashboard follows a newer reference than `design/dashboard.design.html`: a "GitHub for fashionistas" look
(royal-blue frame, leopard-print background inside the window, beige sidebar buttons with icons, blue panel
headers with pink hearts, pink OPEN buttons, bottom toolbar). Layout and behaviour from the design file still apply.

- Top strip: menus, centred pill "♥ GITHUB ♥ < IVAILIPM'S CODE CLOSET >", Sign out (back to the closet), Help, ?
- Sidebar: avatar upload, name card (ivailipm, Geel, Belgium, totally coding), nav: Home, Repositories,
  Pull requests (open count), Issues (open count), Codespaces, Stars, Gists, Organizations, link to the closet
- Home: repositories carousel of 4; pull requests | contribution calendar | spotlight photo;
  activity feed | explore (own repos ranked by stars, forks, codespaces) | featured collection
- Repositories are the outfit collections (see Collections); + New repo creates an empty collection
- Pull requests and issues toggle Open/Merged or Open/Closed and take comments; codespaces take pushes
- Bottom toolbar: Save outfit, New repo, Import CD (backup import), Print lookbook, Preview (saved closet looks), sound
- No invented stats: stars, forks, comments, updated times, calendar and activity start empty and fill in from use

## Conventions

- Conventional commits with optional scope, e.g. `feat(closet): add carousel`
- Accessible controls: real buttons and labels, aria-pressed on toggles, aria-label on icon buttons, 44px targets
