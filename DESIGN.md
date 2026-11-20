---
name: Infrared Dynamic 3D Scene Reconstruction
description: CVPR/ICCV/SIGGRAPH academic editorial research page pairing cool paper reading surfaces with dark optical viewports and Beihang Blue visual identity.
colors:
  beihang-blue: "#005BAC"
  beihang-hover: "#003DA6"
  sky-focus: "#009BDE"
  beihang-soft: "#EAF3FC"
  paper-canvas: "#F7F9FC"
  paper-surface: "#FFFFFF"
  paper-subtle: "#EEF4FA"
  ink-primary: "#17263B"
  ink-secondary: "#4B5B70"
  border-hairline: "#D9E4F2"
  border-strong: "#BCCCE0"
  optical-viewport: "#0D1720"
  optical-hud: "#101E28"
  optical-hud-hover: "#1B3040"
  optical-border: "#2D4254"
  optical-border-hover: "#496780"
  optical-ink: "#E1EDEF"
  structure-teal: "#6EC8BD"
  thermal-orange: "#FF9E57"
  notice-amber: "#8A4A1D"
  notice-bg: "#FEF5EE"
  notice-border: "#E8CBB4"
  error-crimson: "#943627"
  error-bg: "#FDF2F0"
  error-border: "#E5B9B2"
  ours-border: "#9EC3E8"
typography:
  display:
    fontFamily: '"Source Serif 4", Georgia, "Times New Roman", serif'
    fontSize: "clamp(1.75rem, 3vw, 2.35rem)"
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "-0.02em"
  headline:
    fontFamily: '"Source Serif 4", Georgia, "Times New Roman", serif'
    fontSize: "clamp(1.375rem, 2.2vw, 1.75rem)"
    fontWeight: 600
    lineHeight: 1.24
    letterSpacing: "-0.015em"
  title:
    fontFamily: '"IBM Plex Sans", system-ui, -apple-system, sans-serif'
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0em"
  body:
    fontFamily: '"IBM Plex Sans", system-ui, -apple-system, sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "0em"
  label:
    fontFamily: '"IBM Plex Sans", system-ui, -apple-system, sans-serif'
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
  micro:
    fontFamily: '"IBM Plex Sans", system-ui, -apple-system, sans-serif'
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0em"
  mono:
    fontFamily: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0em"
rounded:
  sm: "5px"
  md: "8px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  2xl: "56px"
components:
  button-primary:
    backgroundColor: "{colors.beihang-blue}"
    textColor: "{colors.paper-surface}"
    rounded: "{rounded.sm}"
    padding: "10px 18px"
  button-primary-hover:
    backgroundColor: "{colors.beihang-hover}"
  button-secondary:
    backgroundColor: "{colors.paper-surface}"
    textColor: "{colors.beihang-blue}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  transport-bar:
    backgroundColor: "{colors.paper-surface}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  hud-pill:
    backgroundColor: "{colors.optical-hud}"
    textColor: "{colors.optical-ink}"
    rounded: "{rounded.sm}"
    padding: "6px 10px"
---

# Design System: Infrared Dynamic 3D Scene Reconstruction

## Overview

**Creative North Star: "The Optical Monograph"**

This design system treats an academic computer-vision project page like a modern conference monograph paired with a calibrated optical bench. Reading sections—title block, abstract, method rationale, quantitative benchmarks, and BibTeX—live on cool, unhurried paper surfaces anchored by deep slate ink and disciplined Beihang Blue accents. Interactive scientific artifacts—infrared video sequences, real-time 3D point clouds, 2D frame-interpolation comparators, and dynamic motion masks—sit inside crisp dark optical viewports that prevent brightness washout and preserve thermal signal contrast.

The system explicitly rejects decorative marketing templates, neon cyberpunk glows, gradient headline fills, rounded cards with left-edge accent bars, and tiny uppercase kickers above headings. Authority comes from restrained typographic contrast, consistent horizontal alignment along one unified container grid, and crisp 1px borders.

