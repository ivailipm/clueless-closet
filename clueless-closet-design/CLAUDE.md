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

- Three rows: top half (Tops, Sweaters, Shirts), bottom half (Jeans, Skirts, Trousers),
  extras (Jackets, Bags, Scarves, Gloves, Hats)
- Each row: category tabs, a carousel showing 3 items with ◀◀ ▶▶ arrows (wraps around), and "+ Add your own" upload
- Click an item to wear it; extras toggle on/off, one per extras category
- Side panel builds the outfit (top, bottom, extras) with Shuffle, Save outfit, Clear, and saved looks you can re-wear

## Dashboard screen

- Sidebar: avatar upload, name card (ivailipm, Geel, Belgium), nav (Home, Repositories, Pull requests with
  open count, Calendar, Activity) that filters the panels, link back to the closet
- Repositories as outfit cards: carousel of 4, star toggle, "+ New repo" form
- Pull requests: Open toggles to Merged
- Contribution calendar: real current month, month navigation, clicking a day steps its level 0-4
- Activity feed built from the user's actions; outfit of the day; featured collection with Install look
- No invented stats: stars, reviews and calendar start empty and fill in from use

## Conventions

- Conventional commits with optional scope, e.g. `feat(closet): add carousel`
- Accessible controls: real buttons and labels, aria-pressed on toggles, aria-label on icon buttons, 44px targets
