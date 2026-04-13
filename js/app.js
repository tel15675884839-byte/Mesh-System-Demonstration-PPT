(function () {
  const STAGE_HEIGHT = 1080;
  const slides = document.querySelectorAll(".slide");
  const navDots = document.querySelectorAll(".nav-dot");
  const progressIndicator = document.getElementById("progress-indicator");
  const slidesContainer = document.getElementById("slides");
  const slideFrames = document.querySelectorAll(".slide-frame");
  let currentSlide = 0;
  let wheelLock = false;

  function syncFrameVisibility() {
    slideFrames.forEach((frame, frameIndex) => {
      if (!frame.contentWindow) {
        return;
      }
      frame.contentWindow.postMessage({
        type: "slideVisibility",
        active: frameIndex === currentSlide
      }, "*");
    });
  }

  function updateView(index) {
    currentSlide = Math.max(0, Math.min(index, slides.length - 1));
    slidesContainer.style.transform = "translateY(-" + (currentSlide * STAGE_HEIGHT) + "px)";

    navDots.forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === currentSlide);
    });

    if (progressIndicator) {
      progressIndicator.style.width = (((currentSlide + 1) / slides.length) * 100) + "%";
    }

    syncFrameVisibility();
  }

  function goToSlide(index) {
    updateView(index);
  }

  function moveBy(step) {
    goToSlide(currentSlide + step);
  }

  function handleWheel(event) {
    if (wheelLock || Math.abs(event.deltaY) < 16) {
      return;
    }

    wheelLock = true;
    moveBy(event.deltaY > 0 ? 1 : -1);
    window.setTimeout(() => {
      wheelLock = false;
    }, 850);
  }

  function handleKeydown(event) {
    if (["ArrowDown", "PageDown", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      moveBy(1);
    }

    if (["ArrowUp", "PageUp", "ArrowLeft"].includes(event.key)) {
      event.preventDefault();
      moveBy(-1);
    }

    if (event.key === "Home") {
      event.preventDefault();
      goToSlide(0);
    }

    if (event.key === "End") {
      event.preventDefault();
      goToSlide(slides.length - 1);
    }
  }

  navDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      goToSlide(Number(dot.dataset.target));
    });
  });

  slideFrames.forEach((frame) => {
    frame.addEventListener("load", syncFrameVisibility);
  });

  window.addEventListener("wheel", handleWheel, { passive: true });
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "goToSlide") {
      goToSlide(Number(event.data.slide));
    }
  });

  updateView(0);
}());
