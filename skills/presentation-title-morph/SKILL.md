---
name: presentation-title-morph
description: Use when a presentation-style page needs one oversized centered cover title to become the anchored top-left title after click or reveal. Apply when the heading must stay the same visual element across states, without fade-swap, duplicate-title takeover, or secondary header motion.
---

# Presentation Title Morph

## Overview
Use one real title element to animate from cover state to revealed state.

Do not fake this with "title A fades out, title B fades in". The audience should read it as the same heading shrinking and moving into place.

## Core Rule
The animated title moves.

The target anchor does not move.

If the top-left header also has its own reveal `translateY` or slide-in animation, the title will appear to land and then move again. Remove that extra motion.

## When To Use
- Full-screen presentation pages with an intro / cover state
- Keynote-style slides where a centered chapter title should become a smaller top-left title
- Feature pages that reveal a main stage after click
- Cases where you want continuity between cover title and revealed title

## Animation Pattern
Keep one animated title element in the DOM and animate it with `top`, `left`, and `transform: translate(-50%, -50%) scale(...)`.

Initial state:

```css
top: 50%;
left: 50%;
transform: translate(-50%, -50%) scale(1);
```

Target state:

```css
top: 15%;
left: 15%;
transform: translate(-50%, -50%) scale(0.3);
```

Recommended transition:

```css
transition: top 0.6s cubic-bezier(0.25, 1, 0.5, 1),
            left 0.6s cubic-bezier(0.25, 1, 0.5, 1),
            transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
```

## Implementation Rules
1. Keep `translate(-50%, -50%)` in both states so the title stays center-aligned to its own position while scaling.
2. Animate only the title element from cover position to final anchored position.
3. Make the top-left title anchor visually static. It may reserve layout space, but it must not run a second position animation.
4. If you keep a non-animated heading in the final layout for semantic structure, make it invisible and non-interactive so it acts only as the measurement / layout anchor.
5. Do not add opacity fades unless the user explicitly asks for them.
6. Do not let another title "take over" after the moving title arrives.

## Layout Guidance
- Measure or derive the final top-left title center from the real revealed header position.
- The moving title should land directly on that final center point.
- The reveal stage below the title may animate separately, but the title anchor itself should stay fixed.
- Reset back to the centered cover state when the slide is re-entered, if the page uses presentation-style chapter entrances.

## Acceptance Checklist
- Before click: the title is centered and oversized.
- During reveal: the same title visibly moves toward the top-left while shrinking.
- After reveal: the title lands directly on the final top-left position.
- There is no fade-swap between two visible titles.
- There is no secondary upward nudge after landing.
- Leaving the slide and returning resets the title to the centered cover state when required by the page pattern.

## Common Mistakes
- Animating the header container and the title at the same time
- Fading out the centered title and fading in a second top-left title
- Changing scale without preserving `translate(-50%, -50%)`
- Hard-coding a target position that does not match the final header anchor
- Adding springy easing that makes the title overshoot when the page wants a clean keynote feel
