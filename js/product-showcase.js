(function () {
  const PRODUCT_SWITCH_MS = 800;

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
      slug: "system-overview",
      name: "System Overview",
      imageScale: 1.1,
      category: "Wireless Mesh System",
      title: "Wireless Mesh Fire Alarm System",
      image: "../assets/images/products/all.png",
      fallbackImage: "../assets/icons/loop expansion card.svg",
      accentRgb: "255, 255, 255",
      accentSoftRgb: "200, 200, 200",
      stats: [
        { label: "Architecture", value: "Wireless Mesh Topology" },
        { label: "Reliability", value: "Redundant Communication" },
        { label: "Devices", value: "Full Range of Wireless Units" },
        { label: "Certification", value: "EN54 Part 25 Certified" }
      ]
    },
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
        { label: "Loop Capacity", value: "4 Wireless Loops" },
        { label: "Device Capacity", value: "500 Devices" },
        { label: "Node Capacity", value: "64 Nodes" }
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
        { label: "Power Input", value: "Loop Power/DC 24V" },
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
      battery: { image: "../assets/images/products/17450.png", count: 1 },
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
      battery: { image: "../assets/images/products/17450mcp.png", count: 1 },
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
      battery: { image: "../assets/images/products/17450.png", count: 4 },
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
      battery: { image: "../assets/images/products/17450.png", count: 4 },
      stats: [
        { label: "Power Source", value: "10-year Lithium battery" },
        { label: "Antenna", value: "Internal antenna" },
        { label: "Communication", value: "Mesh topology" },
        { label: "Open-area Range", value: "Up to 500m" }
      ]
    },
    {
      slug: "switched-supply-input",
      name: "625-005 Input Module",
      category: "Wireless Switched Supply Input Module",
      title: "Wireless Switched Supply Input Module",
      image: "../assets/images/products/node.png",
      fallbackImage: "../assets/icons/leader-node.svg",
      accentRgb: "106, 234, 198",
      accentSoftRgb: "112, 240, 255",
      beamConnection: true,
      stats: [
        { label: "Model", value: "625-005" },
        { label: "Power Source", value: "External 24 V DC" },
        { label: "Device Reset", value: "Supply switches to 0 V on reset" },
        { label: "Open-area Range", value: "Up to 500 m" }
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
  const productSlides = new Map();
  let currentSlide = null;
  let outgoingSlide = null;
  let switchAnimations = [];

  function prefersReducedMotion() {
    return Boolean(
      window.matchMedia &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function finishProductTransition() {
    switchAnimations.forEach(animation => animation.cancel());
    switchAnimations = [];
    if (outgoingSlide) {
      outgoingSlide.remove();
      outgoingSlide = null;
    }
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

  function renderBatteryHTML(battery) {
    if (!battery || !battery.image) return "";

    let html = "<div class=\"product-battery-group\" data-count=\"" + battery.count + "\">";
    for (let i = 0; i < battery.count; i++) {
      html += "<img src=\"" + battery.image + "\" class=\"battery-icon\" alt=\"Battery " + (i + 1) + "\">";
    }
    html += "</div>";
    return html;
  }

  function renderBeamConnectionHTML(product) {
    return "<div class=\"beam-arrangement\" role=\"group\" aria-label=\"625-005 module connected to a beam detector by switched supply and a dry-contact alarm input\">" +
      "<figure class=\"beam-module\">" +
      "<div class=\"beam-module-photo\"><img class=\"product-image\" src=\"" + product.image + "\" alt=\"625-005 wireless switched supply input module\"></div>" +
      "<figcaption>625-005</figcaption></figure>" +
      "<div class=\"beam-connections\" aria-hidden=\"true\">" +
      "<span>Switched supply</span><span class=\"beam-wire beam-wire-out\"></span>" +
      "<span class=\"beam-wire beam-wire-in\"></span><span>Alarm input</span></div>" +
      "<figure class=\"beam-detector\"><img src=\"../assets/images/products/beam-detector.png\" alt=\"Beam smoke detector\">" +
      "<figcaption>Beam detector</figcaption></figure></div>";
  }

  function updateAria(slide, index) {
    const detailsPanel = slide.querySelector(".product-details-panel");
    if (detailsPanel) {
      detailsPanel.setAttribute("aria-labelledby", "product-tab-" + index);
    }
  }

  function getProductSlide(index) {
    if (productSlides.has(index)) return productSlides.get(index);
    const product = products[index];
    const newSlide = document.createElement("div");
    newSlide.className = "product-slide";
    if (product.beamConnection) {
      newSlide.classList.add("product-slide--beam");
    }
    
    let detailsHTML = "";
    if (index > 0) {
      detailsHTML = 
        "<section class=\"product-details-panel\" role=\"tabpanel\">" +
        "<h3 class=\"product-title\">" + product.title + "</h3>" +
        "<div class=\"product-stats-grid\">" + renderStatsHTML(product.stats) + "</div>" +
        "</section>";
    }

    newSlide.innerHTML =
      "<section class=\"product-visual-panel\" aria-live=\"polite\">" +
      "<div class=\"product-aura\" aria-hidden=\"true\"></div>" +
      (product.beamConnection ? renderBeamConnectionHTML(product) : "<div class=\"product-image-shell\">" +
      "<img class=\"product-image\" src=\"" + product.image + "\" alt=\"" + product.name + "\">" +
      "<img class=\"product-fallback is-hidden\" src=\"" + product.fallbackImage + "\" alt=\"\">" +
      "</div>") +
      renderBatteryHTML(product.battery) +
      "</section>" +
      detailsHTML;

    const imageEl = newSlide.querySelector(".product-image");
    if (imageEl && !product.beamConnection) {
      imageEl.style.setProperty("--image-scale", String(product.imageScale || 1.3));
      imageEl.style.setProperty("--image-offset-y", "-3%");
    }

    updateAria(newSlide, index);
    productSlides.set(index, newSlide);
    return newSlide;
  }

  function renderProduct(index, options) {
    if (!stageMain || index === activeIndex || !products[index]) return;
    const config = options || {};
    const product = products[index];
    // Read the interrupted presentation once, before cancelling or mutating nodes.
    const previousStyle = currentSlide ? window.getComputedStyle(currentSlide) : null;
    const previousPose = previousStyle
      ? {transform: previousStyle.transform, opacity: previousStyle.opacity}
      : null;
    const cachedTarget = productSlides.get(index);
    const targetStyle = cachedTarget && cachedTarget.isConnected ? window.getComputedStyle(cachedTarget) : null;
    const targetPose = targetStyle ? {transform: targetStyle.transform, opacity: targetStyle.opacity} : null;
    finishProductTransition();
    const previous = currentSlide;
    const newSlide = getProductSlide(index);
    // Commit the target before any animation: every click advances from this state.
    activeIndex = index;
    currentSlide = newSlide;
    if (previous) {
      previous.classList.remove("active");
      previous.classList.add("prev");
      previous.setAttribute("aria-hidden", "true");
      outgoingSlide = previous;
    }
    newSlide.classList.remove("prev");
    newSlide.classList.add("active");
    newSlide.removeAttribute("aria-hidden");
    stageMain.appendChild(newSlide);
    if (stage) {
      stage.style.setProperty("--product-accent-rgb", product.accentRgb);
      stage.style.setProperty("--product-accent-soft-rgb", product.accentSoftRgb);
    }
    if (counterEl) {
      counterEl.textContent = String(index + 1).padStart(2, "0") + " / " + String(products.length).padStart(2, "0");
    }
    if (config.syncUrl && presentationMessaging) {
      presentationMessaging.syncPresentationState({product: product.slug});
    }
    if (prefersReducedMotion() || typeof newSlide.animate !== "function" || document.hidden || document.documentElement.dataset.slideActive === "false") {
      finishProductTransition();
      return;
    }
    const backward = config.direction === "backward";
    const enterTransform = backward ? "translateX(-50%) scale(0.85)" : "translateX(50%) scale(1.15)";
    const exitTransform = backward ? "translateX(50%) scale(1.15)" : "translateX(-50%) scale(0.85)";
    const timing = {duration: PRODUCT_SWITCH_MS, easing: "cubic-bezier(0.65, 0, 0.35, 1)"};
    const enter = newSlide.animate([
      targetPose || {transform: enterTransform, opacity: 0},
      {transform: "translateX(0) scale(1)", opacity: 1}
    ], timing);
    switchAnimations.push(enter);
    if (previous) {
      const exit = previous.animate([
        previousPose,
        {transform: exitTransform, opacity: 0}
      ], timing);
      switchAnimations.push(exit);
    }
    enter.onfinish = finishProductTransition;
  }

  function animateProductSwitch(index, direction, options) {
    renderProduct(index, Object.assign({}, options, {direction: direction}));
  }

  window.addEventListener("slideActivityChange", function (event) {
    if (!event.detail.active) finishProductTransition();
    else if (activeIndex >= 0 && presentationMessaging) {
      presentationMessaging.syncPresentationState({product: products[activeIndex].slug});
    }
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) finishProductTransition();
  });
  window.addEventListener("pagehide", finishProductTransition);

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
