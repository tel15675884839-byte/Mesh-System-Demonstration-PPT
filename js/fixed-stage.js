(function () {
  const STAGE_WIDTH = 1920;
  const STAGE_HEIGHT = 1080;

  function updateStageScale() {
    const scale = Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
    document.documentElement.style.setProperty("--stage-scale", String(scale));
  }

  window.addEventListener("resize", updateStageScale);
  updateStageScale();
}());
