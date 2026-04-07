# Extended Distance Page Design Spec

- Date: 2026-04-07
- Owner: Codex + User
- Scope: `pages/distance.html`, `css/pages/distance.css`, `js/distance-page.js`
- Status: Approved for planning

## 1. Goal
Build the `Extended Distance` page as a cinematic, manually controlled showcase with two animation scenes:

1. Open-area communication distance up to 500m.
2. Node-to-node relay communication up to 16km.

The page must keep visual consistency with the current feature pages while emphasizing spatial depth and relay behavior.

## 2. Confirmed Product Decisions

1. Interaction is manual switch (not auto-loop and not scroll trigger).
2. Second scene copy is shown as `Up to 16 km` only (no formula on screen).
3. Layout stays as single-stage design with scene switching, not dual stacked cards.
4. Visual direction is `Cinematic`.

## 3. Information Architecture

### 3.1 Left Content Column
- Eyebrow: `Core Advantage`
- Title: `Extended Distance`
- Lead copy: concise distance-value statement
- Two key bullets/lines:
  - `Open-area link up to 500 m`
  - `Node-to-node relay up to 16 km`
- Manual switch control:
  - `Open Area 500m`
  - `Mesh Relay 16km`
- Optional status panel that updates per active scene.

### 3.2 Right Visual Stage (Single Shared Stage)
One visual stage reused for both modes. Scene content changes on switch.

- Active-mode badge in corner (`OPEN AREA` / `MESH RELAY`).
- Cinematic background with depth cues (grid ground, haze, distant glow).
- Distance overlays and animated signal representations per scene.

## 4. Animation Design

### 4.1 Scene A: Open Area 500m
Purpose: communicate single-hop long range in open environment.

Timeline target: ~4.5s loop while scene is active.

1. `0.0s-1.2s`: camera gently pushes forward; ruler/marker grows from 0 to 500.
2. `1.2s-2.8s`: signal pulse travels from Node A to Node B on one direct path.
3. `2.8s-3.8s`: `500m` highlight intensifies briefly to confirm peak range.
4. `3.8s-4.5s`: lighting returns to idle state and prepares next cycle.

Visual anchors:
- Two endpoint nodes.
- One dominant path.
- Clear distance ruler emphasis.

### 4.2 Scene B: Mesh Relay 16km
Purpose: communicate multi-hop extension through relay nodes.

Timeline target: ~5.5s loop while scene is active.

1. `0.0s-1.5s`: camera pulls back/up to reveal longer chain.
2. `1.5s-3.8s`: pulse moves hop-by-hop across multiple nodes; each node flashes on receipt.
3. `3.8s-4.8s`: terminal node lights up; `Up to 16 km` gets emphasis.
4. `4.8s-5.5s`: brightness settles; chain remains visible in standby.

Visual anchors:
- Multiple relay nodes.
- Step relay cadence instead of one-line speed effect.
- Endpoint arrival moment with final distance statement.

## 5. Interaction and State

### 5.1 Manual Scene Switching
- Clicking a control updates active scene immediately.
- Control has active style and `aria-pressed` state.
- Keyboard focus and Enter/Space trigger are supported by native button semantics.

### 5.2 Transition Between Scenes
- Transition style: crossfade + slight camera shift.
- Outgoing scene fade: ~220ms.
- Incoming scene fade and settle: ~380ms.
- Target: smooth switch without abrupt visual cut.

### 5.3 Playback Rules
- No auto scene switching.
- Active scene loops internally.
- Hidden tab handling pauses/reduces timers where appropriate.

## 6. Responsive and Accessibility

### 6.1 Responsive Behavior
- Desktop: two-column layout (copy + stage).
- Mobile/tablet: stacked layout (copy above stage).
- Stage height target on narrow viewports: about `360-420px`.
- Reduce node count and glow density on small screens for clarity/perf.

### 6.2 Motion Preferences
- Respect `prefers-reduced-motion: reduce`.
- Replace continuous pulse travel with mostly static scene and subtle opacity changes.
- Keep state readability even with reduced animation.

## 7. Technical Implementation Boundaries

1. Use lightweight HTML/CSS/vanilla JS only.
2. No heavy rendering libraries.
3. Keep code isolated to distance page files:
   - `pages/distance.html`
   - `css/pages/distance.css`
   - `js/distance-page.js` (new)
4. Reuse existing project conventions from feature pages (class naming, data-stage pattern, status panel style).

## 8. Error Handling and Robustness

1. JS should no-op safely if expected DOM nodes are absent.
2. Scene switch logic should validate target scene key before applying.
3. Timers must be cleared/restarted on visibility changes to avoid duplicate loops.
4. Reduced-motion listeners should degrade cleanly across browser event APIs.

## 9. Verification Plan

1. Functional:
   - Switch buttons update scene and active styles.
   - Scene A shows clear 500m narrative.
   - Scene B shows clear relay narrative and 16km outcome.
2. Visual:
   - Transition appears smooth and readable.
   - No overlapping labels or clipping at common widths.
3. Accessibility:
   - Buttons focusable and screen-readable.
   - Reduced-motion mode retains meaning.
4. Regression:
   - Other pages are unaffected.
   - `page-messaging.js` behavior remains intact.

## 10. Out of Scope

1. Real GIS/site map integration.
2. Data-driven node count based on backend config.
3. 3D engine camera systems.
4. Auto-play narrative timeline across multiple feature pages.

## 11. Open Assumptions

1. This page uses English UI copy consistent with existing feature pages.
2. The 16km statement is presented as a product-level claim text only.
3. Visual style should align with current dark technical aesthetic.