**Key Characteristics:**
- **Dual-ground optical contrast:** Cool paper (`#F7F9FC`, `#FFFFFF`, `#EEF4FA`) for scholarly reading paired with dark optical chambers (`#0D1720`, `#101E28`) for video and 3D inspection.
- **Institutional Beihang Blue discipline:** `#005BAC` reserved for interactive action, active selection, progress indicators, and primary links; never scattered as passive ornament.
- **Self-hosted tri-voice typography:** Roman `Source Serif 4` for paper and section headings, `IBM Plex Sans` for prose and UI controls, and `IBM Plex Mono` strictly for frame readouts, metrics, dataset identifiers, and BibTeX code.
- **Zero-slop structural rhythm:** Every section shares the same left-aligned `1120px` editorial grid with more vertical breathing room above headings than below them.

## Colors

A crisp scientific palette balancing cool paper neutrals, authoritative Beihang Blue interactive anchors, and calibrated dark optical viewports with teal-versus-thermal-orange signal encoding.

### Primary
- **Beihang Blue** (`#005BAC`): Primary interactive action fill (`Interactive Demo`, transport `Play/Pause`, active segmented tabs, slider progress track), active anchor links, and focus outline on light surfaces.
- **Beihang Hover Blue** (`#003DA6`): Pressed and hover state for primary interactive controls and link hover contrast on `#EAF3FC` soft surfaces.
- **Sky Focus Blue** (`#009BDE`): High-visibility keyboard focus indicator (`:focus-visible`) inside `#0D1720` / `#101E28` dark optical viewports and split-wipe divider highlight.
- **Beihang Soft Tint** (`#EAF3FC`): Subtle surface wash for dataset metadata badges, `Ours (Pending)` benchmark table row highlight, active secondary button hover, and selected text background.

### Neutral
- **Cool Paper Canvas** (`#F7F9FC`): Primary page background across the document body, providing calm low-glare reading without warm cream clichés.
- **Crisp Paper Surface** (`#FFFFFF`): Elevated container surface for transport bars, bordered TL;DR box, method figure card, BibTeX code block, and secondary action pills.
- **Subtle Tinted Paper** (`#EEF4FA`): Recessed band surface for the top draft utility bar, table header fill, and subtle container differentiation on light paper.
- **Deep Slate Ink** (`#17263B`): Primary prose, section headings, table values, and high-contrast label ink (`> 13:1` against `#F7F9FC`).
- **Muted Slate Ink** (`#4B5B70`): Secondary captions, affiliations, figure metadata, table footnotes, and inactive helper prose (`>= 5.8:1` on light paper).
- **Hairline Border** (`#D9E4F2`): Crisp 1px structural dividers, section rules, card borders, and booktabs inner rule.
- **Strong Rule** (`#BCCCE0`): Top and bottom booktabs table rules (`2px`) and hover border escalation on interactive light pills.
- **Dark Optical Viewport** (`#0D1720`): Background for all video frames, 2D qualitative comparators, mask viewers, and the 3D WebGL/2D Canvas point-cloud stage.
- **Optical HUD Surface** (`#101E28`): Opaque dark overlay pill background for 3D camera presets and layer filter toggles so text contrast never shifts over bright moving points.
- **Optical HUD Border** (`#2D4254`): Crisp 1px hairline border separating HUD controls and grid strokes from `#0D1720`.
- **Optical Viewport Ink** (`#E1EDEF`): Primary text and canvas fallback color inside `#0D1720` / `#101E28` dark viewports (`> 14:1` contrast).

### Semantic & Signal
- **Structure Teal** (`#6EC8BD`): Static background geometry points in the 3D point cloud and the `Static Structure` filter legend indicator.
- **Thermal Orange** (`#FF9E57`): Dynamic moving-region points in the 3D point cloud, `Dynamic Motion` filter indicator, and active thermal motion mask annotation legend.
- **Notice Amber** (`#8A4A1D`): Non-alarm draft notice ink (`Approximate Geometry Preview`, `Figure Placeholder`, `Coming Soon` status badges) ensuring `>= 6.8:1` AA contrast on light paper.
- **Error Crimson** (`#943627`): Inline playback or asset loading error message color on light surfaces (`>= 6.8:1` contrast).

