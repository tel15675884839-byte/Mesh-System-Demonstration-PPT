(function () {
  const slides = document.querySelectorAll(".slide");
  const navDots = document.querySelectorAll(".nav-dot");
  const progressIndicator = document.getElementById("progress-indicator");
  const slidesContainer = document.getElementById("slides");
  let currentSlide = 0;
  let wheelLock = false;

  function updateView(index) {
    currentSlide = Math.max(0, Math.min(index, slides.length - 1));
    slidesContainer.style.transform = "translateY(-" + currentSlide * 100 + "vh)";

    navDots.forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === currentSlide);
    });

    if (progressIndicator) {
      progressIndicator.style.width = (((currentSlide + 1) / slides.length) * 100) + "%";
    }
  }

  function goToSlide(index) {
    updateView(index);
  }

  function moveBy(step) {
    goToSlide(currentSlide + step);
  }

  function handleWheel(event) {
    if (window.innerWidth <= 900) {
      return;
    }

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

  window.addEventListener("wheel", handleWheel, { passive: true });
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "goToSlide") {
      goToSlide(Number(event.data.slide));
    }
  });

  updateView(0);
}());
