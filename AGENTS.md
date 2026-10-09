# Crowdpromotion — guide for coding agents (Codex, Claude)

A web app connecting idle venues, local organisers, attendees and social projects in Madrid.
Plain HTML/CSS/JS, **no dependencies to install**. The page is bundled into one self-contained
`index.html` that opens by double-click (`file://`) in Safari and Chrome.

## Build & run
```bash
python3 _build/build.py
```
- Output: `index.html` (root). Never edit it by hand — edit `_build/*` and rebuild.
- Tests: open `_build/tests.html` directly in a browser — must say "All N tests passed".
- Data lives in `localStorage` (`crowdpromo-v2`). Bump `SEED_VERSION` in `core.js` when the seed shape changes. Footer → "Restore original data" resets it.
- Online-only extras: Google Font (Inter), Unsplash photos, Leaflet (unpkg) + Esri light-gray map tiles. Everything else works offline.

## Source files (`_build/`, concatenated in this order into one IIFE)
| File | Role |
|---|---|
| `i18n.js` | `I18N` dictionary — every key has `en`, `zh`, `es`. |
| `core.js` | Utilities, live dates (`TODAY` = real date), revenue split engine, photos, seed, store (`update` / `patch`), `maintain()` (48h auto-cancel + next recurring edition), selectors (ledgers, balances, payouts, profit). |
| `ui.js` | `t()` / `tx()` / money & date formatting per language, components (photo, pill, donut, legend, split table, charts, ring, QR), scroll reveal + count-up, morphing sheet, toast, confetti. |
| `site.js` | Public site: hero, marquee, explore, Leaflet map, money flow + calculator, network graph, projects, organiser path, booking sheet, My tickets (`#/me`). |
| `studio.js` | Back office for venues and organisers: overview, activities, edition check-in & settlement, payouts, referrals, requests, venue listing, create-activity wizard. |
| `app.js` | Router, nav, language switch, all click/form/input handlers, boot. |
| `template.html` | Page shell + all CSS (design language from the Movento BYD page: white/mist, glass pill nav, squircle cards, `--ease`). |

### Conventions
- One shared scope (no modules). Avoid new top-level names that clash across files.
- All money in **integer cents**; split only through `splitSales`. Every amount whose status matters shows `kindTag('Expected' | 'Transferred')`.
- UI text only via `t('key')`; data text as `{ en, zh, es }` objects read with `tx()`. Add all three languages.
- Interactions: `data-act` (click), `data-form` (submit), `data-live` (live form input), `input[type=range][data-act]` (sliders). Register in `app.js`.
- Animations: add class `rv` (+ `style="--i:n"` for stagger) to reveal on scroll; use `count(value, fmt)` for count-ups. Respect `prefers-reduced-motion`.
- No "demo"/"simulated" wording in the UI. Must work at 375px wide without horizontal scroll.

## Core rules (keep tests in sync)
- Net sales split: venue 70% · organiser 15% · project 8% · referral fund 3% · platform 4%.
- Referral fund to the 5 closest upline organisers: 1.0 / 0.8 / 0.6 / 0.4 / 0.2 %. Empty levels + rounding → project, never platform.
- Co-organiser shares the 15% 50/50. Paid only after completion + QR check-in. Below minimum 48h before → auto-cancel + refund.
- Referral links lock at the first organiser role. No joining fees. Direct donations: no commissions.

| Example | Sales | Venue | Organiser | Referral | Project | Platform |
|---|---|---|---|---|---|---|
| A Ana 20×€12 | €240 | €168.00 | €36.00 | — | €26.40 | €9.60 |
| B Luis 20×€10 | €200 | €140.00 | €30.00 | Ana €2.00 | €20.00 | €8.00 |
| C Marta 10×€30 | €300 | €210.00 | €45.00 | Luis €3.00, Ana €2.40 | €27.60 | €12.00 |
| D Javier 22×€8 | €176 | €123.20 | €26.40 | — | €19.36 | €7.04 |

## Ideas for next tasks
1. Real backend (Supabase/Firebase) so bookings are shared between devices.
2. Calendar export (.ics) for tickets.
3. Printable report route for the presentation (results table + revenue vs profit).
4. Accessibility pass: focus trap in the sheet, `aria-live` for toasts.
