(function () {
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
      imageScale: 1.3,
      imageOffsetY: "20%",
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
        { label: "Enclosure", value: "IP-65 weatherproof option" },
        { label: "Communication", value: "Mesh topology" },
        { label: "Power Source", value: "Lithium battery" }
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

  const stage = document.getElementById("product-stage");
  const imageShell = document.getElementById("product-image-shell");
  const imageEl = document.getElementById("product-image");
  const fallbackEl = document.getElementById("product-fallback");
  const titleEl = document.getElementById("product-title");
  const statsEl = document.getElementById("product-stats");
  const buttons = Array.from(document.querySelectorAll(".product-switch-btn"));
  const switcher = document.getElementById("product-switcher");
  const detailsPanel = document.getElementById("product-details-panel");
  const presentationMessaging = window.meshPresentationMessaging || null;
  let activeIndex = 0;

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

  function renderStats(stats) {
    statsEl.innerHTML = stats
      .map((item) => (
        "<article class=\"product-stat-card\">" +
          "<p class=\"product-stat-label\">" + item.label + "</p>" +
          "<p class=\"product-stat-value\">" + item.value + "</p>" +
        "</article>"
      ))
      .join("");
  }

  function activateButton(index) {
    buttons.forEach((button, buttonIndex) => {
      const isActive = buttonIndex === index;
      const tabId = "product-tab-" + buttonIndex;
      button.classList.toggle("is-active", isActive);
      button.id = tabId;
      button.setAttribute("aria-controls", "product-details-panel");
      button.setAttribute("aria-selected", String(isActive));
      button.setAttribute("tabindex", isActive ? "0" : "-1");
    });

    if (detailsPanel) {
      detailsPanel.setAttribute("aria-labelledby", "product-tab-" + index);
    }
  }

  function renderProduct(index, options) {
    const product = products[index];
    const config = options || {};
    activeIndex = index;

    stage.style.setProperty("--product-accent-rgb", product.accentRgb);
    stage.style.setProperty("--product-accent-soft-rgb", product.accentSoftRgb);
    stage.classList.toggle("is-title-nowrap", Boolean(product.titleNoWrap));
    titleEl.textContent = product.title;
    imageEl.style.setProperty("--image-scale", String(product.imageScale || 1));
    imageEl.style.setProperty("--image-offset-y", product.imageOffsetY || "0%");
    fallbackEl.style.setProperty("--image-scale", "1");
    fallbackEl.style.setProperty("--image-offset-y", "0%");
    renderStats(product.stats);
    activateButton(index);

    imageEl.classList.remove("is-hidden");
    fallbackEl.classList.add("is-hidden");
    fallbackEl.src = product.fallbackImage;
    fallbackEl.alt = product.name + " icon";
    imageShell.classList.remove("is-fallback");

    imageEl.onerror = function () {
      imageEl.classList.add("is-hidden");
      fallbackEl.classList.remove("is-hidden");
      imageShell.classList.add("is-fallback");
    };
    imageEl.onload = function () {
      imageEl.classList.remove("is-hidden");
      fallbackEl.classList.add("is-hidden");
      imageShell.classList.remove("is-fallback");
    };
    imageEl.src = product.image;
    imageEl.alt = product.name;

    if (config.syncUrl && presentationMessaging && typeof presentationMessaging.syncPresentationState === "function") {
      presentationMessaging.syncPresentationState({
        product: product.slug
      });
    }
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      renderProduct(Number(button.dataset.productIndex), { syncUrl: true });
    });
  });

  switcher.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") {
      return;
    }

    event.preventDefault();

    let nextIndex = activeIndex;
    if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = products.length - 1;
    } else {
      const step = event.key === "ArrowRight" ? 1 : -1;
      nextIndex = (activeIndex + step + products.length) % products.length;
    }

    buttons[nextIndex].focus();
    renderProduct(nextIndex, { syncUrl: true });
  });

  renderProduct(getInitialProductIndex(), { syncUrl: false });
}());
