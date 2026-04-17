(function () {
  const root = document.documentElement;
  const navDots = Array.from(document.querySelectorAll(".artidrop-shell-nav-dot"));
  const manifestNode = document.getElementById("artidrop-slide-manifest");
  const currentIndex = Number(root.dataset.slideIndex || "0");
  let wheelLock = false;

  if (!manifestNode || navDots.length === 0) {
    return;
  }

  let manifest;

  try {
    manifest = JSON.parse(manifestNode.textContent || "[]");
  } catch (_error) {
    manifest = [];
  }

  if (!Array.isArray(manifest) || manifest.length === 0) {
    return;
  }

  function navigateTo(index) {
    const next = manifest[index];
    if (!next || typeof next.href !== "string" || index === currentIndex) {
      return;
    }

    window.location.href = next.href;
  }

  function moveBy(step) {
    const nextIndex = currentIndex + step;
    if (nextIndex < 0 || nextIndex >= manifest.length) {
      return;
    }
    navigateTo(nextIndex);
  }

  navDots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      navigateTo(Number(dot.dataset.slideIndex));
    });
  });

  window.addEventListener("wheel", function (event) {
    if (wheelLock || Math.abs(event.deltaY) < 16) {
      return;
    }

    wheelLock = true;
    moveBy(event.deltaY > 0 ? 1 : -1);
    window.setTimeout(function () {
      wheelLock = false;
    }, 850);
  }, { passive: true });

  window.addEventListener("keydown", function (event) {
    if (event.key === "PageDown") {
      event.preventDefault();
      moveBy(1);
      return;
    }

    if (event.key === "PageUp") {
      event.preventDefault();
      moveBy(-1);
    }
  });

  window.addEventListener("message", function (event) {
    if (!event.data || event.data.type !== "goToSlide") {
      return;
    }

    navigateTo(Number(event.data.slide));
  });
}());