### Named Rules
**The Optical Isolation Rule.** Never place translucent frosted overlays over bright 3D point-cloud regions where point density alters text contrast; HUD pills on `#0D1720` use opaque `#101E28` backgrounds with explicit `#2D4254` borders and `#E1EDEF` text.
**The Restrained Accent Rule.** Beihang Blue (`#005BAC`) marks interactive affordances and the pending `Ours` benchmark/comparison slot only—never decorative stripes, halos, or multi-paragraph text blocks.

## Typography

**Display Font:** `"Source Serif 4", Georgia, "Times New Roman", serif` (self-hosted WOFF2 weights 400, 600, 700, roman style)
**Body Font:** `"IBM Plex Sans", system-ui, -apple-system, sans-serif` (self-hosted WOFF2 weights 400, 500, 600, 700)
**Label/Mono Font:** `"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` (self-hosted WOFF2 weights 400, 500)

**Character:** Roman `Source Serif 4` conveys peer-reviewed conference gravitas for the paper title and section headings, while `IBM Plex Sans` delivers crisp technical clarity for abstracts and controls, and `IBM Plex Mono` keeps frame counters, table cells, and BibTeX strictly tabular.

### Hierarchy
- **Display** (`700`, `clamp(1.75rem, 3vw, 2.35rem)`, `1.18` line-height, `-0.02em` tracking): Paper title `<h1>` only; sized below `25vh` so title, metadata, actions, and primary media fit cleanly near the opening viewport.
- **Headline** (`600`, `clamp(1.375rem, 2.2vw, 1.75rem)`, `1.24` line-height, `-0.015em` tracking): Top-level section `<h2>` headings (`Dynamic Point Cloud`, `Abstract`, `Method Overview`, `2D Qualitative Comparison`, `Quantitative Results`, `Dynamic Motion Masks`, `BibTeX`).
- **Title** (`600`, `1.0625rem`, `1.35` line-height): Sub-figure headers, stage column headings in Method Overview, and comparison figure titles.
- **Body** (`400`, `1rem`, `1.65` line-height): Abstract prose, TL;DR, method stage descriptions, section summaries, and table rows; prose measure constrained to `60–72ch` with `text-wrap: pretty`.
- **Label** (`500`, `0.8125rem`, `1.4` line-height): Dataset badges, figure notes, table headers, table footnotes, timeline segment nodes, and helper hints.
- **Micro** (`500`, `0.75rem`, `1.3` line-height): Compact HUD controls, method role badges, split-wipe labels, `Coming Soon` status pills, and superscript affiliation indices (`>= 12px` minimum floor everywhere; zero sub-12px text).
- **Mono** (`500`, `0.875rem`, `1.5` line-height, `font-variant-numeric: tabular-nums`): Primary/secondary action labels, transport frame readouts, metric placeholders, BibTeX code, and navigation links.

### Named Rules
**The Roman Serif Rule.** Set `Source Serif 4` strictly upright (`font-style: normal`) with supported fetched weights (`400`, `600`, `700`); never use oversized italic serif display titles or un-fetched fractional font weights under `font-synthesis: none`.
**The 12px Floor Rule.** Every visible string across desktop and mobile viewports—including micro-legends, figure notes, table footnotes, and SVG diagram labels—renders at `>= 12px` (`0.75rem`) with `>= 4.5:1` contrast.

## Layout

Unified single-grid editorial column: `width: min(100% - 48px, 1120px)` centered with `margin-inline: auto` across **every** section—top utility strip, hero header, reconstruction, abstract, method overview, 2D qualitative comparison, quantitative results, motion masks, BibTeX, and footer. No section collapses to an arbitrary narrow `780px` centered sub-column; internal reading rhythm uses deliberate two-column splits (e.g., Abstract heading + keyword chips on left `~30%`, `65ch` prose on right `~70%`) anchored to the same `1120px` left edge.

