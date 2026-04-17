(function () {
  const PRODUCT_SWITCH_EXIT_MS = 320;
  const PRODUCT_SWITCH_SETTLE_MS = 1120;

  function createSearchParams(search) {
    const SearchParams = window.URLSearchParams || (typeof URLSearchParams === "function" ? URLSearchParams : null);
    if (SearchParams) {
      return new SearchParams(search || "");
    }

    return {
      get() {
        return null;
      }
    };
  }

  const products = [
    {
      slug: "expansion-card",
      name: "Expansion Card",
      imageScale: 0.78,
      category: "Wireless Loop Expansion Card",
      title: "Wireless Loop Expansion Card",
      titleNoWrap: true,
      image: "../assets/images/products/wireless loop expansion card.png",
      fallbackImage: "../assets/icons/loop expansion card.svg",
      accentRgb: "94, 230, 255",
      accentSoftRgb: "15, 235, 198",
      stats: [
        { label: "Installation", value: "Mounted in the CIE" },
        { label: "Loop Support", value: "Up to 4 wireless loops" },
        { label: "Per-loop Capacity", value: "125 devices" },
        { label: "Node Structure", value: "1 leader + 31 nodes" }
      ]
    },
    {
      slug: "leader-node",
      name: "Leader / Node",
      category: "Wireless Leader / Node",
      title: "Wireless Leader / Node",
      image: "../assets/images/products/node.png",
      fallbackImage: "../assets/icons/leader-node.svg",
      accentRgb: "106, 234, 198",
      accentSoftRgb: "112, 240, 255",
      stats: [
        { label: "Power Input", value: "DC 24V" },
        { label: "Monitoring", value: "Quiescent, alarm, fault" },
        { label: "Antenna", value: "Internal antenna" },
        { label: "Communication", value: "Mesh topology" }
      ]
    },
    {
      slug: "detectors",
      name: "Detectors",
      category: "Wireless Detectors",
      title: "Wireless Detectors",
      image: "../assets/images/products/smoke.png",
      fallbackImage: "../assets/icons/smoke.svg",
      accentRgb: "151, 237, 255",
      accentSoftRgb: "15, 235, 198",
      stats: [
        { label: "Detection", value: "Smoke, heat, or combined" },
        { label: "Power Source", value: "10-year Lithium battery" },
        { label: "Communication", value: "Mesh topology" },
        { label: "Open-area Range", value: "Up to 500m" }
      ]
    },
    {
      slug: "call-point",
      name: "Call Point",
      category: "Wireless Manual Call Point",
      title: "Wireless Manual Call Point",
      image: "../assets/images/products/mcp.png",
      fallbackImage: "../assets/icons/mcp.svg",
      accentRgb: "255, 89, 89",
      accentSoftRgb: "255, 140, 102",
      stats: [
        { label: "Power Source", value: "10-year Lithium battery" },
        { label: "Antenna", value: "Internal antenna" },
        { label: "Communication", value: "Mesh topology" },
        { label: "Open-area Range", value: "Up to 500m" }
      ]
    },
    {
      slug: "av-alarm",
      name: "A/V Alarm",
      category: "Wireless Audio/Visual Alarm",
      title: "Wireless Audio/Visual Alarm",
      image: "../assets/images/products/wireless-av-alarm.png",
      fallbackImage: "../assets/icons/sounder.svg",
      accentRgb: "255, 108, 80",
      accentSoftRgb: "255, 171, 102",
      stats: [
        { label: "Models", value: "Audible, visual, A/V combo" },
        { label: "Power Source", value: "10-year Lithium battery" },
        { label: "Communication", value: "Mesh topology" },
        { label: "Enclosure", value: "IP-65 weatherproof option" }
      ]
    },
    {
      slug: "io-module",
      name: "I/O Module",
      category: "Wireless Input/Output Module",
      title: "Wireless Input/Output Module",
      titleNoWrap: true,
      image: "../assets/images/products/io module.png",
      fallbackImage: "../assets/icons/io-module.svg",
      accentRgb: "142, 196, 255",
      accentSoftRgb: "112, 240, 255",
      stats: [
        { label: "Power Source", value: "10-year Lithium battery" },
        { label: "Antenna", value: "Internal antenna" },
        { label: "Communication", value: "Mesh topology" },
        { label: "Open-area Range", value: "Up to 500m" }
      ]
    }
  ];

  let stage = document.getElementById("product-stage");
  let stageMain = document.getElementById("product-stage-main");
  const btnPrev = document.getElementById("nav-prev");
  const btnNext = document.getElementById("nav-next");
  const counterEl = document.getElementById("product-counter");
  const presentationMessaging = window.meshPresentationMessaging || null;
  let activeIndex = -1;
  let transitionExitTimer = 0;
  let transitionSettleTimer = 0;
  let isInitializing = true;

  function prefersReducedMotion() {
    return Boolean(
      window.matchMedia &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function clearTransitionTimers() {
    if (transitionExitTimer) {
      window.clearTimeout(transitionExitTimer);
      transitionExitTimer = 0;
    }

    if (transitionSettleTimer) {
      window.clearTimeout(transitionSettleTimer);
      transitionSettleTimer = 0;
    }
  }

  function resetTransitionState() {
    if (!stage) {
      return;
    }

    stage.classList.remove("is-transitioning");
    stage.classList.remove("is-exiting");
    stage.classList.remove("is-enter-prep");
    stage.removeAttribute("data-product-direction");
  }

  function getInitialProductIndex() {
    const searchParams = presentationMessaging && typeof presentationMessaging.getSharedSearchParams === "function"
      ? presentationMessaging.getSharedSearchParams()
      : createSearchParams((window.location && window.location.search) || "");
    const requestedProduct = searchParams.get("product");

    if (!requestedProduct) {
      return 0;
    }

    const numericIndex = Number(requestedProduct);
    if (Number.isInteger(numericIndex) && numericIndex >= 0 && numericIndex < products.length) {
      return numericIndex;
    }

    const slugIndex = products.findIndex(function (product) {
      return product.slug === requestedProduct;
    });

    return slugIndex >= 0 ? slugIndex : 0;
  }

  function renderStatsHTML(stats) {
    return stats
      .map((item) => (
        "<article class=\"product-stat-card\">" +
          "<p class=\"product-stat-label\">" + item.label + "</p>" +
          "<p class=\"product-stat-value\">" + item.value + "</p>" +
        "</article>"
      ))
      .join("");
  }

  function updateAria(slide, index) {
    const detailsPanel = slide.querySelector(".product-details-panel");
    if (detailsPanel) {
      detailsPanel.setAttribute("aria-labelledby", "product-tab-" + index);
    }
  }

  function renderProduct(index, options) {
    if (!stageMain) {
      stageMain = document.getElementById("product-stage-main");
      if (!stageMain) return;
    }

    if (index === activeIndex) return;

    const product = products[index];
    if (!product) return;

    const config = options || {};
    
    // Mark previous slide
    const currentSlide = stageMain.querySelector(".product-slide.active");
    if (currentSlide) {
      currentSlide.classList.remove("active");
      currentSlide.classList.add("prev");
      // Clean up after animation
      setTimeout(() => {
        if (currentSlide.parentNode) {
          currentSlide.parentNode.removeChild(currentSlide);
        }
      }, 1000);
    }

    // Create new slide
    const newSlide = document.createElement("div");
    newSlide.className = "product-slide";
    newSlide.innerHTML = 
      "<section class=\"product-visual-panel\" aria-live=\"polite\">" +
        "<div class=\"product-aura\" aria-hidden=\"true\"></div>" +
        "<div class=\"product-image-shell\">" +
          "<img class=\"product-image\" src=\"" + product.image + "\" alt=\"" + product.name + "\" decoding=\"async\">" +
          "<img class=\"product-fallback is-hidden\" src=\"" + product.fallbackImage + "\" alt=\"\" decoding=\"async\">" +
        "</div>" +
      "</section>" +
      "<section class=\"product-details-panel\" role=\"tabpanel\">" +
        "<h3 class=\"product-title\">" + product.title + "</h3>" +
        "<div class=\"product-stats-grid\">" + renderStatsHTML(product.stats) + "</div>" +
      "</section>";

    const imageEl = newSlide.querySelector(".product-image");
    if (imageEl) {
      imageEl.style.setProperty("--image-scale", String(product.imageScale || 1.3));
      imageEl.style.setProperty("--image-offset-y", "-3%");
    }

    stageMain.appendChild(newSlide);
    
    // Set accent colors
    if (!stage) {
      stage = document.getElementById("product-stage");
    }

    if (stage) {
      stage.style.setProperty("--product-accent-rgb", product.accentRgb);
      stage.style.setProperty("--product-accent-soft-rgb", product.accentSoftRgb);
    }

    // Trigger animation
    if (isInitializing) {
      newSlide.classList.add("active");
      isInitializing = false;
    } else {
      setTimeout(() => {
        newSlide.classList.add("active");
      }, 40);
    }

    activeIndex = index;
    updateAria(newSlide, index);

    if (counterEl) {
      counterEl.textContent = String(index + 1).padStart(2, "0") + " / " + String(products.length).padStart(2, "0");
    }

    if (config.syncUrl && presentationMessaging && typeof presentationMessaging.syncPresentationState === "function") {
      presentationMessaging.syncPresentationState({
        product: product.slug
      });
    }
  }

  function animateProductSwitch(index, direction, options) {
    const config = options || {};

    if (!stage || prefersReducedMotion()) {
      clearTransitionTimers();
      resetTransitionState();
      renderProduct(index, config);
      return;
    }

    clearTransitionTimers();
    stage.setAttribute("data-product-direction", direction);
    stage.classList.add("is-transitioning");
    stage.classList.add("is-exiting");
    stage.classList.remove("is-enter-prep");

    transitionExitTimer = window.setTimeout(function () {
      transitionExitTimer = 0;
      renderProduct(index, config);
      stage.classList.remove("is-exiting");
      stage.classList.add("is-enter-prep");

      const scheduleFrame = window.requestAnimationFrame || function (callback) {
        return window.setTimeout(callback, 16);
      };
      scheduleFrame(function () {
        stage.classList.remove("is-enter-prep");
      });
    }, PRODUCT_SWITCH_EXIT_MS);

    transitionSettleTimer = window.setTimeout(function () {
      transitionSettleTimer = 0;
      resetTransitionState();
    }, PRODUCT_SWITCH_SETTLE_MS);
  }

  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      const nextIndex = (activeIndex - 1 + products.length) % products.length;
      animateProductSwitch(nextIndex, "backward", { syncUrl: true });
    });
  }

  if (btnNext) {
    btnNext.addEventListener("click", () => {
      const nextIndex = (activeIndex + 1) % products.length;
      animateProductSwitch(nextIndex, "forward", { syncUrl: true });
    });
  }

  if (typeof document.addEventListener === "function") {
    document.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") {
        return;
      }

      event.preventDefault();

      let nextIndex = activeIndex;
      let direction = "forward";
      if (event.key === "Home") {
        nextIndex = 0;
        direction = nextIndex < activeIndex ? "backward" : "forward";
      } else if (event.key === "End") {
        nextIndex = products.length - 1;
        direction = nextIndex < activeIndex ? "backward" : "forward";
      } else {
        const step = event.key === "ArrowRight" ? 1 : -1;
        direction = step > 0 ? "forward" : "backward";
        nextIndex = (activeIndex + step + products.length) % products.length;
      }

      animateProductSwitch(nextIndex, direction, { syncUrl: true });
    });
  }

  function boot() {
    renderProduct(getInitialProductIndex(), { syncUrl: false });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
}());
