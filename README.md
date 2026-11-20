# Palmline Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/robbygmc/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/robbygmc/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Turn your own photos into GTA-style poster art. **Palmline Cover Studio** is
an offline web app: pick a layout, drop in your photos, crop each panel,
choose a sunset or neon colour grade, write your caption and cast tags, and
export a finished cover as a PNG to share.

## What it does

- **8 multi-panel layouts** — Vice Grid, Hero Left, Hero Right, Strip,
  Palmline (diagonal sash), Billboard, Triptych and Mosaic, with leaning
  dividers and poster gutters.
- **9 colour grades** — Sunset, Neon, Vice, Dusk, Heat, Noir, Palm, Chrome
  and Midnight, each a tuned filter + tint + vignette recipe.
- **3 title styles** — Chrome, Sunset and Outline, with layered 3D
  extrusion, gradient fills and auto-fit sizing, plus a subtitle, billing
  block and the Palmline seal.
- **Any photo** — upload your own (they never leave your machine), crop and
  position each panel by dragging and scrolling, fill every panel with one
  photo or use a different photo per panel. Two sample photos and a drawn
  sunset-street scene are built in.
- **Fast export** — one click exports a PNG in **1920 × 1080**,
  **1080 × 1350** or **1080 × 1080**.

## Try it

```sh
node serve.ts            # serves app/ at http://localhost:8080
```

Everything is static files under `app/` — no build step, no network, no
tracking. Fonts (Anton, Archivo) are vendored under `app/fonts/` under the
SIL Open Font License. Nothing here copies Rockstar Games: no logos,
wordmarks, artwork, characters or fonts from any game.

## Entry

Built for the make.fun bounty
[Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01).
`main.ts` hands the app in: it copies `app/` and `screenshots/` to
`/output` and writes `dossier.json` with the vendored make.fun library.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
