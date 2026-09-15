# An interactive introduction to block printing

The site now opens on an introductory page, followed by the existing Compose → Carve → Print studio. A real Three.js wooden printing block with an extruded paisley relief sits at the center. Cursor movement tilts it; dragging turns it to reveal its handle. Clicking it, the adjacent entry link, or pressing Enter on the focused block opens Compose. Arrow keys turn the focused block. Returning via the brand link preserves the composition.

Four circles explain the block, colour, repeat and people behind the craft. Hover, focus or tap reveals an original SVG explanatory illustration, short educational text and a source link. Cards have a close control and Escape dismissal. A sources dialog provides further reading. The illustrations are conceptual, not representations of archival objects. The studio is a simplified digital introduction, not a simulation of every regional textile process.

The landing scene initializes independently and disposes its graphics resources on entry into the studio. The workshop is created on first entry. Reduced-motion preferences disable idle/cursor motion while retaining deliberate rotation and navigation. Light and dark themes, mobile tap interactions and narrow landscape layouts are supported. A vector block fallback remains clickable when WebGL creation fails.

## Research and editorial decisions

Research reviewed 15 September 2026. No claims about a single origin date are made: sources distinguish early textile evidence, surviving fragments and documented block printing, and some dates conflict. The text emphasizes the process and living regional distinctions.

- [D’source, IDC IIT Bombay — Pethapur block making](https://www.dsource.in/resource/pethapur-block-making/making-process): preparation of seasoned wood; tracing, drilling and chiselling; raised motif, handle, and repeat points. Supports the block and repeat cards.
- [V&A — Resist block printing](https://www.vam.ac.uk/blog/fabric-of-india/location-scout-part-ii-resist-block-printing): direct printing, resist paste, indigo dyeing, sets of aligned blocks and washing. Supports the colour card. Avoids implying that all block printing uses the same dye or sequence.
- [Impart / Museum of Art & Photography — Block Printing](https://imp-art.org/articles/block-printing/): localized traditions, block makers and printing communities, regional processes and varied motifs. Supports the people card.
- [Government Museum Chennai — Printing methods](https://govtmuseumchennai.org/museum-section/textile-block-gallery/block-printing-method): distinctions between direct, resist and mordant printing; further reading in the sources dialog.
- [Craft Revival Trust — Past-Continuous](https://artsandculture.google.com/story/past-continuous-block-printing-on-textiles-in-india-craft-revival-trust/IwVxwKAHCAcA8A): cross-check of regional diversity, techniques, craft communities and block-making precision.

## Validation

- TypeScript and production build pass.
- Browser interaction check: all four discoveries, dialog and Escape, drag without accidental navigation, clickable block entry, preserved composition when returning from the introduction.
- Existing full journey: add and drag motifs, freehand, carve, edit, ink, print, undo/redo, and desktop/mobile WebGL.
- Responsive visual checks at 1440×900, 390×844, 375×667 and 844×390, including cards.
- Keyboard and reduced-motion checks; both light and dark themes visually inspected.
