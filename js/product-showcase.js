(function () {
  const products = [
    {
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
  let activeIndex = 0;

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
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
      button.setAttribute("tabindex", isActive ? "0" : "-1");
    });
  }

  function renderProduct(index) {
    const product = products[index];
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
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      renderProduct(Number(button.dataset.productIndex));
    });
  });

  switcher.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }

    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (activeIndex + step + products.length) % products.length;
    buttons[nextIndex].focus();
    renderProduct(nextIndex);
  });

  renderProduct(0);
}());
