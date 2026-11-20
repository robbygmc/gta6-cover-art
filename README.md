# Palmline Cover Studio

![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)
![rank](https://make.fun/badge/gta6-cover-art-01/robbygmc/gta6-cover-art/rank.svg)
![reward](https://make.fun/badge/gta6-cover-art-01/robbygmc/gta6-cover-art/reward.svg)

Turn your own photo and a caption into GTA-style multi-panel cover art —
a poster maker for the streets of Vice City, running entirely offline in
your browser. Pick a layout, pick a colour grade, crop each panel by
dragging, write the title, and export a share-ready PNG.

## What it does

- **8 poster layouts** — Vice Grid (2×2), Hero Left, Hero Right, Strip,
  Palmline (slanted diagonal bands), Billboard, Triptych and Mosaic.
  Slanted parallelogram panels, like the posters.
- **9 colour grades** — Sunset, Neon, Vice, Dusk, Heat, Noir, Palm,
  Chrome and Midnight, applied with canvas filters, gradient overlays
  and a vignette.
- **Any photo** — upload from your machine (nothing is ever uploaded
  anywhere), or start from the two built-in sample photos plus a
  sunset-street scene the app draws itself. One photo can fill every
  panel, or each panel can hold a different photo.
- **Crop per panel** — click a panel to select it, drag to pan, scroll or
  use the slider to zoom, each panel independently.
- **Big retro-chrome lettering** — an editable title in three styles
  (Chrome, Sunset, Outline) with layered 3D offsets and auto-fit, an
  editable subtitle, three editable cast tags, an editable billing block
  and a round Palmline seal.
- **Export PNG** in the three common post sizes: **1080×1080**,
  **1080×1350** and **1920×1080**.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: `app/` is plain static files. Fonts are
bundled under `app/fonts/` (Anton and Archivo, SIL Open Font License —
see `app/fonts/OFL.txt`). No Rockstar logo, artwork, character or font
is used anywhere; the design is original.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored make.fun library.

## Screenshots

`1-cover-landscape` is the best exported cover (1920×1080), `2-editor`
shows the editor with a photo loaded, `3-cover-portrait` and
`4-cover-square` show the other two export sizes.

## License

MIT — see [LICENSE](LICENSE).
