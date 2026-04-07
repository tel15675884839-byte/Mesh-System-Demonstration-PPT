# Rapid Response Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Rapid Response page with an animation-first Performance Pipeline narrative showing fast and stable signal delivery.

**Architecture:** Keep the page modular with three page-scoped files: structure in `pages/response.html`, visuals in `css/pages/response.css`, and behavior in `js/response-page.js`. Drive a looping 3-stage animation state machine (`accumulation -> optimization -> delivery`) and sync timeline/visual states via DOM `data-stage` attributes.

**Tech Stack:** HTML5, CSS3 (custom properties + keyframes), vanilla JavaScript (no dependencies), existing iframe presentation shell.

---

## File Map

- Modify: `pages/response.html`
  - Replace placeholder scaffold with production-ready layout sections for copy, timeline, animation stage, and outcome chips.
- Modify: `css/pages/response.css`
  - Replace placeholder styles with full page-specific visuals and responsive behavior.
- Create: `js/response-page.js`
  - Add stage-loop animation controller, reduced-motion handling, and fallback-safe DOM updates.

### Task 1: Build Rapid Response Page Structure

**Files:**
- Modify: `pages/response.html`

- [ ] **Step 1: Write a failing structure check command**

Run:
```powershell
Select-String -Path 'pages/response.html' -Pattern 'response-stage|response-timeline|response-outcomes'
```
Expected: no matches before implementation.

- [ ] **Step 2: Replace placeholder markup with final semantic layout**

Update `pages/response.html` to include:
- left column: eyebrow/title/lead + 3-stage timeline list
- right column: animated route stage with detector/node/panel markers and pulse layer
- bottom row: three outcome chips
- script includes: `../js/page-messaging.js` + `../js/response-page.js`

- [ ] **Step 3: Re-run structure check command**

Run:
```powershell
Select-String -Path 'pages/response.html' -Pattern 'response-stage|response-timeline|response-outcomes'
```
Expected: matches found for all three sections.

### Task 2: Implement Visual System and Responsive Layout

**Files:**
- Modify: `css/pages/response.css`

- [ ] **Step 1: Write a failing style check command**

Run:
```powershell
Select-String -Path 'css/pages/response.css' -Pattern 'response-layout|response-stage|response-chip'
```
Expected: no production selectors for these components in current placeholder file.

- [ ] **Step 2: Implement page-specific CSS**

Add styles for:
- 40/60 layout split and vertical alignment
- timeline cards and active-state highlight
- route line, pulse animation, and node markers
- stage-driven visual deltas using `[data-stage="..."]`
- outcome chips with subtle glow/breathing
- reduced motion + mobile single-column fallback

- [ ] **Step 3: Re-run style check command**

Run:
```powershell
Select-String -Path 'css/pages/response.css' -Pattern 'response-layout|response-stage|response-chip'
```
Expected: selectors present.

### Task 3: Implement Stage Loop Controller

**Files:**
- Create: `js/response-page.js`

- [ ] **Step 1: Write a failing script existence check**

Run:
```powershell
Test-Path 'js/response-page.js'
```
Expected: `False` before creation.

- [ ] **Step 2: Add minimal stage controller implementation**

Implement script behaviors:
- stage list: `accumulation`, `optimization`, `delivery`
- interval loop that updates `data-stage` on page root
- sync active timeline item using `aria-current`
- update status text per stage
- disable loop or reduce motion when `prefers-reduced-motion: reduce`

- [ ] **Step 3: Verify script parses cleanly**

Run:
```powershell
node --check 'js/response-page.js'
```
Expected: no syntax errors.

### Task 4: Integration Verification

**Files:**
- Verify: `pages/response.html`
- Verify: `css/pages/response.css`
- Verify: `js/response-page.js`

- [ ] **Step 1: Verify page is wired in iframe source**

Run:
```powershell
Select-String -Path 'index.html' -Pattern 'pages/response.html'
```
Expected: Rapid Response iframe source found.

- [ ] **Step 2: Verify no missing local script references**

Run:
```powershell
Select-String -Path 'pages/response.html' -Pattern 'response-page.js|page-messaging.js'
```
Expected: both script tags present.

- [ ] **Step 3: Visual smoke verification**

Run:
```powershell
Get-Content -Raw 'pages/response.html'
```
Expected: timeline keywords and outcome chips exactly:
- `R&D Accumulation`
- `Algorithm Optimization`
- `Rapid + Stable Delivery`
- `Fast Transmission`
- `Stable Routing`
- `Reliable Delivery`

- [ ] **Step 4: Commit implementation**

```bash
git add pages/response.html css/pages/response.css js/response-page.js
git commit -m "feat: implement rapid response performance pipeline page"
```

## Self-Review

### Spec Coverage

- Objective and narrative: covered by Task 1 + Task 3 content structure and stage loop.
- Animation-first behavior: covered by Task 2 and Task 3.
- No explicit latency numbers: enforced in Task 4 content check.
- Rapid vs High Reliability boundary: preserved by copy scope in Task 1.
- Reduced-motion and fallback resilience: covered in Task 2 + Task 3.
- Responsiveness: covered in Task 2.

### Placeholder Scan

No `TBD`, `TODO`, or deferred implementation placeholders remain in tasks.

### Type/Name Consistency

- Stage keys are consistently named: `accumulation`, `optimization`, `delivery`.
- Timeline and chip labels match approved spec wording.

## Execution Mode

User requested immediate execution; proceed with **Inline Execution** in this session.
