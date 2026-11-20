# Infrared Dynamic 3D Scene Reconstruction — Project Page

Static academic project page for monocular infrared dynamic 3D/4D scene reconstruction, built with plain HTML, CSS, and vanilla JavaScript so it works over static HTTP hosting (e.g., GitHub Pages with `.nojekyll`) and direct offline `file://` inspection without external CDNs or runtime `fetch()` calls.

## Local Preview

Run a local static server from `site-demo/`:

```powershell
python -m http.server 8123 --bind 127.0.0.1
```

Then open [http://127.0.0.1:8123/](http://127.0.0.1:8123/). Direct `file://` opening of `index.html` is also supported.

## Assets & Self-Hosted Fonts

- **Thermal input sequence**: `assets/scene17.mp4` and `assets/scene17.jpg` (20 preprocessed frames from `Dynamic_LTR` `scene17`, encoded at 5 fps).
- **Approximate 3D point cloud**: `assets/scene17-cloud.js` (`window.demoCloud`, base64-packed Int16 coordinates with static structure vs. dynamic motion flags). Rendered in `viewer.js` with `#0D1720` optical viewport, distance-faded grid, depth-attenuated points, camera presets (`Default`, `Top`, `Front`, `Reset`), and layer filtering (`All`, `Static Structure`, `Dynamic Motion`).
- **2D qualitative comparison**: `assets/compare/{reference,physir,tapip3d,rife}/00001..00014.png` (12 interpolated evaluation frames: `[1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14]`).
  - `Ground Truth` is labeled **Reference**.
  - `DGGT + TAPIP3D`, `DGGT + RIFE`, and `PhysIR (Default TI)` are labeled **Baseline**.
- **Dynamic motion masks**: `assets/mask-start.*`, `assets/mask-middle.*`, `assets/mask-end.*` (three synchronized segments covering frames `00–06`, `07–13`, `14–19`).
- **Self-hosted typography**: `assets/fonts/` stores WOFF2 subsets for `Source Serif 4`, `IBM Plex Sans`, and `IBM Plex Mono`, referenced via relative `./assets/fonts/...` rules in `styles.css`.

> **Note:** Do not modify, crop, move, or re-encode existing dataset assets or `tools/prepare_assets.py`.

## Placeholder Replacement Guide

Search for `<!-- REPLACE:` comments in `index.html` when finalizing paper details:

1. **Title, Authors & Affiliations**: Replace `#project-title`, `.paper-authors`, `.paper-affiliations`, and venue pill in `<header class="paper-header">`.
2. **Paper & Code Links**: Replace the `Coming Soon` `.btn-soon` spans in `.paper-actions` with real `<a class="btn btn-secondary" href="...">` links once available.
3. **TL;DR & Abstract**: Replace the draft `.tldr-box` sentence and `.abstract-body` paragraph with final camera-ready copy.
4. **Method Overview Figure**: Replace the placeholder inline `<svg>` in `#method` with the final pipeline diagram.
5. **`Ours` 2D Qualitative Card**: Uncomment and populate the `.compare-card.is-ours` block inside `#comparison-side` (plus the commented `<option value="ours">` inside `#wipe-left-select` / `#wipe-right-select`) when `Ours` renders are ready. Ready `.is-ours` CSS rules are already provided in `styles.css`.
6. **Quantitative Table Metrics**: Populate `PSNR`, `SSIM`, `LPIPS`, and `tLPIPS` values (and `Ours` row) in `#results`; cells currently display `—` intentionally with no fabricated numbers.
7. **BibTeX Entry**: Replace `#bibtex-entry` in `#bibtex`.

## Design System & Color Reference

Design truth and token rules are documented in [PRODUCT.md](./PRODUCT.md) and [DESIGN.md](./DESIGN.md), anchored to Beihang University's screen VI palette:

| Hex | Token Role | Usage |
|---|---|---|
| `#005BAC` | Beihang Blue | Primary actions, active segmented tabs, slider progress, focus |
| `#003DA6` | Beihang Hover | Hover states, soft-blue badge contrast |
| `#009BDE` | Sky Focus | Dark-viewport focus rings, split-wipe divider highlight |
| `#EAF3FC` | Beihang Soft | Dataset badges, `Ours (Pending)` row tint, selection highlight |
| `#F7F9FC` | Cool Paper | Primary light reading background |
| `#FFFFFF` | Crisp Surface | Transport bars, TL;DR box, BibTeX block, table surface |
| `#EEF4FA` | Subtle Paper | Top utility strip, segmented track, table header |
| `#0D1720` | Optical Viewport | Video frames, 2D comparators, 3D point cloud canvas |
| `#6EC8BD` | Structure Teal | Static structure point cloud & legend indicator |
| `#FF9E57` | Thermal Orange | Dynamic motion point cloud & active motion mask indicator |
