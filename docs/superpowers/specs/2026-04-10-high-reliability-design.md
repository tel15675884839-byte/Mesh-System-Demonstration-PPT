# High Reliability Page Design

- Date: 2026-04-10
- Project: Wireless Mesh Fire Alarm System HTML Presentation
- Target page: `pages/reliability.html`
- Design status: Approved in brainstorming

## 1. Objective

Redesign the **High Reliability** page so the main stage becomes a vertically stacked comparison between:

- `ONE-WAY COMMUNICATION`
- `TWO-WAY COMMUNICATION`

The page should explain the reliability mechanism visually, not through dense copy. The new structure must preserve the existing cinematic presentation style while making the difference between one-way and two-way communication immediately legible.

## 2. Confirmed Constraints

- The current single stage must be split into **two always-visible sub-stages** inside the same main visual card.
- The top sub-stage is dedicated to `ONE-WAY COMMUNICATION`.
- The bottom sub-stage is dedicated to `TWO-WAY COMMUNICATION`.
- Each sub-stage keeps **only a short label**. No explanatory sentence is added.
- The old scene-toggle control pattern is removed from this page.
- Because each sub-stage is shorter than the previous full-height stage, all device positions, spacing, alignment, label placement, and icon sizes must be reworked instead of reused.
- For line semantics:
  - `wired` = solid line
  - `wireless` = dashed line with particle animation
- Wired segments must not use particle animation.

## 3. Selected Direction

Chosen approach: **one large stage card with two vertically stacked internal stages**

Why this option:

- Best preserves the current single-page presentation rhythm.
- Makes one-way vs two-way comparison visible at the same time, with no interaction required.
- Keeps the page visually cohesive instead of turning it into two unrelated mini-cards.

## 4. Information Architecture

Primary layout:

1. Header area
- Eyebrow: `Core Advantage`
- Title: `High Reliability`

2. Main visual card
- One large `visual-card`
- Internally split into two equal-height sub-stages
- Light divider between the sub-stages

3. Top sub-stage
- Label only: `ONE-WAY COMMUNICATION`

4. Bottom sub-stage
- Label only: `TWO-WAY COMMUNICATION`

## 5. Stage Composition

## 5.1 Shared Stage Framing

Purpose: keep the page visually unified even though the original stage is split.

Structure:

- Outer shell remains one large visual card.
- Inside the shell, use two independent stage regions with consistent internal padding.
- Add a subtle divider line or separator glow between the two regions.
- Keep the same dark technical atmosphere, soft grid treatment, and restrained glow language already used on the page.

Layout rules:

- Both sub-stages use equal visual weight.
- Both sub-stages reserve a top-left safe zone for the short label.
- Device clusters must stay away from the stage edges to avoid a cramped look after height compression.

## 5.2 Top Stage: One-Way Communication

Purpose: show a simple single-direction communication structure in a flatter, presentation-friendly composition.

Required layout:

- Keep the reading direction left to right.
- Place the devices in a horizontally widened composition suitable for a short stage:
  - detector near the upper-left region
  - sounder near the lower-left region
  - node in the mid-left region
  - leader node in the mid-right region
  - panel on the far right, vertically centered relative to the network flow

Communication rules:

- Preserve one-way expression.
- Wireless segments remain dashed and animated with particles.
- Any wired segment remains solid and static.
- Wired segments must not emit particles.

Visual sizing:

- Reduce panel size from the current full-stage scale.
- Keep leader node slightly larger than the standard node.
- Reduce detector and sounder sizes further so they read as peripheral devices.

## 5.3 Bottom Stage: Two-Way Communication

Purpose: show the higher-reliability network structure with explicit two-way wireless routing and limited wired fallback.

Required layout:

- panel in the upper-right region
- leader node in the right-center to lower-right region
- standard node in the center-left region
- upper detector connected to the left-side node
- lower detector connected to the right-side leader node

Connection rules:

- The only wired segment in this sub-stage is:
  - `leader node -> panel`
- This wired segment is a solid line and remains static.
- Every other segment in this sub-stage is wireless.
- Every wireless segment in this sub-stage must be drawn as **two parallel dashed lines**.
- The extra wireless line should sit close to the original path rather than becoming a wide dual-lane graphic.
- Wireless segments keep particle animation.
- Wired segments do not use particles.

Narrative effect:

