# Presentation UI Layout Rules

This file defines the default layout rules for every presentation slide in this repository.

## Brand Bar

- Keep the top-left brand area to a single line: `Wireless Mesh Fire Alarm System`.
- Do not restore `Presentation Framework`.
- Keep the brand block compact so the slide canvas stays dominant.

## Outer Slide Shell

- Do not restore frame meta.
- Do not add index bubbles, `Independent Page File`, or duplicate slide titles above the iframe stage.
- Treat the full frame shell as the content viewport so the slide stage gets the extra height.

## Page Header Inside Slides

- Do not add page eyebrow labels inside `.page-copy`.
- Remove labels such as `Feature Overview`, `Core Advantage`, or similar helper text above the main title.
- Keep the title block compact and high.
- Let the main stage, card grid, or animation area use the reclaimed vertical space.

## Shared Spacing Direction

- Slides should feel top-aligned rather than vertically centered.
- Prefer tighter top spacing and larger stage height over decorative header copy.
- New pages should inherit the shared `page-base.css` structure before adding page-specific tweaks.

## For New Slides

When adding a new slide:

1. Start with a `.page` and `.page-grid` layout that follows `page-base.css`.
2. Add only the main title in `.page-copy`.
3. Put the majority of the page height into the primary visual stage.
4. If extra context is needed, place it inside the stage or a secondary panel, not above the title as an eyebrow label.
