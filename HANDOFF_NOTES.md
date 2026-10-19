# Zenergy Photography — Project Handoff Notes (as of 27 Sep 2026)

Static build is essentially done. Remaining work is content, not structure: adding new
photos to existing galleries, and building out the Journal. Give this file + the current
site files to a new chat to pick up without re-explaining the conventions below.

## Site structure
- `index.html` — homepage: hero → contact sheet (newest six) → intro → Enso wheel
  (`#ensoStage`) → journal teaser → footer.
- `about.html` — the philosophy/story page, Act-by-Act breakdown, kit notes, roll history.
- `galleries.html` — full gallery grid, all 5 Acts and their sub-galleries.
- `journal.html` — built (entries as `<article class="card reveal">`, newest at top; latest is
  the BMX Bowl Battle). Linked from nav/footer/homepage.
- `style.css`, `script.js` — shared styles/behaviour (incl. the Enso wheel widget).
- `photos/` — full-size images + `photos in folder.txt` (manifest). `photos/thumbs/` holds
  small copies (same file names) made by `make_thumbs.py`; galleries load those and fetch the
  full-size file only when a photo is clicked. The lightbox supports zoom (wheel / pinch /
  double-click / + - buttons, drag to pan).

## The Five Acts (colour scheme, ties to Aboriginal flag colours — see about.html)
1. **The Black** — The Cosmic & Symbolic Spark
2. **The Red** — Earth, Air, Water, Fire
3. **The Green & The Gold** — The Living & Burning Bush
4. **The Rainbow** — The Fifth Element: The Human
5. **The Yellow & The Light** — The Return to the Soil

## Gallery slugs — REQUIRED for adding new photos
Photo filenames follow: `{gallery-slug}-{number}-{original-filename}.jpg`, and should sit in
a folder named exactly `{gallery-slug}` when handed over for placement. Slugs are the
gallery's internal `<section id="...">` in galleries.html — NOT always the same as the
display name (e.g. Ensō's slug is `all-that-is`, not `enso`).

| Act | Gallery (display name) | Folder / slug to use |
|---|---|---|
| 1 | 00 — Ensō | `all-that-is` |
| 1 | 01 — Skies Above | `skies` |
| 2 | Mountains | `mountains` |
| 2 | Rivers | `rivers` |
| 2 | Waterfalls | `waterfalls` |
| 2 | Coastlines | `coastlines` |
| 3 | Of Green & Gold (Forests) | `forests` |
| 3 | Wildflowers | `wildflowers` |
| 3 | Creatures | `creatures` |
| 4 | Portraits | `portraits` |
| 4 | Streets | `streets` |
| 4 | Visual Storytelling | `story` |
| 4 | In The Zone | `in-the-zone` |
| 4 | Tathātā | `tathata` |
| 5 | Golden Hour | `golden-hour` |
| 5 | Night | `night` |
| 5 | Fungi | `fungi` |
| 5 | [Mu] | `mu` |
| 5 | Wabi-Sabi & Kintsugi | `wabi-sabi` |

## UX decisions already made (don't re-litigate without reason)
- The homepage hero does **not** link straight to `galleries.html` any more — it scrolls
  down to the wheel (`#ensoStage`) instead, so visitors see the wheel before they can bail
  to the plain gallery list.
- The "Galleries" section-head (just above the wheel) has no direct link either — same
  reasoning. A small, deliberately quiet "see all galleries" link sits **below** the wheel
  instead, as a secondary option only.
- Nav bar and footer still link to `galleries.html` normally — that's fine, those are
  expected, persistent navigation, not the problem.
- `about.html`'s closing "Forever forward — look up ↑" link is styled as a real button
  (`btn btn-solid`) so it reads as clickable — it was previously plain text and easy to miss.

## Outstanding / likely next tasks
- [ ] Run `python make_thumbs.py` after adding photos (only new ones are processed).
- [ ] Manually delete wildflowers-16-P8210851.051.jpg and wildflowers-17-P8210888.051.jpg
      from `photos/` and `photos/thumbs/` (already removed from the page and manifest).
- [ ] Minor content tweaks as they come up — structure shouldn't need major changes.