- **Vertical cadence:** `padding-top: 40px` and `margin-top: 48px` per major section on desktop (`32px` / `36px` on mobile), ensuring space above each `<h2>` (`40px+`) clearly exceeds space below it (`16px`–`20px`).
- **Responsive breakpoints:**
  - `<= 900px`: Abstract split stacks cleanly; 3-stage Method grid wraps or stacks; comparison panes adapt cleanly.
  - `<= 640px`: Shell margin narrows to `min(100% - 32px, 1120px)`; 2-up hero viewer stacks 1-column; 2D comparison Side-by-Side stacks or adapts cleanly without squeezing thumbnails below legible inspection width; touch targets expand to `>= 44px` height on transport buttons, segmented pills, and range thumbs.

## Elevation & Depth

Flat-by-default structural clarity using stepped cool paper tones (`#F7F9FC` canvas, `#EEF4FA` header strip/table header, `#FFFFFF` elevated interactive cards) and crisp `1px solid #D9E4F2` borders. Dark optical viewports (`#0D1720`) provide recessed optical depth without blurred drop shadows or colored halos.

### Shadow Vocabulary
- **Control Lift (hover/drag only):** `box-shadow: 0 4px 12px rgba(23, 38, 59, 0.08)` used sparingly on active range slider thumbs and the live Split-Wipe drag handle.
- **No resting card shadows or glows:** Zero-offset colored glows (`dark-glow`) and radial spotlights (`radial-halo`) are prohibited.

## Shapes

Restrained technical geometry combining crisp `8px` outer viewport/container corners (`--radius-md`) with `5px` inner control corners (`--radius-sm`) and pill/circular interactive slider thumbs (`9999px`). All bordered callouts (such as the hero TL;DR summary box and Method Overview figure frame) use a complete `1px solid` border all the way around rather than heavy one-sided left accent bars (`side-tab`).

## Components

Every interactive component shares consistent focus rings (`2px solid #005BAC` on light, `2px solid #009BDE` on dark, `outline-offset: 3px`), `>= 44px` coarse/touch targets on mobile, and clean inline SVG iconography.

### Buttons
- **Shape:** `5px` (`--radius-sm`) border radius, `min-height: 40px` (`44px` on `pointer: coarse`), `10px 18px` padding.
- **Primary (`Interactive Demo`, `Play/Pause`):** `#005BAC` fill, `#FFFFFF` text, transitions to `#003DA6` on hover.
- **Secondary (`BibTeX`, `Copy BibTeX`, `Step ◀/▶`):** `#FFFFFF` fill, `1px solid #D9E4F2`, `#005BAC` or `#17263B` text, transitions to `#EAF3FC` fill and `#005BAC` border on hover.
- **Coming Soon (`Paper`, `Code`):** `#EEF4FA` fill, `1px dashed #BCCCE0` border, `#4B5B70` text with `Coming Soon` badge chip so unlinked resources read transparently as pending rather than broken anchors.

### Segmented Pill Tabs & Layer Toggles
- **Light Segmented Control (2D Baseline & View Mode):** `#EEF4FA` recessed track (`1px solid #D9E4F2`, `6px` radius, `3px` padding) containing `#FFFFFF` active pill (`#005BAC` text, `font-weight: 600`) vs `#4B5B70` inactive options.
- **Dark Optical HUD Toggles (`Default`, `Top`, `Front`, `Reset`, and `All` / `Static Structure` / `Dynamic Motion`):** `#101E28` opaque fill, `1px solid #2D4254`, `#E1EDEF` text; active `aria-pressed="true"` pill adopts `#005BAC` fill with `#FFFFFF` text and `#009BDE` border.

### Transport Bar
- **Container:** `#FFFFFF` surface, `1px solid #D9E4F2`, `8px` radius, `8px 14px` padding; houses `Play/Pause` SVG button, `Prev/Next` frame step buttons, custom-styled range slider with live `--progress` gradient fill (`#005BAC` elapsed over `#D9E4F2` track), and `IBM Plex Mono` `tabular-nums` frame counter (`00 / 19`).

