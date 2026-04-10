# Welcome Page Brand Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the welcome screen so the title feels more dimensional and the long-form brand logo appears in the top-left without overpowering the hero title.

**Architecture:** Keep the existing welcome page flow and animation intact. Limit the change to the welcome page entry markup, its CSS presentation layer, and a focused regression test that protects the new logo container and title-treatment hooks.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node `node:test`

---

### Task 1: Lock the welcome-page brand hooks with a regression test

**Files:**
- Modify: `tests/welcome-entry.spec.js`

- [ ] **Step 1: Add assertions for the new top-left logo region**
- [ ] **Step 2: Add assertions for the updated title styling hooks**
- [ ] **Step 3: Run the focused welcome-page test and confirm it fails before implementation**

### Task 2: Add the welcome-page brand logo markup

**Files:**
- Modify: `welcome.html`

- [ ] **Step 1: Insert a dedicated top-left brand container above the hero title**
- [ ] **Step 2: Reference `assets/branding/logo-long.png` with descriptive alt text**
- [ ] **Step 3: Preserve the existing iframe and intro flow structure**

### Task 3: Polish the welcome-page visual treatment

**Files:**
- Modify: `css/welcome.css`

- [ ] **Step 1: Add layout rules for the top-left logo block with responsive spacing**
- [ ] **Step 2: Replace the current title treatment with a subtler glass-metal relief effect**
- [ ] **Step 3: Keep the hero title as the dominant focal point across desktop and mobile**

### Task 4: Verify the welcome page

**Files:**
- Modify: `tests/welcome-entry.spec.js`
- Review: `welcome.html`
- Review: `css/welcome.css`

- [ ] **Step 1: Re-run the focused welcome-page regression test**
- [ ] **Step 2: Review the diff to confirm only welcome-page assets and docs changed**
