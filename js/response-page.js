(function () {
  const page = document.querySelector(".page-response");
  const stage = document.getElementById("stage-trigger");
  const animationMap = document.getElementById("animation-map");
  const detTrigger = document.getElementById("det-trigger");
  const nodeLeft = document.getElementById("node-left");
  const nodeRight = document.getElementById("node-right");
  const sounders = document.querySelectorAll(".sounder");

  if (!page || !stage) return;

  let isAnimating = false;
  let hasTriggered = false;

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  async function sendPulse(fromEl, toEl, color, duration = 600) {
    const mapRect = animationMap.getBoundingClientRect();
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();

    const startX = fromRect.left + fromRect.width / 2 - mapRect.left;
    const startY = fromRect.top + fromRect.height / 2 - mapRect.top;
    const endX = toRect.left + toRect.width / 2 - mapRect.left;
    const endY = toRect.top + toRect.height / 2 - mapRect.top;

    const pulse = document.createElement("div");
    pulse.className = "signal-pulse";
    pulse.style.color = color;
    pulse.style.backgroundColor = color;
    pulse.style.boxShadow = `0 0 15px 2px ${color}`;
    pulse.style.left = `${startX}px`;
    pulse.style.top = `${startY}px`;

    animationMap.appendChild(pulse);

    const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    const animation = pulse.animate([
      { transform: `translate(0, 0) rotate(${angle}deg) scale(1)`, opacity: 0 },
      { transform: `translate(${deltaX * 0.1}px, ${deltaY * 0.1}px) rotate(${angle}deg) scale(1.2)`, opacity: 1, offset: 0.1 },
      { transform: `translate(${deltaX}px, ${deltaY}px) rotate(${angle}deg) scale(1)`, opacity: 0 }
    ], {
      duration: duration,
      easing: "cubic-bezier(0.2, 0, 0.2, 1)",
      fill: "forwards"
    });

    await animation.finished;
    pulse.remove();
  }

  function getClosestNode(targetEl, nodesList) {
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

      if (dist < minDistance) {
        minDistance = dist;
        closestNode = node;
      }
    });
    return closestNode;
  }

  async function startAlarmSequence() {
    if (isAnimating) return;
    isAnimating = true;
    page.dataset.status = "animating";

    // 1. Trigger DET fires
    detTrigger.classList.add("is-triggered");
    await sleep(800);

    // 2. Pulse directly to all nodes
    await Promise.all([
      sendPulse(detTrigger, nodeLeft, "#ff3333", 450),
      sendPulse(detTrigger, nodeRight, "#ff3333", 450)
    ]);
    
    nodeLeft.classList.add("is-active");
    nodeRight.classList.add("is-active");
    await sleep(300);

    // 3. Spread to Sounders
    const allNodes = [nodeLeft, nodeRight];
    page.dataset.status = "alarming";
    page.dataset.isAlarming = "true";

    const sounderPromises = Array.from(sounders).map(async (sounder) => {
      const closestNode = getClosestNode(sounder, allNodes);
      await sendPulse(closestNode, sounder, "#ff3333", 450);
      sounder.classList.add("is-alarming");
    });

    await Promise.all(sounderPromises);
    
    isAnimating = false;
    hasTriggered = true;
  }

  stage.addEventListener("click", () => {
    if (!isAnimating) {
      if (hasTriggered) {
        // Soft reset if already alarming to allow re-demo
        detTrigger.classList.remove("is-triggered");
        nodeCenter.classList.remove("is-active");
        nodeLeft.classList.remove("is-active");
        nodeRight.classList.remove("is-active");
        sounders.forEach(s => s.classList.remove("is-alarming"));
        page.dataset.isAlarming = "false";
        hasTriggered = false;
      }
      startAlarmSequence();
    }
  });

}());
