# Botanical field studio

The studio now follows the supplied botanical design reference: a floating stone and lotus specimen, white field, fine grid and annotation lines, compact square tools, and monospaced specimen panels. Compose remains an editable SVG workspace; the opening specimen disappears when a motif or drawn mark is added. Carve presents the relief on a faceted stone support. Print retains the interactive worktable.

The Change reality control switches between daylight and a dark green botanical view. It preserves the composition and stores the view preference locally. Responsive layouts retain access to the motif library and primary actions.

## Validation

- TypeScript check and production build pass.
- Existing browser journey passes: motif click and drag/drop, freehand drawing, carve, edit, ink, stamp, undo/redo, and desktop/mobile WebGL.
- Layouts checked at 1440×900, 390×844, 375×667 and 844×390.
- Theme switching preserves artwork; the preference survives reload. Both themes visually inspected.

## Generated asset

Mode: built-in image generation. Output: `src/assets/botanical-specimen.png` (embedded in the standalone build). Original: `C:/Users/user/.codex/generated_images/01a0a48b-74c3-7241-a75b-66b7e78cc67b/exec-55e378e6-52fc-4669-a87f-f8e461ce8baf.png`.

Prompt:

> Use case: stylized-concept. Create a single premium photorealistic 3D botanical specimen cutout for the opening view of an interactive block-printing design studio. A floating irregular dark basalt rock island, wide angular rough fractured underside and soft cushion of green moss on top. One graceful orange-red lotus-like flower on a slender stem rises above it, with 3 sparse tufts of fine grasses and a few natural small leaves. Two small clear optical-glass rectangular prisms intersect the front-right rock edge, with subtle white refraction. Sophisticated experimental art direction, natural materials meeting precision laboratory objects. View from slightly above at three-quarter angle, full object centered with generous transparent margin, square composition. Beautiful soft directional daylight from upper left, realistic fine moss/stone texture, understated colors and deep dimensional crevices. Actual transparent background with alpha; no floor, no environment, no cast ground shadow outside the object, no text, no labels, no interface, no logos, no watermark. Render a crisp 1024 square asset. This is a website asset, not a screenshot or UI mockup.
