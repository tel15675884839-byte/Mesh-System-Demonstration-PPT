(function () {
  const stage = document.querySelector(".reliability-stage");
  const animationMap = document.getElementById("reli-animation-map");
  const connectionLayer = document.getElementById("reli-connection-layer");
  const btnResponse = document.getElementById("btn-scene-response");
  const btnPath = document.getElementById("btn-scene-path");

  if (!stage || !animationMap) return;

  const CONFIG_KEY = 'mesh_reliability_shared_layout';
  let currentScene = 'response'; // 'response' (P1) or 'path' (P2)
  
  const activeParticles = new Set();
  let devices = [];
  let brokenLinks = new Set();

  // Final configured scales from user image
  const FINAL_CONFIG_P1 = [
    { id: 'panel-1', type: 'panel', top: '25%', left: '85%', scale: 1.0 }, 
    { id: 'leader-1', type: 'leader-node', top: '55%', left: '65%', scale: 1.6 },
    { id: 'node-1', type: 'node', top: '55%', left: '44%', scale: 1.4 },
    { id: 'det-1', type: 'det', top: '25%', left: '15%', scale: 1.28 },
    { id: 'sounder-1', type: 'sounder', top: '85%', left: '15%', scale: 1.28 }
  ];

  function init() {
    loadScene('response');

    if (btnResponse && btnPath) {
      const toggleFn = (target) => {
        if (target === currentScene) return;
        
        btnResponse.classList.toggle('is-active', target === 'response');
        btnPath.classList.toggle('is-active', target === 'path');

        loadScene(target);
      };

      btnResponse.onclick = () => toggleFn('response');
      btnPath.onclick = () => toggleFn('path');
    }

    startParticleSystem();
    window.addEventListener('resize', updateConnections);
  }

  function loadScene(sceneId) {
    currentScene = sceneId;
    const storageKey = CONFIG_KEY;
    const savedRaw = localStorage.getItem(storageKey);
    
    // Clear current
    animationMap.innerHTML = '';
    connectionLayer.innerHTML = '';
    devices = [];
    brokenLinks = new Set();

    let config = FINAL_CONFIG_P1; // For now default to P1 for both if P2 unset
    if (savedRaw) {
      const parsed = JSON.parse(savedRaw);
      config = parsed.devices || parsed;
      if (parsed.brokenLinks) brokenLinks = new Set(parsed.brokenLinks);
    }

    config.forEach(d => {
      const el = createDeviceElement(d.id, d.type, d.left, d.top, d.scale);
      animationMap.appendChild(el);
      devices.push({ id: d.id, type: d.type, element: el, scale: d.scale });
    });

    updateConnections();
    updatePanelAlarmState();
  }

  function createDeviceElement(id, type, left, top, scale = 1) {
    const div = document.createElement('div');
    div.id = id;
    div.className = `reliability-device ${type}`;
    div.style.left = left;
    div.style.top = top;
    
    const icon = document.createElement('div');
    icon.className = 'reli-icon';
    icon.style.transform = `scale(${scale})`;
    div.appendChild(icon);

    return div;
  }

  function saveState() {
    const storageKey = CONFIG_KEY;
    const config = devices.map(d => ({
        id: d.id,
        type: d.type,
        left: d.element.style.left,
        top: d.element.style.top,
        scale: d.scale
    }));
    localStorage.setItem(storageKey, JSON.stringify({
      devices: config,
      brokenLinks: Array.from(brokenLinks)
    }));
  }

  function updateConnections() {
    connectionLayer.innerHTML = '';
    const nodes = devices.filter(d => d.type === 'node');
    const leaders = devices.filter(d => d.type === 'leader-node');
    const peripherals = devices.filter(d => d.type === 'det' || d.type === 'sounder');
    const panels = devices.filter(d => d.type === 'panel');

    peripherals.forEach(p => {
      const closestNode = getClosestNode(p.element, nodes.map(n => n.element));
      if (closestNode) drawLine(p.id, p.element, closestNode.id, closestNode);
    });

    leaders.forEach(l => {
      const closestPanel = getClosestNode(l.element, panels.map(p => p.element));
      if (closestPanel) drawSnakeLine(l.id, l.element, closestPanel.id, closestPanel);
    });

    nodes.forEach(n => {
       const closestLeader = getClosestNode(n.element, leaders.map(l => l.element));
       if (closestLeader) drawLine(n.id, n.element, closestLeader.id, closestLeader);
    });
  }

  function toggleLink(linkId) {
    if (brokenLinks.has(linkId)) brokenLinks.delete(linkId);
    else brokenLinks.add(linkId);
    updateConnections();
    saveState();
    updatePanelAlarmState();
  }

  function updatePanelAlarmState() {
    const panels = devices.filter(d => d.type === 'panel');
    panels.forEach(p => {
      if (brokenLinks.size > 0 && currentScene === 'path') {
        p.element.classList.add('is-alarming');
      } else {
        p.element.classList.remove('is-alarming');
      }
    });
  }

  // Restored draw functions
  function drawLine(id1, el1, id2, el2) {
    const linkId = `${id1}_${id2}`;
    const isBroken = brokenLinks.has(linkId);
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();
    const parentRect = animationMap.getBoundingClientRect();
    const x1 = rect1.left + rect1.width / 2 - parentRect.left;
    const y1 = rect1.top + rect1.height / 2 - parentRect.top;
    const x2 = rect2.left + rect2.width / 2 - parentRect.left;
    const y2 = rect2.top + rect2.height / 2 - parentRect.top;

    const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "line");
    hitbox.setAttribute("x1", x1); hitbox.setAttribute("y1", y1);
    hitbox.setAttribute("x2", x2); hitbox.setAttribute("y2", y2);
    hitbox.setAttribute("class", "reli-connection-hitbox");
    hitbox.onclick = () => toggleLink(linkId);
    connectionLayer.appendChild(hitbox);

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1); line.setAttribute("y1", y1);
    line.setAttribute("x2", x2); line.setAttribute("y2", y2);
    line.setAttribute("class", `reli-connection-line ${isBroken ? 'reli-line-broken' : ''}`);
    connectionLayer.appendChild(line);

    if (isBroken) drawX((x1 + x2) / 2, (y1 + y2) / 2);
  }

  function drawSnakeLine(id1, el1, id2, el2) {
    const linkId = `${id1}_${id2}`;
    const isBroken = brokenLinks.has(linkId);
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();
    const parentRect = animationMap.getBoundingClientRect();

    const x1 = rect1.left + rect1.width / 2 - parentRect.left;
    const y1 = rect1.top + rect1.height / 2 - parentRect.top;
    const x2 = rect2.left + rect2.width / 2 - parentRect.left;
    const y2 = rect2.top + rect2.height / 2 - parentRect.top;

    const dx = x2 - x1; const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    const nx = -dy / length; const ny = dx / length;
    const amplitude = Math.max(60, length * 0.3);

    const cp1x = x1 + dx * 0.3 + (nx * amplitude);
    const cp1y = y1 + dy * 0.3 + (ny * amplitude);
    const cp2x = x1 + dx * 0.7 - (nx * amplitude);
    const cp2y = y1 + dy * 0.7 - (ny * amplitude);

    const d = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
    const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "path");
    hitbox.setAttribute("d", d);
    hitbox.setAttribute("class", "reli-connection-hitbox");
    hitbox.onclick = () => toggleLink(linkId);
    connectionLayer.appendChild(hitbox);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("class", `reli-snake-line ${isBroken ? 'reli-line-broken' : ''}`);
    connectionLayer.appendChild(path);

    if (isBroken) {
        const mx = x1 * 0.125 + cp1x * 0.375 + cp2x * 0.375 + x2 * 0.125;
        const my = y1 * 0.125 + cp1y * 0.375 + cp2y * 0.375 + y2 * 0.125;
        drawX(mx, my);
    }
  }

  function drawX(x, y) {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x); text.setAttribute("y", y);
    text.setAttribute("class", "reli-break-x");
    text.textContent = "✕";
    connectionLayer.appendChild(text);
  }
  function getClosestNode(targetEl, nodesList) {
    if (nodesList.length === 0) return null;
    const targetRect = targetEl.getBoundingClientRect();
    const tx = targetRect.left + targetRect.width / 2;
    const ty = targetRect.top + targetRect.height / 2;
    let minDistance = Infinity;
    let closestNode = null;
    nodesList.forEach(node => {
      const rect = node.getBoundingClientRect();
      const nx = rect.left + rect.width / 2;
      const ny = rect.top + rect.height / 2;
      const dist = Math.hypot(nx - tx, ny - ty);
      if (dist < minDistance) { minDistance = dist; closestNode = node; }
    });
    return closestNode;
  }

  function startParticleSystem() {
    setInterval(() => {
      const isTwoWay = currentScene === 'path'; // P2 is Two-way
      const nodes = devices.filter(d => d.type === 'node');
      const leaders = devices.filter(d => d.type === 'leader-node');
      const panels = devices.filter(d => d.type === 'panel');
      
      devices.forEach(d => {
        if (activeParticles.has(d.id + '_out')) return;
        
        let targetEl = null; let targetId = null;
        if (d.type === 'det' || d.type === 'sounder') {
          const closest = getClosestNode(d.element, nodes.map(n => n.element));
          if (closest) { targetEl = closest; targetId = closest.id; }
        } else if (d.type === 'node') {
          const closest = getClosestNode(d.element, leaders.map(l => l.element));
          if (closest) { targetEl = closest; targetId = closest.id; }
        } else if (d.type === 'leader-node') {
          const closest = getClosestNode(d.element, panels.map(p => p.element));
          if (closest) { targetEl = closest; targetId = closest.id; }
        }

        if (targetEl && !brokenLinks.has(`${d.id}_${targetId}`)) {
            spawnParticle(d.element, targetEl, d.id + '_out');
            
            // Flow: Incoming (Only for Two-way / Page 2)
            if (isTwoWay) {
               if (!activeParticles.has(d.id + '_in')) {
                  spawnParticle(targetEl, d.element, d.id + '_in', '#00e5ff');
               }
            }
        }
      });
    }, 120); 
  }

  function spawnParticle(fromEl, toEl, particleKey, color = '#fff') {
    activeParticles.add(particleKey);
    const mapRect = animationMap.getBoundingClientRect();
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    const startX = fromRect.left + fromRect.width / 2 - mapRect.left;
    const startY = fromRect.top + fromRect.height / 2 - mapRect.top;
    const endX = toRect.left + toRect.width / 2 - mapRect.left;
    const endY = toRect.top + toRect.height / 2 - mapRect.top;

    const particle = document.createElement("div");
    particle.className = "reli-particle";
    if (color !== '#fff') {
       particle.style.boxShadow = `0 0 15px 4px ${color}, 0 0 5px 1px #fff`;
    }
    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;
    animationMap.appendChild(particle);

    const animation = particle.animate([
      { transform: `translate(0, 0) scale(0)`, opacity: 0 },
      { transform: `translate(${(endX - startX) * 0.1}px, ${(endY - startY) * 0.1}px) scale(1.2)`, opacity: 1, offset: 0.1 },
      { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(1)`, opacity: 0 }
    ], { duration: 450, easing: "ease-in" });

    animation.onfinish = () => { particle.remove(); activeParticles.delete(particleKey); };
  }

  init();
}());
