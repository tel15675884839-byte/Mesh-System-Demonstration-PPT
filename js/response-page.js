(function () {
  const page = document.querySelector(".page-response");
  if (!page) {
    return;
  }

  const statusTitle = document.getElementById("response-status-title");
  const statusCopy = document.getElementById("response-status-copy");
  const timelineItems = Array.from(document.querySelectorAll(".response-timeline-item"));
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const stages = [
    {
      id: "accumulation",
      title: "R&D baseline synced",
      copy: "Network readiness is primed for dependable transmission.",
      duration: 2100
    },
    {
      id: "optimization",
      title: "Algorithm path accelerated",
      copy: "Signal cadence increases with cleaner routing behavior.",
      duration: 1800
    },
    {
      id: "delivery",
      title: "Rapid and stable arrival",
      copy: "Panel intake remains fast while route confidence stays steady.",
      duration: 1900
    }
  ];

  let currentIndex = 0;
  let stageTimer = null;

  function syncTimeline(stageId) {
    timelineItems.forEach((item) => {
      const isActive = item.dataset.timelineStage === stageId;
      item.classList.toggle("is-active", isActive);
      if (isActive) {
        item.setAttribute("aria-current", "step");
      } else {
        item.removeAttribute("aria-current");
      }
    });
  }

  function setStage(index) {
    const stage = stages[index];
    if (!stage) {
      return;
    }

    currentIndex = index;
    page.dataset.stage = stage.id;
    syncTimeline(stage.id);

    if (statusTitle) {
      statusTitle.textContent = stage.title;
    }

    if (statusCopy) {
      statusCopy.textContent = stage.copy;
    }
  }

  function clearStageTimer() {
    if (stageTimer) {
      window.clearTimeout(stageTimer);
      stageTimer = null;
    }
  }

  function queueNextStage() {
    clearStageTimer();

    if (motionQuery.matches) {
      return;
    }

    stageTimer = window.setTimeout(() => {
      const nextIndex = (currentIndex + 1) % stages.length;
      setStage(nextIndex);
      queueNextStage();
    }, stages[currentIndex].duration);
  }

  function startStageLoop() {
    setStage(currentIndex);
    queueNextStage();
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      clearStageTimer();
      return;
    }

    queueNextStage();
  }

  function handleMotionChange() {
    if (motionQuery.matches) {
      clearStageTimer();
      setStage(0);
      return;
    }

    queueNextStage();
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);

  if (typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", handleMotionChange);
  } else if (typeof motionQuery.addListener === "function") {
    motionQuery.addListener(handleMotionChange);
  }

  startStageLoop();
}());
