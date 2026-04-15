(function () {
  const STAGE_HEIGHT = 1080;
  const DISTANCE_SLIDE_INDEX = 5;
  const PRODUCT_SLIDE_INDEX = 9;
  const PRODUCT_BACKGROUND_TRANSITION_MS = 720;
  const slideSlugs = [
    "opening",
    "overview",
    "mesh",
    "reliability",
    "response",
    "distance",
    "battery",
    "installation",
    "capacity",
    "products"
  ];
  const rootElement = document.documentElement || null;
  const shellMode = rootElement && rootElement.dataset && rootElement.dataset.mode === "browser" ? "browser" : "presentation";
  const isBrowserMode = shellMode === "browser";
  const slides = document.querySelectorAll(".slide");
  const navDots = document.querySelectorAll(".nav-dot");
  const progressIndicator = document.getElementById("progress-indicator");
  const slidesContainer = document.getElementById("slides");
  const slideFrames = document.querySelectorAll(".slide-frame");
  const appShell = typeof document.querySelector === "function" ? document.querySelector(".app-shell") : null;
  let currentSlide = 0;
  let wheelLock = false;
  let productBackgroundTransitionTimer = 0;

  function createSearchParams(search) {
    const SearchParams = window.URLSearchParams || (typeof URLSearchParams === "function" ? URLSearchParams : null);
    if (SearchParams) {
      return new SearchParams(search || "");
    }

    return {
      get() {
        return null;
      },
      has() {
        return false;
      },
      set() {},
      delete() {},
      toString() {
        return "";
      }
    };
  }

  function getSearchParams() {
    return createSearchParams((window.location && window.location.search) || "");
  }

  function getSlideSlug(index) {
    return slideSlugs[index] || String(index);
  }

  function resolveSlideIndex(slideValue) {
    const numericValue = Number(slideValue);
    if (Number.isInteger(numericValue) && numericValue >= 0 && numericValue < slides.length) {
      return numericValue;
    }

    const slugIndex = slideSlugs.indexOf(slideValue);
    if (slugIndex >= 0 && slugIndex < slides.length) {
      return slugIndex;
    }

    return null;
  }

  function getInitialSlideIndex() {
    const searchParams = getSearchParams();
    const requestedSlide = searchParams.get("slide");
    const resolvedSlide = requestedSlide ? resolveSlideIndex(requestedSlide) : null;

    if (resolvedSlide !== null) {
      return resolvedSlide;
    }

    if (searchParams.has("product")) {
      return Math.min(PRODUCT_SLIDE_INDEX, slides.length - 1);
    }

    if (searchParams.has("scene")) {
      return Math.min(DISTANCE_SLIDE_INDEX, slides.length - 1);
    }

    return 0;
  }

  function replaceHistoryUrl(searchParams) {
    if (!window.history || typeof window.history.replaceState !== "function" || !window.location) {
      return;
    }

    const search = searchParams.toString();
    const nextUrl = window.location.pathname + (search ? "?" + search : "");
    window.history.replaceState(null, "", nextUrl);
  }

  function syncUrlState(overrides) {
    const searchParams = getSearchParams();

    searchParams.set("slide", getSlideSlug(currentSlide));

    Object.keys(overrides || {}).forEach(function (key) {
      const value = overrides[key];
      if (value === null || value === undefined || value === "") {
        searchParams.delete(key);
        return;
      }
      searchParams.set(key, String(value));
    });

    if (currentSlide !== DISTANCE_SLIDE_INDEX) {
      searchParams.delete("scene");
    }

    if (currentSlide !== PRODUCT_SLIDE_INDEX) {
      searchParams.delete("product");
    }

    replaceHistoryUrl(searchParams);
  }

  function syncBackgroundActivity() {
    const eventDetail = {
      active: currentSlide <= 1,
      slide: currentSlide
    };
    const BackgroundEvent = typeof CustomEvent === "function"
      ? CustomEvent
      : function FallbackEvent(type, init) {
          this.type = type;
          this.detail = init ? init.detail : undefined;
        };
    window.dispatchEvent(new BackgroundEvent("stageBackgroundActive", {
      detail: eventDetail
    }));
  }

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

  function clearProductBackgroundTransitionTimer() {
    if (!productBackgroundTransitionTimer) {
      return;
    }

    window.clearTimeout(productBackgroundTransitionTimer);
    productBackgroundTransitionTimer = 0;
  }

  function scheduleProductBackgroundTransition(callback) {
    clearProductBackgroundTransitionTimer();
    productBackgroundTransitionTimer = window.setTimeout(function () {
      productBackgroundTransitionTimer = 0;
      callback();
    }, PRODUCT_BACKGROUND_TRANSITION_MS);
  }

  function syncShellBackgroundMode(previousSlide, options) {
    if (!appShell) {
      return;
    }

    const config = options || {};
    const isProductSlide = currentSlide === PRODUCT_SLIDE_INDEX;
    const isInitialSync = Boolean(config.instantBackground);

    clearProductBackgroundTransitionTimer();

    if (isProductSlide) {
      appShell.classList.add("is-product-background");
      appShell.classList.remove("is-product-background-exit");

      if (isInitialSync || previousSlide === PRODUCT_SLIDE_INDEX) {
        appShell.classList.remove("is-product-background-enter");
        return;
      }

      appShell.classList.add("is-product-background-enter");
      scheduleProductBackgroundTransition(function () {
        appShell.classList.remove("is-product-background-enter");
      });
      return;
    }

    appShell.classList.remove("is-product-background-enter");

    if (!appShell.classList.contains("is-product-background")) {
      appShell.classList.remove("is-product-background-exit");
      return;
    }

    if (isInitialSync) {
      appShell.classList.remove("is-product-background");
      appShell.classList.remove("is-product-background-exit");
      return;
    }

    appShell.classList.add("is-product-background-exit");
    scheduleProductBackgroundTransition(function () {
      appShell.classList.remove("is-product-background");
      appShell.classList.remove("is-product-background-exit");
    });
  }

  function updateSlidePosition(shouldScroll) {
    if (!slidesContainer) {
      return;
    }

    if (!isBrowserMode) {
      slidesContainer.style.transform = "translateY(-" + (currentSlide * STAGE_HEIGHT) + "px)";
      return;
    }

    slidesContainer.style.transform = "";

    if (shouldScroll && slides[currentSlide] && typeof slides[currentSlide].scrollIntoView === "function") {
      slides[currentSlide].scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  function updateView(index, options) {
    const config = options || {};
    const previousSlide = currentSlide;
    currentSlide = Math.max(0, Math.min(index, slides.length - 1));
    updateSlidePosition(Boolean(config.scroll));

    navDots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === currentSlide;
      dot.classList.toggle("active", isActive);
      if (isActive) {
        dot.setAttribute("aria-current", "true");
      } else {
        dot.removeAttribute("aria-current");
      }
    });

    if (progressIndicator) {
      progressIndicator.style.width = (((currentSlide + 1) / slides.length) * 100) + "%";
    }

    syncShellBackgroundMode(previousSlide, config);
    syncFrameVisibility();
    syncBackgroundActivity();
    syncUrlState(config.state || null);
  }

  function goToSlide(index, options) {
    updateView(index, options);
  }

  function moveBy(step) {
    goToSlide(currentSlide + step, { scroll: isBrowserMode });
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
      goToSlide(Number(dot.dataset.target), { scroll: isBrowserMode });
    });
  });

  slideFrames.forEach((frame) => {
    frame.addEventListener("load", syncFrameVisibility);
  });

  if (!isBrowserMode) {
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("keydown", handleKeydown);
  }

  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "goToSlide") {
      goToSlide(Number(event.data.slide), { scroll: isBrowserMode });
      return;
    }

    if (event.data && event.data.type === "syncPresentationState") {
      syncUrlState(event.data.state || {});
    }
  });

  updateView(getInitialSlideIndex(), { scroll: false, instantBackground: true });
}());