- The layout should make the communication path read as:
  - devices connect into the network
  - the two main nodes maintain a dual wireless path
  - the leader node reaches the panel through a short wired link

## 5.4 Labels, Alignment, and White Space

Purpose: make the new flatter stages feel intentional instead of compressed leftovers from the old layout.

Rules:

- Place each stage label in the upper-left of its own sub-stage.
- Keep labels clear of device icons and connection lines.
- Use consistent left/right padding across both sub-stages.
- Keep the panel side from feeling visually heavier than the device side.
- Reserve breathing room under the labels and around the panel silhouettes.
- Avoid edge collisions from icons, line endpoints, or animated particles.

## 6. Visual Language and Line Semantics

Line system:

- Wired:
  - solid stroke
  - no particle animation
  - used sparingly, especially in the bottom stage where only one wired segment is allowed
- Wireless:
  - dashed stroke
  - particle animation enabled
  - in the bottom stage, all wireless links use paired parallel lines

Motion intent:

- One-way stage should feel simpler and more singular.
- Two-way stage should feel denser and more redundant, but still clean and readable.
- Particle motion must reinforce the route logic instead of turning the stage into noise.

## 7. Component and State Changes

HTML expectations:

- Replace the single scene-switching stage structure with a stacked two-stage structure.
- Remove the old toggle buttons from the reliability page markup.
- Provide separate containers for:
  - top-stage devices and lines
  - bottom-stage devices and lines

CSS expectations:

- Add shared stacked-stage layout rules.
- Add per-stage label positioning.
- Add size tiers tuned for compressed stage height.
- Add line styles for:
  - wired single solid
  - wireless dashed
  - two-way wireless double-dashed

JavaScript expectations:

- Remove scene toggling logic for this page.
- Initialize both stages on load.
- Render independent device sets and link sets for the top and bottom stages.
- Preserve line-break/alarm interaction only where it still applies to the two-way reliability narrative.
- Ensure the two-way stage supports dual wireless path rendering without affecting wired segments.

## 8. Error Handling and Resilience

1. Static fallback
- If animation logic fails, both sub-stages should still show readable static topology.

2. Resize resilience
- Connection recalculation must respond cleanly to viewport changes because the page now depends on tighter vertical spacing.

3. Animation restraint
- Particle effects must remain bounded inside each sub-stage and must not bleed across the divider.

## 9. Responsiveness and Accessibility

Desktop-first intent:

- Optimize for presentation/slide viewing inside the existing iframe system.

Responsive behavior:

- Keep the split structure on desktop and typical presentation widths.
- On narrower screens, allow increased stage minimum height so device overlap does not occur.
- Labels must remain readable and never collide with the stage content.

Accessibility:

- Preserve semantic heading structure.
- Stage labels should remain plain text, not decorative-only graphics.
- Decorative particles and connection overlays should stay hidden from assistive technology.

## 10. Testing Strategy

1. Structure checks
- Confirm the reliability page no longer uses scene-toggle markup.
- Confirm the page contains two distinct reliability sub-stages.

2. Layout checks
- Confirm both sub-stages render inside the same main visual card.
- Confirm labels are present for top and bottom stages.
- Confirm the split layout remains readable at presentation and compact widths.

3. Visual behavior checks
- Confirm the top stage reads as one-way.
- Confirm the bottom stage shows:
  - one wired leader-to-panel segment
  - all remaining segments as dual wireless links
- Confirm wired segments do not spawn particles.
- Confirm wireless segments still animate with particles.

4. Interaction checks
- If the bottom-stage fault interaction remains, confirm it affects only the intended two-way links and alarm state.

## 11. Scope Boundaries

In scope:

- High Reliability page structural redesign
- Two stacked sub-stages inside the existing page card
- Reworked icon scale, positions, label placement, white space, and connection styling
- Dual wireless rendering for the two-way stage

Out of scope:

- Redesigning unrelated feature pages
- Adding explanatory copy beyond the short stage labels
- Reworking the page header or overall site navigation

## 12. Implementation Notes

- Follow the existing project pattern of page-specific HTML, CSS, and JS.
- Keep the visual style consistent with the current technical dark-stage language.
- Prefer explicit per-stage configuration objects instead of trying to reuse the old single-stage coordinates.
- Treat the bottom-stage topology as a separate composition, not as a small variant of the top-stage arrangement.
