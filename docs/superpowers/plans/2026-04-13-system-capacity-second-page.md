# System Capacity Second Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a second System Capacity scene that presents the `2 Loop Expansion Card` as an infographic flow from one panel to four vertical loops, each ending in a clustered `32 Nodes` group.

**Architecture:** Keep the existing `pages/capacity.html` route and evolve the current single-stage experience into a two-scene sequence managed by `js/capacity-page.js`. Reuse the current stage shell, then swap scene-specific DOM, CSS state classes, and click-driven animation steps so scene one remains the network overview and scene two becomes the expansion-card infographic.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node `node:test` assertions

---

### Task 1: Lock the second-scene contract in tests

**Files:**
- Modify: `D:\Users\30741\Desktop\Mesh html\tests\system-capacity-page.test.js`
- Test: `D:\Users\30741\Desktop\Mesh html\tests\system-capacity-page.test.js`

- [ ] **Step 1: Add failing assertions for the second-scene shell**

Add assertions that require:
- `data-capacity-scene="network-level"` to still exist on first render
- a second-scene container or scene marker for the `2 Loop Expansion Card`
- loop cluster markup hooks such as `capacity-expansion`, `capacity-loop-track`, `capacity-node-cluster`, and `32 Nodes`
- JavaScript constants or scene config for four loops and thirty-two nodes per loop

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `node --test tests/system-capacity-page.test.js`
Expected: FAIL because the second-scene markup and script hooks do not exist yet.

- [ ] **Step 3: Keep the first-scene assertions intact**

Retain existing checks for the current `Network Level` scene so the feature ships as an additive two-page flow instead of a replacement.

- [ ] **Step 4: Re-run the focused test after the test edits**

Run: `node --test tests/system-capacity-page.test.js`
Expected: FAIL with missing second-scene selectors or script values, while the file still parses cleanly.

### Task 2: Add second-scene structure and styling

**Files:**
- Modify: `D:\Users\30741\Desktop\Mesh html\pages\capacity.html`
- Modify: `D:\Users\30741\Desktop\Mesh html\css\pages\capacity.css`
- Test: `D:\Users\30741\Desktop\Mesh html\tests\system-capacity-page.test.js`

- [ ] **Step 1: Add scene-two markup hooks**

Add DOM containers for:
- the centered expansion-card infographic layer
- one left-side panel anchor
- one dashed connector region
- the `loop expansion card.svg` image anchor
- four vertical loop rows
- one node cluster per row
- one `32 Nodes` label per row

- [ ] **Step 2: Style the infographic layout**

Implement CSS that:
- keeps the existing first-scene layout untouched
- introduces second-scene classes like `is-scene-expansion`
- places the panel on the left, the card in the center, and four vertical loop rows on the right
- renders each node group as an orderly stacked cluster instead of 32 literal icons

- [ ] **Step 3: Make the layout responsive within the presentation frame**

Ensure the second scene still reads left-to-right on the desktop presentation canvas and compresses spacing instead of collapsing into visual noise on narrower widths.

- [ ] **Step 4: Re-run the focused test**

Run: `node --test tests/system-capacity-page.test.js`
Expected: FAIL only on JavaScript behavior or scene sequencing assertions that are still missing.

### Task 3: Implement second-scene sequencing and animation

**Files:**
- Modify: `D:\Users\30741\Desktop\Mesh html\js\capacity-page.js`
- Test: `D:\Users\30741\Desktop\Mesh html\tests\system-capacity-page.test.js`

- [ ] **Step 1: Add scene configuration for the infographic**

Introduce constants for:
- `expansionLoopCount = 4`
- `nodesPerExpansionLoop = 32`
- animation timing for panel entrance, dashed-line growth, card reveal, loop reveal, cluster reveal, and label reveal

- [ ] **Step 2: Implement second-scene DOM population**

Build helpers that create the four loop rows and their clustered node groups from script so the page stays consistent with the configured counts.

- [ ] **Step 3: Implement click-driven second-scene progression**

Extend the stage controller so the user can:
- enter scene one
- finish scene one
- advance into the second scene
- play the one-time infographic animation
- replay from the beginning after the second scene completes

- [ ] **Step 4: Update hint and accessibility copy**

Keep `capacity-stage-status` and `capacity-stage-hint` aligned with each scene so the presentation still has meaningful assistive text.

- [ ] **Step 5: Re-run the focused test**

Run: `node --test tests/system-capacity-page.test.js`
Expected: PASS for `tests/system-capacity-page.test.js`

### Task 4: Run regression checks for the presentation shell

**Files:**
- Modify: `D:\Users\30741\Desktop\Mesh html\js\capacity-page.js` if needed for fixes
- Modify: `D:\Users\30741\Desktop\Mesh html\css\pages\capacity.css` if needed for fixes
- Test: `D:\Users\30741\Desktop\Mesh html\tests\system-capacity-page.test.js`
- Test: `D:\Users\30741\Desktop\Mesh html\tests\presentation-layout-rules.test.js`
- Test: `D:\Users\30741\Desktop\Mesh html\tests\fixed-stage-shell.test.js`

- [ ] **Step 1: Run the capacity and shell regression tests**

Run: `node --test tests/system-capacity-page.test.js tests/presentation-layout-rules.test.js tests/fixed-stage-shell.test.js`
Expected: PASS with zero failures.

- [ ] **Step 2: Fix any integration regressions**

If a shell/layout test fails, adjust only the capacity page classes or stage-shell hooks needed to restore compatibility.

- [ ] **Step 3: Re-run the same regression command**

Run: `node --test tests/system-capacity-page.test.js tests/presentation-layout-rules.test.js tests/fixed-stage-shell.test.js`
Expected: PASS with zero failures.
