# Block printing studio — material and layout update

Applied on 15 September 2026 to `work/printmakers-table`.

## Design

- Warm ivory and stone surfaces, olive controls, and large editorial serif headings.
- A desktop ornament sidebar with raised specimen tiles; a horizontal ornament tray on mobile.
- A central, paper-toned composition canvas with dot guides, a compact floating toolbar, and an empty-state invitation.
- A procedural concrete worktable and a cylindrical concrete pedestal for the 3D carved block. The printing blocks retain their wood materials.
- Floating print, inspection, and camera controls; the Compose → Carve → Print workflow remains intact.

Visual references:

- [Palmer Dinnerware](https://mobbin.com/explore/sections/fc9350ab-c91b-40c0-aa6d-3f05444217cd): tactile objects, soft shadows, sparse controls.
- [Metalab](https://mobbin.com/explore/sections/720da9bb-4c7f-43e0-b609-620d78d2666d): editorial typography and sculptural material presentation.
- [Adaline](https://mobbin.com/explore/sections/4e09d146-d3ca-4dc5-b4b3-727545614224): quiet tones and a clear staged process.

## Files

`src/atelier.css` contains the new visual layer. Small updates to `main.tsx` and `DesignDialog.tsx` provide the new headings, ornament presentation, and canvas invitation. `materials.ts` and `workshop.ts` implement the concrete surface and inspection pedestal.

The existing source changes were retained. The previous versions of the four edited source files were backed up in `C:/Users/user/Documents/ChatGPT/yoga proj/.block-printing-ui/originals`.

## Validation

- TypeScript check and production build passed.
- Existing journey test passed after updating the button label to “Carve this block”: composition, drag/drop, freehand, responsive fit, carving, editing, inking, stamping, undo/redo, and desktop/mobile WebGL.
- Browser visual checks completed at 1440×900, 390×844, 375×667, and 844×390.
- Screenshots from the journey check are in `qa/atelier`.

The build refreshed `dist` and `outputs/saree-block-print/index.html`. This update has not been deployed to a hosted website.
