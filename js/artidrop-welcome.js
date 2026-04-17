(function () {
  const canvas = document.getElementById("spaceCanvas");
  const contentLayer = document.getElementById("content-layer");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const parallaxDurationMs = 1200;
  const entryHref = document.documentElement.dataset.enterHref || "pages/slide-opening.html";

  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  let width = 0;
  let height = 0;
  let mouseX = 0;
  let mouseY = 0;
  let stars = [];
  let rafId = 0;
  let isEntering = false;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function createStars() {
    const total = Math.max(90, Math.floor((width * height) / 2600));
    stars = [];

    for (let index = 0; index < total; index += 1) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.35,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 1) * 0.45,
        alpha: Math.random(),
        delta: (Math.random() * 0.02) + 0.004,
        color: Math.random() > 0.78 ? "#70f0ff" : "#ffffff"
      });
    }
  }

  function drawNebula(time) {
    ctx.globalCompositeOperation = "screen";

    const firstGlow = ctx.createRadialGradient(
      width * 0.28 + Math.sin(time) * 100,
      height * 0.38 + Math.cos(time) * 100,
      40,
      width * 0.28 + Math.sin(time) * 100,
      height * 0.38 + Math.cos(time) * 100,
      360
    );
    firstGlow.addColorStop(0, "rgba(41, 78, 134, 0.32)");
    firstGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = firstGlow;
    ctx.fillRect(0, 0, width, height);

    const secondGlow = ctx.createRadialGradient(
      width * 0.72 + Math.cos(time) * 90,
      height * 0.68 + Math.sin(time) * 90,
      50,
      width * 0.72 + Math.cos(time) * 90,
      height * 0.68 + Math.sin(time) * 90,
      280
    );
    secondGlow.addColorStop(0, "rgba(16, 125, 165, 0.22)");
    secondGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = secondGlow;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "source-over";
  }

  function drawStars() {
    stars.forEach(function (star) {
      star.x += star.vx;
      star.y += star.vy;
      star.alpha += star.delta;

      if (star.alpha > 1) {
        star.alpha = 1;
        star.delta *= -1;
      } else if (star.alpha < 0) {
        star.alpha = 0;
        star.delta *= -1;
      }

      if (star.y < 0) {
        star.y = height;
      }

      if (star.x < 0) {
        star.x = width;
      }

      if (star.x > width) {
        star.x = 0;
      }

      ctx.beginPath();
      ctx.arc(
        star.x - mouseX * (star.radius * 0.45),
        star.y - mouseY * (star.radius * 0.45),
        star.radius,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = star.color;
      ctx.globalAlpha = Math.max(0, star.alpha);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    drawNebula(Date.now() * 0.00045);
    drawStars();
    rafId = window.requestAnimationFrame(animate);
  }

  function goToPresentation() {
    window.location.href = entryHref;
  }

  function enterPresentation() {
    if (isEntering) {
      return;
    }

    isEntering = true;
    window.cancelAnimationFrame(rafId);

    if (prefersReducedMotion) {
      document.body.classList.add("mode-parallax");
      document.body.classList.add("mode-entered");
      goToPresentation();
      return;
    }

    document.body.classList.add("mode-parallax");
    if (contentLayer) {
      contentLayer.setAttribute("aria-hidden", "true");
    }
    window.setTimeout(function () {
      document.body.classList.add("mode-entered");
      goToPresentation();
    }, parallaxDurationMs);
  }

  resize();
  createStars();
  animate();

  window.addEventListener("resize", function () {
    resize();
    createStars();
  });

  window.addEventListener("mousemove", function (event) {
    mouseX = (event.clientX - width / 2) * 0.04;
    mouseY = (event.clientY - height / 2) * 0.04;
  });

  window.addEventListener("pointerdown", enterPresentation, { once: true });
  window.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      enterPresentation();
    }
  });

  window.addEventListener("pagehide", function () {
    window.cancelAnimationFrame(rafId);
  });
}());
