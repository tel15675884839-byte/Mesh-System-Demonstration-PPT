(function () {
  const stage = document.getElementById("editor-stage");
  const stageContent = document.getElementById("editor-stage-content");
  const snapLayer = document.getElementById("editor-snap-layer");
  const selectionName = document.getElementById("selection-name");
  const inspectorForm = document.getElementById("inspector-form");
  const saveStatus = document.getElementById("save-status");
  const generatedHtml = document.getElementById("generated-html");
  const generatedCss = document.getElementById("generated-css");

  if (!stage || !stageContent || !snapLayer || !selectionName || !inspectorForm) {
    return;
  }

  const ICONS = {
    panel: "assets/icons/panel.svg",
    panelStatic: "../assets/icons/panel.svg",
    loopCard: "assets/icons/loop expansion card.svg",
    loopCardStatic: "../assets/icons/loop expansion card.svg",
    node: "assets/icons/node.svg",
    nodeStatic: "../assets/icons/node.svg",
    smoke: "assets/icons/smoke.svg",
    smokeStatic: "../assets/icons/smoke.svg",
    sounder: "assets/icons/sounder.svg",
    sounderStatic: "../assets/icons/sounder.svg",
    mcp: "assets/icons/mcp.svg",
    mcpStatic: "../assets/icons/mcp.svg"
  };

  const STATIC_CAPACITY_CSS = `.page-capacity-static {
  justify-content: flex-start;
  padding-block: 18px;
  background: transparent;
}

.capacity-static-layout {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 14px;
  width: 100%;
  max-width: 1280px;
  height: calc(100vh - 36px);
  min-height: 0;
  margin: 0 auto;
}

.capacity-static-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  min-width: 0;
}

.capacity-hero {
  max-width: none;
}

.capacity-hero-spotlight h2 {
  max-width: none;
  margin: 0;
  font-size: clamp(3.8rem, 5.3vw, 4.9rem);
  line-height: 0.96;
  letter-spacing: -0.055em;
  white-space: nowrap;
}

.capacity-static-summary {
  max-width: 420px;
  padding-block-end: 10px;
  color: rgba(226, 238, 249, 0.68);
  font-size: 0.95rem;
  line-height: 1.45;
  text-align: right;
}

.capacity-static-stage {
  position: relative;
  min-height: 0;
  overflow: hidden;
  border-radius: 24px;
  background:
    linear-gradient(90deg, rgba(15, 235, 198, 0.08) 1px, transparent 1px),
    linear-gradient(180deg, rgba(15, 235, 198, 0.07) 1px, transparent 1px),
    radial-gradient(circle at 28% 45%, rgba(15, 235, 198, 0.12), transparent 32%),
    radial-gradient(circle at 78% 42%, rgba(92, 230, 255, 0.1), transparent 30%),
    rgba(4, 10, 18, 0.2);
  background-size: 72px 72px, 72px 72px, auto, auto, auto;
  box-shadow: inset 0 0 0 1px rgba(137, 244, 255, 0.1);
}

.capacity-static-axis {
  position: absolute;
  z-index: 0;
  display: block;
  pointer-events: none;
  opacity: 0.32;
}

.capacity-static-axis-x {
  left: 0;
  top: 50%;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(137, 244, 255, 0.7), transparent);
}

.capacity-static-axis-y {
  left: 50%;
  top: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(180deg, transparent, rgba(137, 244, 255, 0.7), transparent);
}

.capacity-static-object {
  position: absolute;
  z-index: var(--z, 2);
  left: calc(var(--x) * 1%);
  top: calc(var(--y) * 1%);
  width: calc(var(--w) * 1%);
  transform: translate(-50%, -50%) scale(var(--scale, 1));
  display: grid;
  justify-items: center;
  gap: 8px;
  color: #f4fbff;
  text-align: center;
}

.capacity-static-object img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
}

.capacity-object-panel {
  filter: drop-shadow(0 18px 34px rgba(0, 0, 0, 0.42));
}

.capacity-object-loop-card {
  width: calc(var(--w) * 1%);
  padding: 4px;
  filter: drop-shadow(0 14px 28px rgba(0, 0, 0, 0.38));
}

.capacity-object-node {
  filter: drop-shadow(0 0 18px rgba(15, 235, 198, 0.22));
}

.capacity-object-label {
  display: inline-grid;
  place-items: center;
  min-height: 22px;
  padding: 3px 10px;
  border: 1px solid rgba(137, 244, 255, 0.18);
  border-radius: 999px;
  background: rgba(3, 12, 20, 0.76);
  color: rgba(238, 250, 255, 0.82);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.capacity-object-nodes-group,
.capacity-object-devices-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: calc(var(--w) * 1%);
  min-width: 90px;
  background: transparent;
  backdrop-filter: none;
  box-shadow: none;
  border: none;
}

.capacity-group-pile {
  position: relative;
  width: 90px;
  height: 80px;
}

.capacity-group-pile img {
  position: absolute;
  width: 28px !important;
  height: auto;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4));
}

/* Pile Variant 1: Dense Cluster */
.pile-v1 img:nth-child(1) { left: 0; top: 15px; transform: rotate(-15deg); opacity: 0.5; }
.pile-v1 img:nth-child(2) { left: 45px; top: 10px; transform: rotate(15deg); opacity: 0.5; }
.pile-v1 img:nth-child(3) { left: 20px; top: 35px; transform: rotate(-5deg); opacity: 0.7; }
.pile-v1 img:nth-child(4) { left: 55px; top: 25px; transform: rotate(10deg); opacity: 0.7; }
.pile-v1 img:nth-child(5) { left: 15px; top: 5px; z-index: 5; }
.pile-v1 img:nth-child(6) { left: 40px; top: 40px; z-index: 6; }

/* Pile Variant 2: Two Columns */
.pile-v2 img:nth-child(1) { left: 15px; top: 0; opacity: 0.4; }
.pile-v2 img:nth-child(2) { left: 45px; top: 0; opacity: 0.4; }
.pile-v2 img:nth-child(3) { left: 15px; top: 15px; opacity: 0.7; }
.pile-v2 img:nth-child(4) { left: 45px; top: 15px; opacity: 0.7; }
.pile-v2 img:nth-child(5) { left: 15px; top: 30px; z-index: 5; }
.pile-v2 img:nth-child(6) { left: 45px; top: 30px; z-index: 5; }

/* Pile Variant 3: Wide Fan */
.pile-v3 img:nth-child(1) { left: 0; top: 25px; transform: rotate(-30deg); }
.pile-v3 img:nth-child(2) { left: 60px; top: 25px; transform: rotate(30deg); }
.pile-v3 img:nth-child(3) { left: 15px; top: 12px; transform: rotate(-15deg); }
.pile-v3 img:nth-child(4) { left: 45px; top: 12px; transform: rotate(15deg); }
.pile-v3 img:nth-child(5) { left: 30px; top: 0; z-index: 5; }
.pile-v3 img:nth-child(6) { left: 30px; top: 30px; z-index: 6; }

/* Pile Variant 4: Double Pyramid */
.pile-v4 img:nth-child(1) { left: 5px; top: 40px; }
.pile-v4 img:nth-child(2) { left: 30px; top: 40px; }
.pile-v4 img:nth-child(3) { left: 55px; top: 40px; }
.pile-v4 img:nth-child(4) { left: 18px; top: 20px; }
.pile-v4 img:nth-child(5) { left: 42px; top: 20px; }
.pile-v4 img:nth-child(6) { left: 30px; top: 0; z-index: 5; }

/* Pile Variant 5: Chaos (Scattered) */
.pile-v5 img:nth-child(1) { left: 14px; top: 9px; transform: rotate(-20deg) scale(0.9); }
.pile-v5 img:nth-child(2) { left: 46px; top: 9px; transform: rotate(20deg) scale(0.9); }
.pile-v5 img:nth-child(3) { left: 30px; top: 25px; transform: scale(1.2); }
.pile-v5 img:nth-child(4) { left: 10px; top: 45px; transform: rotate(10deg); }
.pile-v5 img:nth-child(5) { left: 50px; top: 45px; transform: rotate(-10deg); }
.pile-v5 img:nth-child(6) { left: 30px; top: 45px; opacity: 0.5; }

/* Pile Variant 6: Snake Trail */
.pile-v6 img:nth-child(1) { left: 0; top: 0; opacity: 0.3; }
.pile-v6 img:nth-child(2) { left: 12px; top: 10px; opacity: 0.4; }
.pile-v6 img:nth-child(3) { left: 24px; top: 20px; opacity: 0.6; }
.pile-v6 img:nth-child(4) { left: 36px; top: 30px; opacity: 0.8; }
.pile-v6 img:nth-child(5) { left: 48px; top: 40px; }
.pile-v6 img:nth-child(6) { left: 60px; top: 50px; z-index: 5; }

/* Pile Variant 7: Concentric Ripple */
.pile-v7 img:nth-child(1) { left: 30px; top: 25px; transform: scale(1.8); opacity: 0.1; }
.pile-v7 img:nth-child(2) { left: 30px; top: 25px; transform: scale(1.5); opacity: 0.2; }
.pile-v7 img:nth-child(3) { left: 30px; top: 25px; transform: scale(1.2); opacity: 0.4; }
.pile-v7 img:nth-child(4) { left: 30px; top: 25px; transform: scale(0.9); opacity: 0.6; }
.pile-v7 img:nth-child(5) { left: 30px; top: 25px; transform: scale(0.7); opacity: 0.8; }
.pile-v7 img:nth-child(6) { left: 30px; top: 25px; transform: scale(0.5); z-index: 5; }

/* Pile Variant 8: Three Rows */
.pile-v8 img:nth-child(1) { left: 10px; top: 0; }
.pile-v8 img:nth-child(2) { left: 50px; top: 0; }
.pile-v8 img:nth-child(3) { left: 10px; top: 20px; }
.pile-v8 img:nth-child(4) { left: 50px; top: 20px; }
.pile-v8 img:nth-child(5) { left: 10px; top: 40px; }
.pile-v8 img:nth-child(6) { left: 50px; top: 40px; }

/* Pile Variant 9: Zoom perspective */
.pile-v9 img:nth-child(1) { left: 30px; top: 0; transform: scale(0.4); opacity: 0.2; }
.pile-v9 img:nth-child(2) { left: 15px; top: 10px; transform: scale(0.5); opacity: 0.3; }
.pile-v9 img:nth-child(3) { left: 45px; top: 15px; transform: scale(0.6); opacity: 0.5; }
.pile-v9 img:nth-child(4) { left: 10px; top: 30px; transform: scale(0.8); opacity: 0.7; }
.pile-v9 img:nth-child(5) { left: 50px; top: 35px; transform: scale(0.9); opacity: 0.9; }
.pile-v9 img:nth-child(6) { left: 30px; top: 40px; transform: scale(1.1); z-index: 5; }

/* Pile Variant 10: Circle */
.pile-v10 img:nth-child(1) { left: 30px; top: 0; }
.pile-v10 img:nth-child(2) { left: 55px; top: 15px; }
.pile-v10 img:nth-child(3) { left: 55px; top: 40px; }
.pile-v10 img:nth-child(4) { left: 30px; top: 55px; }
.pile-v10 img:nth-child(5) { left: 5px; top: 40px; }
.pile-v10 img:nth-child(6) { left: 5px; top: 15px; }

.capacity-group-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
}

.capacity-group-label {
  color: #fff;
  font-family: var(--font-title);
  font-size: 0.78rem;
  font-weight: 700;
}

.capacity-group-badge {
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(15, 235, 198, 0.12);
  color: #aefef0;
  font-family: var(--font-mono);
  font-size: 0.58rem;
  font-weight: 800;
  text-transform: uppercase;
}

.capacity-static-line {
  position: absolute;
  z-index: var(--z, 1);
  left: calc(var(--x) * 1%);
  top: calc(var(--y) * 1%);
  width: calc(var(--length) * 1%);
  height: 0;
  transform: rotate(var(--angle));
  transform-origin: left center;
  border-top: 2px dashed rgba(94, 230, 255, 0.82);
  filter: drop-shadow(0 0 8px rgba(15, 235, 198, 0.22));

  /* Global dash gap logic */
  border-top-style: none !important;
  background-image: linear-gradient(to right, rgba(94, 230, 255, 0.82) 50%, rgba(255, 255, 255, 0) 0%);
  background-position: top;
  background-size: calc(5px + var(--global-dash-gap, 5) * 1px) 2px;
  background-repeat: repeat-x;
  height: 2px;
}

.capacity-static-line-solid {
  border-top: 2px solid rgba(94, 230, 255, 0.82) !important;
  background: none !important;
  height: 0 !important;
}

.capacity-line-muted {
  border-top-color: rgba(233, 248, 255, 0.48);
  filter: none;
}

.capacity-static-text {
  position: absolute;
  z-index: var(--z, 6);
  left: calc(var(--x) * 1%);
  top: calc(var(--y) * 1%);
  width: calc(var(--w, 34) * 1%);
  max-width: 44ch;
  margin: 0;
  transform: translate(-50%, -50%) rotate(var(--angle, 0deg));
  color: var(--text-color, rgba(238, 250, 255, 0.88));
  font-family: var(--font-title);
  font-size: var(--font-size);
  font-weight: 600;
  line-height: 1.08;
  letter-spacing: -0.03em;
  text-align: center;
  text-shadow: 0 0 24px rgba(15, 235, 198, 0.18);
}

.capacity-text-main {
  color: #f7fcff;
}

.capacity-text-total {
  max-width: 820px;
  color: #ffffff;
}

@media (max-width: 960px) {
  .capacity-static-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .capacity-static-summary {
    max-width: none;
    padding-block-end: 0;
    text-align: left;
  }

  .capacity-hero-spotlight h2 {
    font-size: clamp(2.7rem, 10vw, 4rem);
    white-space: normal;
  }

  .capacity-static-object {
    width: calc(var(--w) * 1.28%);
  }

  .capacity-object-cluster {
    min-width: 150px;
    padding: 10px 12px;
  }
}
`;

  const DEFAULT_ITEMS = [
    { id: "panel-1", type: "panel", x: 17.8, y: 49.5, w: 16.5, z: 3, label: "Panel", scale: 100 },
    { id: "card-1", type: "loop-card", x: 39.3, y: 49.5, w: 11.8, z: 4, label: "Loop Card", scale: 100 },
    { id: "nodes-1", type: "nodes-group", x: 65, y: 49.5, w: 20, z: 5, label: "Nodes Group", badge: "32 Nodes", scale: 100 },
    { id: "devices-1", type: "devices-group", x: 88, y: 49.5, w: 20, z: 5, label: "Devices Group", badge: "32 Devices", scale: 100 }
  ];

  let items = DEFAULT_ITEMS.map((item) => Object.assign({}, item));
  let selectedId = items[0] ? items[0].id : null;
  let dragState = null;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function round(value) {
    return Math.round(value * 10) / 10;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function selectedItem() {
    return items.find((item) => item.id === selectedId) || null;
  }

  function nextId(type) {
    const prefix = type.replace(/[^a-z0-9]+/g, "-");
    let index = 1;
    while (items.some((item) => item.id === `${prefix}-${index}`)) {
      index += 1;
    }
    return `${prefix}-${index}`;
  }

  function itemStyle(item) {
    return [
      `--x: ${item.x}`,
      `--y: ${item.y}`,
      `--w: ${item.w}`,
      `--z: ${item.z || 1}`,
      `--rotation: ${item.rotation || 0}deg`,
      `--scale: ${(item.scale || 100) / 100}`,
      `--font-size: ${item.fontSize || 24}px`,
      `--text-color: ${item.textColor || "#eff8ff"}`
    ].join("; ");
  }

  function renderGroupObject(item) {
    const isNodes = item.type === "nodes-group";
    const variant = item.pileVariant || 1;
    let icons = [];
    if (isNodes) {
      icons = Array(3).fill(ICONS.node);
    } else {
      // 6 mixed devices: 3 smoke, 2 sounder, 1 mcp
      icons.push(ICONS.smoke, ICONS.sounder, ICONS.smoke, ICONS.smoke, ICONS.sounder, ICONS.mcp);
    }

    const imgs = icons.map(src => `<img src="${src}" alt="" aria-hidden="true">`).join("");
    return `<div class="editor-group-pile pile-v${variant}">${imgs}</div>`;
  }

  function renderItem(item) {
    const element = document.createElement("div");
    element.className = `editor-object editor-object-${item.type}`;
    element.dataset.id = item.id;
    element.style.cssText = itemStyle(item);
    element.setAttribute("role", "button");
    element.setAttribute("tabindex", "0");

    const renderBraceSVG = (w, h) => {
      // Draw a curly brace bracket {
      // Top curve -> Straight line -> Middle bump -> Straight line -> Bottom curve
      return `
        <svg class="editor-brace-svg" viewBox="0 0 40 100" preserveAspectRatio="none">
          <path d="M 40,0 Q 10,0 10,20 L 10,45 Q 10,50 0,50 Q 10,50 10,55 L 10,80 Q 10,100 40,100" />
        </svg>
      `;
    };

    if (item.id === selectedId) {
      element.classList.add("is-selected");
    }

    if (item.type === "panel") {
      element.innerHTML = `<img src="${ICONS.panel}" alt="" aria-hidden="true">`;
    } else if (item.type === "loop-card") {
      element.innerHTML = `<img src="${ICONS.loopCard}" alt="" aria-hidden="true">`;
    } else if (item.type === "node") {
      element.innerHTML = `<img src="${ICONS.node}" alt="" aria-hidden="true">`;
    } else if (item.type === "nodes-group" || item.type === "devices-group") {
      element.innerHTML = renderGroupObject(item);
    } else if (item.type === "line") {
      element.innerHTML = '';
    } else if (item.type === "brace") {
      element.innerHTML = renderBraceSVG(item.w, item.h);
      element.classList.add("editor-brace-object");
      if (item.h) element.style.setProperty("--h", item.h);
    } else if (item.type === "text") {
      element.innerHTML = escapeHtml(item.text || "Text").replace(/\n/g, "<br>");
    }

    if (item.type === "text") {
      element.classList.add("editor-text-object");
    }

    if (item.type === "line") {
      element.classList.add("editor-line-object");
      if (item.dashGap) {
        element.style.setProperty("--dash-gap", item.dashGap);
      }
      if (item.lineStyle === "solid") {
        element.classList.add("editor-line-solid");
      }
    }

    element.addEventListener("pointerdown", startDrag);
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectItem(item.id);
      }
    });

    return element;
  }

  function render() {
    stageContent.innerHTML = "";
    items
      .slice()
      .sort((a, b) => (a.z || 0) - (b.z || 0))
      .forEach((item) => {
        stageContent.appendChild(renderItem(item));
      });
    syncInspector();
    syncOutput();
    saveToStorage();
  }

  const globalDashGapInput = document.getElementById("global-dash-gap");
  if (globalDashGapInput) {
    globalDashGapInput.addEventListener("input", (e) => {
      stage.style.setProperty("--global-dash-gap", e.target.value);
      syncOutput();
      saveToStorage();
    });
  }

  function saveToStorage() {
    try {
      localStorage.setItem("capacity-editor-items", JSON.stringify(items));
      localStorage.setItem("capacity-editor-global-gap", globalDashGapInput.value);
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }

  function loadFromStorage() {
    try {
      const stored = localStorage.getItem("capacity-editor-items");
      if (stored) {
        items = JSON.parse(stored);
      }
      const storedGap = localStorage.getItem("capacity-editor-global-gap");
      if (storedGap && globalDashGapInput) {
        globalDashGapInput.value = storedGap;
        stage.style.setProperty("--global-dash-gap", storedGap);
      }
    } catch (e) {
      console.error("Failed to load from localStorage", e);
    }
  }

  loadFromStorage();
  render();

  function selectItem(id) {
    selectedId = id;
    render();
  }

  function getStagePoint(event) {
    const rect = stage.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100)
    };
  }

  function getAnchorPoints(item, overrideX, overrideY) {
    const x = overrideX === undefined ? item.x : overrideX;
    const y = overrideY === undefined ? item.y : overrideY;
    const halfW = (item.w || 10) / 2;
    return {
      center: { x, y },
      rightCenter: { x: x + halfW, y },
      leftCenter: { x: x - halfW, y },
      stageCenterX: { x: 50, y },
      stageCenterY: { x, y: 50 }
    };
  }

  function showSnapGuides(guides) {
    snapLayer.innerHTML = "";
    guides.forEach((guide) => {
      const node = document.createElement("span");
      node.className = guide.axis === "x" ? "editor-snap-guide editor-snap-guide-y" : "editor-snap-guide editor-snap-guide-x";
      if (guide.axis === "x") {
        node.style.left = `${guide.value}%`;
      } else {
        node.style.top = `${guide.value}%`;
      }
      snapLayer.appendChild(node);
    });
  }

  function snapToGuides(item, proposedX, proposedY, disableSnap) {
    if (disableSnap) {
      showSnapGuides([]);
      return { x: proposedX, y: proposedY };
    }

    const threshold = 1.1;
    const guides = [];
    const currentAnchors = getAnchorPoints(item, proposedX, proposedY);
    const targets = [
      { axis: "x", value: 50 },
      { axis: "y", value: 50 }
    ];

    items.forEach((other) => {
      if (other.id === item.id) {
        return;
      }
      const anchors = getAnchorPoints(other);
      targets.push({ axis: "x", value: anchors.center.x });
      targets.push({ axis: "y", value: anchors.center.y });
      targets.push({ axis: "x", value: anchors.rightCenter.x });
      targets.push({ axis: "x", value: anchors.leftCenter.x });
    });

    let x = proposedX;
    let y = proposedY;

    targets.forEach((target) => {
      if (target.axis === "x") {
        const candidates = [
          { name: "center", value: currentAnchors.center.x },
          { name: "rightCenter", value: currentAnchors.rightCenter.x },
          { name: "leftCenter", value: currentAnchors.leftCenter.x }
        ];
        const match = candidates.find((candidate) => Math.abs(candidate.value - target.value) <= threshold);
        if (match) {
          x += target.value - match.value;
          guides.push({ axis: "x", value: target.value });
        }
      } else if (Math.abs(currentAnchors.center.y - target.value) <= threshold) {
        y += target.value - currentAnchors.center.y;
        guides.push({ axis: "y", value: target.value });
      }
    });

    showSnapGuides(guides.slice(0, 4));
    return {
      x: clamp(round(x), 0, 100),
      y: clamp(round(y), 0, 100)
    };
  }

  function startDrag(event) {
    const element = event.currentTarget;
    const item = items.find((candidate) => candidate.id === element.dataset.id);
    if (!item) {
      return;
    }

    event.preventDefault();
    selectItem(item.id);
    const point = getStagePoint(event);
    dragState = {
      id: item.id,
      startPointer: point,
      startX: item.x,
      startY: item.y
    };
    element.setPointerCapture(event.pointerId);
  }

  function moveDrag(event) {
    if (!dragState) {
      return;
    }

    const item = items.find((candidate) => candidate.id === dragState.id);
    if (!item) {
      return;
    }

    const point = getStagePoint(event);
    const proposedX = dragState.startX + point.x - dragState.startPointer.x;
    const proposedY = dragState.startY + point.y - dragState.startPointer.y;
    
    // Disable snapping during drag for "follow-me" feel
    const snapped = event.shiftKey ? snapToGuides(item, proposedX, proposedY, false) : { x: proposedX, y: proposedY };

    item.x = clamp(round(snapped.x), 0, 100);
    item.y = clamp(round(snapped.y), 0, 100);
    render();
  }

  function endDrag() {
    dragState = null;
    showSnapGuides([]);
  }

  function syncInspector() {
    const item = selectedItem();
    selectionName.textContent = item ? `${item.type} / ${item.id}` : "No item selected";

    ["x", "y", "w", "h", "z", "fontSize", "rotation", "scale", "pileVariant", "lineStyle", "dashGap", "text", "textColor"].forEach((name) => {
      const input = inspectorForm.elements[name];
      if (!input) {
        return;
      }
      input.disabled = !item;
      if (name === "lineStyle") input.value = item && item[name] !== undefined ? item[name] : "dashed";
      else if (name === "textColor") input.value = item && item[name] !== undefined ? item[name] : "#eff8ff";
      else input.value = item && item[name] !== undefined ? item[name] : "";
    });
  }

  function updateSelectedFromInspector(event) {
    const item = selectedItem();
    if (!item) {
      return;
    }

    const name = event.target.name;
    if (!name) {
      return;
    }

    if (name === "text") {
      item.text = event.target.value;
      item.label = event.target.value;
    } else if (name === "lineStyle") {
      item.lineStyle = event.target.value;
    } else if (name === "textColor") {
      item.textColor = event.target.value;
    } else {
      item[name] = Number(event.target.value) || 0;
      if (name === "x" || name === "y") {
        item[name] = clamp(item[name], 0, 100);
      }
    }

    render();
  }

  function addItem(type) {
    const base = {
      id: nextId(type),
      type,
      x: 50,
      y: 50,
      w: 12,
      z: 5,
      rotation: 0,
      scale: 100,
      h: type === "brace" ? 100 : undefined,
      pileVariant: 1
    };

    if (type === "panel") {
      Object.assign(base, { w: 16, label: "Panel" });
    } else if (type === "loop-card") {
      Object.assign(base, { w: 11, label: "Loop Card" });
    } else if (type === "node") {
      Object.assign(base, { w: 8, label: "Node" });
    } else if (type === "nodes-group") {
      Object.assign(base, { w: 16, label: "Nodes Group", badge: "32 Nodes" });
    } else if (type === "devices-group") {
      Object.assign(base, { w: 16, label: "Devices Group", badge: "32 Devices" });
    } else if (type === "text") {
      Object.assign(base, { w: 26, fontSize: 26, text: "New text" });
    } else if (type === "line") {
      Object.assign(base, { w: 18, z: 1 });
    }

    items.push(base);
    selectItem(base.id);
  }

  function duplicateSelected() {
    const item = selectedItem();
    if (!item) {
      return;
    }
    const copy = Object.assign({}, item, {
      id: nextId(item.type),
      x: clamp(item.x + 3, 0, 100),
      y: clamp(item.y + 3, 0, 100)
    });
    items.push(copy);
    selectItem(copy.id);
  }

  function deleteSelected() {
    const item = selectedItem();
    if (!item) {
      return;
    }
    items = items.filter((candidate) => candidate.id !== item.id);
    selectedId = items[0] ? items[0].id : null;
    render();
  }

  function moveLayer(delta) {
    const item = selectedItem();
    if (!item) {
      return;
    }
    item.z = clamp((item.z || 1) + delta, 0, 30);
    render();
  }

  function staticObjectStyle(item) {
    return `--x: ${round(item.x)}; --y: ${round(item.y)}; --w: ${round(item.w)}; --z: ${item.z || 1}; --scale: ${(item.scale || 100) / 100};`;
  }

  function staticTextStyle(item) {
    return `--x: ${round(item.x)}; --y: ${round(item.y)}; --z: ${item.z || 6}; --font-size: ${item.fontSize || 24}px; --angle: ${item.rotation || 0}deg; --w: ${item.w || 28}; --text-color: ${item.textColor || "#eff8ff"};`;
  }

  function staticLineStyle(item) {
    let style = `--x: ${round(item.x)}; --y: ${round(item.y)}; --length: ${round(item.w)}; --angle: ${item.rotation || 0}deg; --z: ${item.z || 1};`;
    if (item.dashGap) style += ` --dash-gap: ${item.dashGap};`;
    return style;
  }

  function renderStaticItem(item) {
    if (item.type === "panel") {
      return [
        `        <article class="capacity-static-object capacity-object-panel" style="${staticObjectStyle(item)}" aria-label="Fire alarm control panel">`,
        `          <img class="capacity-panel-image" src="${ICONS.panelStatic}" alt="" aria-hidden="true">`,
        "        </article>"
      ].join("\n");
    }

    if (item.type === "loop-card") {
      return [
        `        <article class="capacity-static-object capacity-object-loop-card" style="${staticObjectStyle(item)}" aria-label="Wireless loop card">`,
        `          <img class="capacity-loop-card-image" src="${ICONS.loopCardStatic}" alt="" aria-hidden="true">`,
        "        </article>"
      ].join("\n");
    }

    if (item.type === "node") {
      return [
        `        <article class="capacity-static-object capacity-object-node" style="${staticObjectStyle(item)}" aria-label="Wireless node">`,
        `          <img class="capacity-node-image" src="${ICONS.nodeStatic}" alt="" aria-hidden="true">`,
        "        </article>"
      ].join("\n");
    }

    if (item.type === "nodes-group" || item.type === "devices-group") {
      const isNodes = item.type === "nodes-group";
      const variant = item.pileVariant || 1;
      let icons = [];
      if (isNodes) {
        icons = Array(3).fill(ICONS.nodeStatic);
      } else {
        icons.push(ICONS.smokeStatic, ICONS.sounderStatic, ICONS.smokeStatic, ICONS.smokeStatic, ICONS.sounderStatic, ICONS.mcpStatic);
      }
      
      const imgs = icons.map(src => `            <img src="${src}" alt="" aria-hidden="true">`).join("\n");
      return [
        `        <article class="capacity-static-object capacity-object-${item.type}" style="${staticObjectStyle(item)}" aria-label="Group of items">`,
        `          <div class="capacity-group-pile pile-v${variant}">`,
        imgs,
        "          </div>",
        "        </article>"
      ].join("\n");
    }

    if (item.type === "line") {
      return `        <span class="capacity-static-line capacity-line-dashed" style="${staticLineStyle(item)}" aria-hidden="true"></span>`;
    }

    if (item.type === "brace") {
      return [
        `        <article class="capacity-static-object capacity-static-brace" style="${staticObjectStyle(item)} --h: ${item.h || 100};" aria-hidden="true">`,
        `          <svg class="editor-brace-svg" viewBox="0 0 40 100" preserveAspectRatio="none" style="width:100%; height:100%;">`,
        `            <path d="M 40,0 Q 10,0 10,20 L 10,45 Q 10,50 0,50 Q 10,50 10,55 L 10,80 Q 10,100 40,100" fill="none" stroke="currentColor" stroke-width="2" />`,
        `          </svg>`,
        `        </article>`
      ].join("\n");
    }

    if (item.type === "text") {
      return `        <p class="capacity-static-text" style="${staticTextStyle(item)}">${escapeHtml(item.text || "Text").replace(/\n/g, "<br>")}</p>`;
    }

    return "";
  }

  function generateStaticCapacityHtml() {
    const renderedItems = items
      .slice()
      .sort((a, b) => (a.z || 0) - (b.z || 0))
      .map(renderStaticItem)
      .filter(Boolean)
      .join("\n");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>System Capacity</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/page-base.css">
  <link rel="stylesheet" href="../css/pages/capacity.css">
</head>
<body>
  <main class="page page-capacity" data-capacity-scene="first-page">
    <section class="page-grid capacity-layout">
      <header class="capacity-header">
        <div class="page-copy capacity-hero capacity-hero-spotlight page-hero-spotlight">
          <h2>System Capacity</h2>
        </div>
      </header>

      <div class="visual-card capacity-stage-shell" id="capacity-stage-shell">
        <div class="capacity-stage" id="capacity-stage" aria-label="System Capacity stage">
          <div class="capacity-stage-head">
            <p class="capacity-stage-title" id="capacity-stage-title">Hybrid System Scalability</p>
            <p class="capacity-stage-status" id="capacity-stage-status"></p>
          </div>

          <div class="capacity-stage-surface" id="capacity-stage-surface">
            <section class="capacity-first-scene" id="capacity-first-scene" aria-label="Designed System Capacity page">
              <div class="capacity-static-stage" data-capacity-static-stage>
                <span class="capacity-static-axis capacity-static-axis-x" aria-hidden="true"></span>
                <span class="capacity-static-axis capacity-static-axis-y" aria-hidden="true"></span>
${renderedItems}
              </div>
            </section>

            <section class="capacity-network-scene" id="capacity-network-scene" aria-label="Network capacity page" aria-hidden="true">
              <div class="capacity-network" id="capacity-network"></div>
              <div class="capacity-panels" id="capacity-panels"></div>
              <div class="capacity-total-loops-badge" id="capacity-total-loops-badge" aria-hidden="true">
                up to 16 wireless loops
              </div>
              <div class="capacity-device-overlay" id="capacity-device-overlay" aria-hidden="true"></div>

              <div class="capacity-aggregation" id="capacity-aggregation" aria-live="polite">
                <div class="capacity-aggregation-core"></div>
                <div class="capacity-value-wrapper">
                  <div class="capacity-total-value" id="capacity-total-value">0</div>
                  <span class="capacity-devices-label" id="capacity-devices-label">Devices</span>
                </div>
              </div>
            </section>
          </div>

          <button type="button" class="capacity-stage-hint" id="capacity-stage-hint">Click to continue</button>
        </div>
      </div>
    </section>
  </main>
  <script src="../js/page-messaging.js"></script>
  <script src="../js/capacity-page.js"></script>
</body>
</html>
`;
  }

  function generateStaticCapacityCss() {
    return STATIC_CAPACITY_CSS;
  }

  function syncOutput() {
    if (generatedHtml) {
      generatedHtml.value = generateStaticCapacityHtml();
    }
    if (generatedCss) {
      generatedCss.value = generateStaticCapacityCss();
    }
  }

  async function writeTextFile(fileHandle, content) {
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async function saveToProject() {
    if (!("showSaveFilePicker" in window)) {
      saveStatus.textContent = "This browser does not support saving files directly. Please copy the code manually.";
      syncOutput();
      return;
    }

    const options = {
      suggestedName: "capacity.html",
      types: [{
        description: "HTML File",
        accept: { "text/html": [".html"] }
      }]
    };

    try {
      const handle = await window.showSaveFilePicker(options);
      const writable = await handle.createWritable();
      const content = generateStaticCapacityHtml();
      await writable.write(content);
      await writable.close();
      saveStatus.textContent = "File saved successfully! (Make sure it's in your project's 'pages' folder)";
    } catch (err) {
      if (err.name !== "AbortError") {
        saveStatus.textContent = `Save failed: ${err.message}`;
      }
    }
    syncOutput();
  }

  async function importFromProject() {
    if (!("showDirectoryPicker" in window)) {
      saveStatus.textContent = "This browser cannot read project files.";
      return;
    }

    saveStatus.textContent = "Choose the Mesh html project folder...";
    const directory = await window.showDirectoryPicker();
    const pagesDirectory = await directory.getDirectoryHandle("pages");
    const capacityHtmlHandle = await pagesDirectory.getFileHandle("capacity.html");
    const file = await capacityHtmlHandle.getFile();
    const text = await file.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    const staticStage = doc.querySelector("[data-capacity-static-stage]");

    if (!staticStage) {
      saveStatus.textContent = "Could not find design data in capacity.html";
      return;
    }

    const newItems = [];
    staticStage.querySelectorAll(".capacity-static-object, .capacity-static-line, .capacity-static-text").forEach((el, index) => {
      const style = el.getAttribute("style") || "";
      const getVar = (name) => {
        const match = style.match(new RegExp(`--${name}:\\s*([^;]+)`));
        return match ? match[1].trim() : null;
      };

      const x = parseFloat(getVar("x")) || 0;
      const y = parseFloat(getVar("y")) || 0;
      const w = parseFloat(getVar("w") || getVar("length")) || 0;
      const z = parseInt(getVar("z")) || 0;
      const rotation = parseFloat(getVar("angle")) || 0;
      const scale = parseFloat(getVar("scale")) * 100 || 100;
      const fontSize = parseInt(getVar("font-size")) || 24;

      let type = "text";
      let lineStyle = "dashed";
      if (el.classList.contains("capacity-object-panel")) type = "panel";
      else if (el.classList.contains("capacity-object-loop-card")) type = "loop-card";
      else if (el.classList.contains("capacity-object-node")) type = "node";
      else if (el.classList.contains("capacity-object-nodes-group")) type = "nodes-group";
      else if (el.classList.contains("capacity-object-devices-group")) type = "devices-group";
      else if (el.classList.contains("capacity-static-line")) {
        type = "line";
        if (el.classList.contains("capacity-static-line-solid")) lineStyle = "solid";
      }

      let pileVariant = 1;
      const pileMatch = el.querySelector(".capacity-group-pile")?.className.match(/pile-v(\d+)/);
      if (pileMatch) pileVariant = parseInt(pileMatch[1]);

      const item = {
        id: nextId(type),
        type, x, y, w, z, rotation, scale, fontSize, pileVariant, lineStyle,
        label: el.querySelector(".capacity-object-label, .capacity-group-label")?.textContent || "",
        badge: el.querySelector(".capacity-group-badge")?.textContent || "",
        text: el.textContent.trim()
      };
      
      // Fix IDs so they don't clash during collection
      item.id = `${type}-${index + 1}`;
      newItems.push(item);
    });

    if (newItems.length > 0) {
      items = newItems;
      selectedId = items[0].id;
      render();
      saveStatus.textContent = `Imported ${items.length} items from capacity.html`;
    } else {
      saveStatus.textContent = "No editable items found in the file.";
    }
  }

  async function exportToPng() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const rect = stage.getBoundingClientRect();
    
    // Set higher resolution (2x)
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Filter items to export (objects and lines)
    const exportItems = items.slice().sort((a, b) => (a.z || 0) - (b.z || 0));

    saveStatus.textContent = "Generating transparent PNG...";

    const loadImg = (src) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(img); // Proceed even if missing
      img.src = src;
    });

    const PILE_VARIANTS = {
      1: [
        { left: 0, top: 15, rot: -15, op: 0.5, z: 1, scale: 1 },
        { left: 45, top: 10, rot: 15, op: 0.5, z: 1, scale: 1 },
        { left: 20, top: 35, rot: -5, op: 0.7, z: 2, scale: 1 },
        { left: 55, top: 25, rot: 10, op: 0.7, z: 2, scale: 1 },
        { left: 15, top: 5, rot: 0, op: 1, z: 5, scale: 1 },
        { left: 40, top: 40, rot: 0, op: 1, z: 6, scale: 1 }
      ],
      2: [
        { left: 15, top: 0, rot: 0, op: 0.4, z: 1, scale: 1 },
        { left: 45, top: 0, rot: 0, op: 0.4, z: 1, scale: 1 },
        { left: 15, top: 15, rot: 0, op: 0.7, z: 2, scale: 1 },
        { left: 45, top: 15, rot: 0, op: 0.7, z: 2, scale: 1 },
        { left: 15, top: 30, rot: 0, op: 1, z: 5, scale: 1 },
        { left: 45, top: 30, rot: 0, op: 1, z: 5, scale: 1 }
      ],
      3: [
        { left: 0, top: 25, rot: -30, op: 1, z: 1, scale: 1 },
        { left: 60, top: 25, rot: 30, op: 1, z: 1, scale: 1 },
        { left: 15, top: 12, rot: -15, op: 1, z: 2, scale: 1 },
        { left: 45, top: 12, rot: 15, op: 1, z: 2, scale: 1 },
        { left: 30, top: 0, rot: 0, op: 1, z: 5, scale: 1 },
        { left: 30, top: 30, rot: 0, op: 1, z: 6, scale: 1 }
      ],
      4: [
        { left: 5, top: 40, rot: 0, op: 1, z: 1, scale: 1 },
        { left: 30, top: 40, rot: 0, op: 1, z: 1, scale: 1 },
        { left: 55, top: 40, rot: 0, op: 1, z: 1, scale: 1 },
        { left: 18, top: 20, rot: 0, op: 1, z: 2, scale: 1 },
        { left: 42, top: 20, rot: 0, op: 1, z: 2, scale: 1 },
        { left: 30, top: 0, rot: 0, op: 1, z: 5, scale: 1 }
      ],
      5: [
        { left: 14, top: 9, rot: -20, op: 1, z: 1, scale: 0.9 },
        { left: 46, top: 9, rot: 20, op: 1, z: 1, scale: 0.9 },
        { left: 30, top: 25, rot: 0, op: 1, z: 2, scale: 1.2 },
        { left: 10, top: 45, rot: 10, op: 1, z: 3, scale: 1 },
        { left: 50, top: 45, rot: -10, op: 1, z: 4, scale: 1 },
        { left: 30, top: 45, rot: 0, op: 0.5, z: 5, scale: 1 }
      ],
      6: [
        { left: 0, top: 0, rot: 0, op: 0.3, z: 1, scale: 1 },
        { left: 12, top: 10, rot: 0, op: 0.4, z: 2, scale: 1 },
        { left: 24, top: 20, rot: 0, op: 0.6, z: 3, scale: 1 },
        { left: 36, top: 30, rot: 0, op: 0.8, z: 4, scale: 1 },
        { left: 48, top: 40, rot: 0, op: 1, z: 5, scale: 1 },
        { left: 60, top: 50, rot: 0, op: 1, z: 6, scale: 1 }
      ],
      7: [
        { left: 30, top: 25, rot: 0, op: 0.1, z: 1, scale: 1.8 },
        { left: 30, top: 25, rot: 0, op: 0.2, z: 2, scale: 1.5 },
        { left: 30, top: 25, rot: 0, op: 0.4, z: 3, scale: 1.2 },
        { left: 30, top: 25, rot: 0, op: 0.6, z: 4, scale: 0.9 },
        { left: 30, top: 25, rot: 0, op: 0.8, z: 5, scale: 0.7 },
        { left: 30, top: 25, rot: 0, op: 1, z: 6, scale: 0.5 }
      ],
      8: [
        { left: 10, top: 0, rot: 0, op: 1, z: 1, scale: 1 },
        { left: 50, top: 0, rot: 0, op: 1, z: 1, scale: 1 },
        { left: 10, top: 20, rot: 0, op: 1, z: 2, scale: 1 },
        { left: 50, top: 20, rot: 0, op: 1, z: 2, scale: 1 },
        { left: 10, top: 40, rot: 0, op: 1, z: 3, scale: 1 },
        { left: 50, top: 40, rot: 0, op: 1, z: 3, scale: 1 }
      ],
      9: [
        { left: 30, top: 0, rot: 0, op: 0.2, z: 1, scale: 0.4 },
        { left: 15, top: 10, rot: 0, op: 0.3, z: 2, scale: 0.5 },
        { left: 45, top: 15, rot: 0, op: 0.5, z: 3, scale: 0.6 },
        { left: 10, top: 30, rot: 0, op: 0.7, z: 4, scale: 0.8 },
        { left: 50, top: 35, rot: 0, op: 0.9, z: 5, scale: 0.9 },
        { left: 30, top: 40, rot: 0, op: 1, z: 6, scale: 1.1 }
      ],
      10: [
        { left: 30, top: 0, rot: 0, op: 1, z: 1, scale: 1 },
        { left: 55, top: 15, rot: 0, op: 1, z: 2, scale: 1 },
        { left: 55, top: 40, rot: 0, op: 1, z: 3, scale: 1 },
        { left: 30, top: 55, rot: 0, op: 1, z: 4, scale: 1 },
        { left: 5, top: 40, rot: 0, op: 1, z: 5, scale: 1 },
        { left: 5, top: 15, rot: 0, op: 1, z: 6, scale: 1 }
      ]
    };

    for (const item of exportItems) {
      const x = (item.x / 100) * rect.width;
      const y = (item.y / 100) * rect.height;
      const scale = (item.scale || 100) / 100;

      if (item.type === "line") {
        const length = (item.w / 100) * rect.width;
        ctx.save();
        ctx.translate(x, y); // Center point of the line
        ctx.rotate((item.rotation * Math.PI) / 180);
        ctx.strokeStyle = "rgba(94, 230, 255, 0.88)";
        const gap = Number(globalDashGapInput?.value || 5);
        ctx.setLineDash(item.lineStyle === "solid" ? [] : [5, gap]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-length / 2, 0); // Start from left of center
        ctx.lineTo(length / 2, 0); // Draw to right of center
        ctx.stroke();
        ctx.restore();
      } else if (item.type === "brace") {
        const bw = (item.w / 100) * rect.width;
        const bh = item.h || 100;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((item.rotation * Math.PI) / 180);
        ctx.scale(scale, scale);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2; 
        
        ctx.beginPath();
        const halfH = bh / 2;
        const mid = 0;
        const left = -bw / 2;
        const right = bw / 2;
        
        ctx.moveTo(right, -halfH);
        ctx.quadraticCurveTo(left + 2, -halfH, left + 2, -halfH + 15);
        ctx.lineTo(left + 2, mid - 5);
        ctx.quadraticCurveTo(left + 2, mid, left - 8, mid);
        ctx.quadraticCurveTo(left + 2, mid, left + 2, mid + 5);
        ctx.lineTo(left + 2, halfH - 15);
        ctx.quadraticCurveTo(left + 2, halfH, right, halfH);
        ctx.stroke();
        ctx.restore();
      } else if (item.type === "text") {
        const fontSize = item.fontSize || 24;
        ctx.font = `650 ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = item.textColor || "#eff8ff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        const lines = (item.text || "Text").split("\n");
        const lineHeight = fontSize * 1.1; 
        const totalHeight = lines.length * lineHeight;
        const startY = y - (totalHeight / 2) + (lineHeight / 2);
        
        lines.forEach((line, i) => {
          ctx.fillText(line, x, startY + (i * lineHeight));
        });
      } else if (item.type === "nodes-group" || item.type === "devices-group") {
        const isNodes = item.type === "nodes-group";
        const variant = item.pileVariant || 1;
        
        let icons = isNodes ? Array(3).fill(ICONS.node) : [ICONS.smoke, ICONS.sounder, ICONS.smoke, ICONS.smoke, ICONS.sounder, ICONS.mcp];
        
        const positions = PILE_VARIANTS[variant] || PILE_VARIANTS[1];
        
        // Match CSS pile dimensions: container is 90x80 relative to item scale
        const pxRatio = scale; // 1 CSS px = 1 Canvas user-unit pixel
        const cLeft = x - (45 * pxRatio); // center of width 90
        const cTop = y - (40 * pxRatio); // center of height 80

        // sort icons by sub-z-index to draw back-to-front
        const renderedIcons = icons.map((ic, i) => ({ src: ic, pos: positions[i % positions.length] })).sort((a, b) => a.pos.z - b.pos.z);

        for (const rIcon of renderedIcons) {
          const img = await loadImg(rIcon.src);
          if (!img.width) continue;

          ctx.save();
          // Icon width is 28px in CSS
          const icSize = 28 * pxRatio * rIcon.pos.scale;
          const ix = cLeft + (rIcon.pos.left * pxRatio) + (icSize / 2);
          const iy = cTop + (rIcon.pos.top * pxRatio) + (icSize / 2);

          ctx.translate(ix, iy);
          ctx.rotate((rIcon.pos.rot * Math.PI) / 180);
          ctx.globalAlpha = rIcon.pos.op;
          
          // Drop shadow for cluster piles (consistent for all types)
          ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
          ctx.shadowBlur = 6 * pxRatio;
          ctx.shadowOffsetY = 4 * pxRatio;
          
          ctx.drawImage(img, -icSize / 2, -icSize / 2, icSize, icSize);
          ctx.restore();
        }
      } else {
        const iconKey = item.type === "loop-card" ? "loopCard" : item.type;
        const img = await loadImg(ICONS[iconKey]);
        const iw = (item.w / 100) * rect.width * scale;
        const aspect = img.height / img.width;
        const ih = iw * aspect;
        ctx.drawImage(img, x - iw / 2, y - ih / 2, iw, ih);
      }
    }

    const link = document.createElement("a");
    link.download = `mesh-capacity-design-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    saveStatus.textContent = "Design exported as transparent PNG.";
  }

  document.querySelectorAll("[data-add-tool]").forEach((button) => {
    button.addEventListener("click", () => addItem(button.dataset.addTool));
  });

  document.getElementById("duplicate-item").addEventListener("click", duplicateSelected);
  document.getElementById("delete-item").addEventListener("click", deleteSelected);
  document.getElementById("bring-forward").addEventListener("click", () => moveLayer(1));
  document.getElementById("send-backward").addEventListener("click", () => moveLayer(-1));
  document.getElementById("export-code").addEventListener("click", syncOutput);
  document.getElementById("import-from-project").addEventListener("click", () => {
    importFromProject().catch((error) => {
      saveStatus.textContent = `Import failed: ${error.message}`;
    });
  });
  document.getElementById("export-png").addEventListener("click", () => {
    exportToPng().catch((error) => {
      saveStatus.textContent = `PNG Export failed: ${error.message}`;
    });
  });
  document.getElementById("save-to-project").addEventListener("click", () => {
    saveToProject().catch((error) => {
      saveStatus.textContent = `Save cancelled or failed: ${error.message}`;
    });
  });

  inspectorForm.addEventListener("input", updateSelectedFromInspector);
  window.addEventListener("pointermove", moveDrag);
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  stage.addEventListener("pointerdown", (event) => {
    if (event.target === stage || event.target === stageContent) {
      selectedId = null;
      render();
    }
  });

  window.addEventListener("keydown", (event) => {
    const item = selectedItem();
    if (!item || event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
      return;
    }

    const step = event.shiftKey ? 1.0 : 0.1;
    let handled = false;

    if (event.key === "ArrowUp") {
      item.y = clamp(item.y - step, 0, 100);
      handled = true;
    } else if (event.key === "ArrowDown") {
      item.y = clamp(item.y + step, 0, 100);
      handled = true;
    } else if (event.key === "ArrowLeft") {
      item.x = clamp(item.x - step, 0, 100);
      handled = true;
    } else if (event.key === "ArrowRight") {
      item.x = clamp(item.x + step, 0, 100);
      handled = true;
    }

    if (handled) {
      event.preventDefault();
      render();
    }
  });

  render();
}());