### Split-Wipe 2D Comparator
- **Structure:** Dual-pane aligned 518:350 stage displaying `Left` vs `Right` selected methods (`Reference: Ground Truth`, active `DGGT` baseline, `PhysIR (Default TI)`, and CSS/comment slot for future `Ours`) clipped cleanly with `clip-path: inset(...)` over synchronized decoded frames.
- **Divider & Handle:** `2px` crisp `#005BAC` vertical curtain line topped/centered with an accessible circular `38px` drag handle (`role="slider"`, `aria-valuemin="0"`, `aria-valuemax="100"`, pointer + touch + keyboard `ArrowLeft`/`ArrowRight`) with left/right arrow SVG glyph and subtle `#009BDE` focus ring.

### Booktabs Quantitative Table
- **Rules:** `2px solid #17263B` top rule, `1px solid #17263B` mid-rule beneath column headers, `2px solid #17263B` bottom rule; `#EEF4FA` subtle header tint; `#EAF3FC` tinted row reserved exclusively for `Ours (Pending)` with `—` metric placeholders and `>= 12px` explanatory footnote below.

### Connected Motion-Mask Timeline Strip
- **Structure:** Unified horizontal container framing three `518:350` mask videos (`Seg 01 · 00–06` → `Seg 02 · 07–13` → `Seg 03 · 14–19`) beneath a connected Beihang Blue/hairline top timeline rail with segment nodes and thermal-orange `#FF9E57` active-motion legend, driven by one shared 3-video transport bar.

### Ready `Ours` Comparison Slot (`.is-ours`)
- **Contract:** Dedicated `.is-ours` modifier class (`1px solid #005BAC` header accent tag, `#EAF3FC` soft pill badge `Ours`) paired with an explicit `<!-- REPLACE: ... -->` HTML slot in Section 4 so future author renders drop into the grid without layout refactoring.

## Do's and Don'ts

### Do:
- **Do** align every section—including Hero, Abstract, Method, Comparison, Table, Masks, and BibTeX—to the unified `1120px` left-aligned shell grid.
- **Do** keep every text element, SVG diagram label, table footnote, and dark HUD legend at `>= 12px` (`0.75rem`) with verified `>= 4.5:1` contrast.
- **Do** mark `Ground Truth` as `Reference`, `DGGT + TAPIP3D` / `DGGT + RIFE` / `PhysIR (Default TI)` as `Baseline`, and `Ours (Pending)` with `—` cells until true numbers are measured.
- **Do** honor `prefers-reduced-motion: reduce` by pausing loops at initialization and snapping camera presets without animation, while keeping silent 5 fps autoplay active under standard motion preference.
- **Do** theme browser surfaces (`::selection`, custom range slider tracks/thumbs, custom scrollbars, `:focus-visible`, `tabular-nums`) from the palette tokens.

### Don't:
- **Don't** place eyebrow pills or uppercase tracked kickers above `<h1>` or `<h2>` (`kicker-above-heading`, `hero-eyebrow-chip`), or numeric index prefixes (`01`, `02`, `03`) beside section headings (`numbered-section-labels`).
- **Don't** use one-sided heavy left accent borders on rounded containers (`side-tab`, `border-accent-on-rounded`) or nest cards inside cards.
- **Don't** apply radial spotlight gradients (`radial-halo`), colored box-shadow glows on dark surfaces (`dark-glow`), or italic oversized serif headlines (`italic-serif-display`, `oversized-h1`).
- **Don't** modify, crop, move, or re-encode `assets/scene17.*`, `assets/mask-*.*`, `assets/compare/*`, `assets/scene17-cloud.js`, or `tools/prepare_assets.py`.
- **Don't** use Unicode emojis or glyphs (`↺`, `↑`, `◀`) as the icon system where crisp inline SVGs belong, and never introduce un-self-hosted CDN links or `fetch()` calls that break `file://` previewing.
