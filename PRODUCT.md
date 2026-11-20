# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Computer vision, 3D/4D reconstruction, and infrared perception researchers, reviewers, and technical readers inspecting dynamic thermal reconstruction outputs in desktop and mobile browsers, either over static HTTP (e.g., GitHub Pages) or locally offline.

## Product Purpose

Present an academic research project showcase and interactive inspection environment for dynamic infrared 3D/4D scene reconstruction evaluated on `Dynamic_LTR` (`scene17`), enabling readers to verify synchronized thermal input sequences, inspect an interactive 3D point cloud preview, compare 2D baseline frame interpolations, review quantitative evaluation slots, examine temporal motion masks, and copy BibTeX citation metadata.

## Positioning

Pairs synchronized 5 fps infrared sequences with direct client-side scientific inspection—interactive 3D point cloud orbit/zoom with static-structure vs. dynamic-motion filtering, 12-frame interpolated 2D qualitative comparison across side-by-side and live split-wipe modes, and segmented temporal motion-mask review—with zero external CDN or backend runtime requirements.

## Operating Context

Static HTML, CSS, and vanilla JavaScript project deployed as a static site (`.nojekyll`, relative `./` paths) and viewable via `python -m http.server` or direct `file://` access. Uses pre-bundled point-cloud data (`assets/scene17-cloud.js`) and local media assets so every demonstration works reliably offline without CORS or network failures.

## Capabilities and Constraints

- Full English academic computer-vision conference (CVPR/ICCV/SIGGRAPH style) project page structure across seven sections: Dynamic Point Cloud (`#reconstruction`), Abstract (`#abstract`), Method Overview (`#method`), 2D Qualitative Comparison (`#comparison`), Quantitative Results (`#results`), Dynamic Motion Masks (`#masks`), and BibTeX (`#bibtex`).
- Immutable dataset assets: never modify, crop, move, or re-encode existing assets (`assets/scene17.*`, `assets/mask-*.*`, `assets/compare/*`, `assets/scene17-cloud.js`, or `tools/prepare_assets.py`), and never touch `../.git`.
- Strict scientific attribution: never mislabel `DGGT + TAPIP3D`, `DGGT + RIFE`, or `PhysIR (Default TI)` as `Ours`. Label `Ground Truth` as `Reference`, and `DGGT` / `PhysIR` variants as `Baseline`. Reserve explicit pending slots (`Ours (Pending)` with `—` metrics and an insertable HTML/CSS `Ours` comparison slot) for final method outputs.
- Explicit draft placeholders: mark approximate 3D point cloud geometry (`Approximate Geometry Preview`), pipeline figure placeholder (`Figure Placeholder`), and unconfirmed paper metadata (title, authors, paper/code links, abstract, BibTeX) clearly for subsequent author replacement.
- Responsive interactive playback: continuous silent 5 fps autoplay loops by default, while honoring `prefers-reduced-motion: reduce` by starting paused and snapping camera transitions without motion.

## Brand Commitments

- Beihang University (BUAA) institutional affiliation and screen VI color identity (`#005BAC` Beihang Blue, `#003DA6` Hover Blue, `#009BDE` Sky Focus, `#EAF3FC` Soft Tint).
- Dual-modality thermal data encoding distinguishing static scene structure (`#6EC8BD`) from dynamic motion regions (`#FF9E57`).

## Evidence on Hand

- `assets/scene17.mp4` and `assets/scene17.jpg`: 20-frame preprocessed thermal input sequence at 5 fps (`518×350`, `Dynamic_LTR` `scene17`).
- `assets/scene17-cloud.js`: 20-frame base64-encoded Int16 3D point cloud dataset with static structure and dynamic motion flags.
- `assets/compare/{reference,physir,tapip3d,rife}/`: 12 verified interpolated evaluation frames (`00001`, `00002`, `00003`, `00004`, `00006`, `00007`, `00008`, `00009`, `00011`, `00012`, `00013`, `00014`).
- `assets/mask-start.*`, `assets/mask-middle.*`, `assets/mask-end.*`: three synchronized motion-mask sequence videos covering frames `00–06`, `07–13`, and `14–19`.
- Confirmed absences (must never be fabricated): final paper title, confirmed author list, arXiv/PDF URL, public code URL, final method architecture figure asset, `Ours` rendered comparison frames, and quantitative metric values (`PSNR`, `SSIM`, `LPIPS`, etc. remain `—`).

## Product Principles

- **Scientific honesty over cosmetic completeness**: Never fabricate metrics, never mislabel baselines as `Ours`, and label approximate previews and placeholders explicitly.
- **Direct artifact inspection first**: Put live thermal sequences, 3D point clouds, and qualitative frame comparators immediately in reach without modal interruptions.
- **Zero-dependency portability**: Bundle fonts, icons, scripts, and data locally with relative paths so static hosting and offline `file://` inspection both work cleanly.
- **Accessible precision**: Support keyboard navigation, pointer/touch scrubbing, legible typography, high contrast across light and dark viewports, and `prefers-reduced-motion`.

## Accessibility & Inclusion

- Meet WCAG 2.1 AA contrast (`>= 4.5:1` text and controls, `>= 3:1` large text and focus indicators) across both light paper surfaces and dark optical viewports.
- Full keyboard accessibility for 3D orbit/zoom/reset (`Arrow` keys, `+/-`, `Home`, `R`, `0`), timeline seek sliders, split-wipe curtain slider, and tab/filter controls.
- Non-color cues (text labels, pressed states, geometry/motion indicators) accompany color differentiation everywhere.
