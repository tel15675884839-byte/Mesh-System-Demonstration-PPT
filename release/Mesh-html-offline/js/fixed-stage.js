(function () {
  const STAGE_WIDTH = 1920;
  const STAGE_HEIGHT = 1080;
  const root = document.documentElement;

  function getShellMode() {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("mode") === "browser" ? "browser" : "presentation";
  }

  function setShellMode(mode) {
    root.dataset.mode = mode;
  }

  function updateStageScale() {
    const scale = Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
    document.documentElement.style.setProperty("--stage-scale", String(scale));
  }

  setShellMode(getShellMode());

  if (root.dataset.mode !== "browser") {
    window.addEventListener("resize", updateStageScale);
    updateStageScale();
  }
}());
