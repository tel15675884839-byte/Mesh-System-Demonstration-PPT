# 10-Year Battery Page Design & Specification

## 1. Understanding Summary
- **Goal:** Build the "10-Year Battery" feature landing page.
- **Purpose:** Highlight low maintenance/no maintenance advantage over 10 years to show technical superiority.
- **Target Audience:** Tech decision makers viewing the Mesh presentation.
- **Key Constraints:** Use DOM layered faux-3D animation using GSAP ScrollTrigger. Desktop-focused (mobile strategies are discarded).
- **Non-Goals:** Real WebGL/3D engine implementation. Backend data integrations.

## 2. Assumptions
- **Tech Stack:** Vanilla JS + CSS3 + GSAP Core + ScrollTrigger plugin (via CDN).
- **Platform:** Only optimizing for Desktop aspect ratios and smooth scrolling.
- **Visual Assets:** Temporary high-tech CSS shapes/containers will be used as placeholders until real PNG/SVGs of battery layers are available.

## 3. Decision Log
- **Decision 1: Visual Metaphor**
  - *Chosen:* Internal Structure Cutaway / Exploded View.
  - *Alternatives Considered:* Timeline charts, Mesh dashboard view.
  - *Reasoning:* Best emphasizes physical hardware quality and engineering excellence.
- **Decision 2: Interaction Pattern**
  - *Chosen:* Scroll-driven Timeline (GSAP ScrollTrigger).
  - *Alternatives Considered:* Hover-to-expand hotspots, Auto-looping video.
  - *Reasoning:* Provides the premium scrolling experience, granting user direct control over the storytelling pace.
- **Decision 3: Technical Implementation strategy**
  - *Chosen:* Layered DOM Exploded View.
  - *Alternatives Considered:* Rendered Image Sequence, SVG path animation.
  - *Reasoning:* Lower maintenance cost; layers can easily be swapped by updating CSS/`<img>` without re-rendering videos.
- **Decision 4: Mobile Responsiveness**
  - *Chosen:* Discard mobile optimization.
  - *Alternatives Considered:* Graceful degrade to simple cards on mobile.
  - *Reasoning:* Client instruction. Focus 100% on a premium desktop presentation.

## 4. Final Design Architecture
- **Stage Container:** `height: 400vh` scrollable section.
- **Pinned Scene:** A central `<div class="battery-stage">` that sticks to viewport while scrolling within the section.
- **3-Layer Separation Sequence:**
  1. `layer-exterior` (Housing): `translateY` upwards.
  2. `layer-cells` (Core): Stays central, light scale emphasis.
  3. `layer-chipset` (Board): `translateY` downwards.
- **Callout Cards:** Floating information cards that fade in synced with GSAP timeline checkpoints (e.g., at 20%, 50%, 80% of scroll progress) pointing to each respective layer.
