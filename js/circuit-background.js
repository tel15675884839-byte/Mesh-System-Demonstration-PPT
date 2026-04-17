(function () {
  function StageStarBackground(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = 0;
    this.height = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.stars = [];
    this.frameId = 0;
    this.isVisible = true;

    if (!this.ctx) {
      return;
    }

    this.resize = this.resize.bind(this);
    this.tick = this.tick.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);

    this.resize();
    this.createStars();
    this.frameId = window.requestAnimationFrame(this.tick);

    window.addEventListener("resize", this.resize);
    window.addEventListener("mousemove", this.handleMouseMove);
    if (document && typeof document.addEventListener === "function") {
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
    }
    window.addEventListener("pagehide", () => {
      if (this.frameId) {
        window.cancelAnimationFrame(this.frameId);
        this.frameId = 0;
      }
    });
  }

  StageStarBackground.prototype.resize = function () {
    const ratio = window.devicePixelRatio || 1;
    this.width = this.canvas.clientWidth || 1920;
    this.height = this.canvas.clientHeight || 1080;
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.createStars();
  };

  StageStarBackground.prototype.createStars = function () {
    const total = Math.max(90, Math.floor((this.width * this.height) / 2600));
    this.stars = [];

    for (let index = 0; index < total; index += 1) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 1.5 + 0.35,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 1) * 0.45,
        alpha: Math.random(),
        delta: (Math.random() * 0.02) + 0.004,
        color: Math.random() > 0.78 ? "#70f0ff" : "#ffffff"
      });
    }
  };

  StageStarBackground.prototype.handleMouseMove = function (event) {
    this.mouseX = (event.clientX - window.innerWidth / 2) * 0.04;
    this.mouseY = (event.clientY - window.innerHeight / 2) * 0.04;
  };

  StageStarBackground.prototype.handleVisibilityChange = function () {
    this.isVisible = !document.hidden;
    if (this.isVisible && !this.frameId) {
      this.frameId = window.requestAnimationFrame(this.tick);
    }
  };

  StageStarBackground.prototype.drawNebula = function (time) {
    const ctx = this.ctx;
    const width = this.width;
    const height = this.height;

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
  };

  StageStarBackground.prototype.drawStars = function () {
    const ctx = this.ctx;
    const width = this.width;
    const height = this.height;

    this.stars.forEach((star) => {
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
        star.x - this.mouseX * (star.radius * 0.45),
        star.y - this.mouseY * (star.radius * 0.45),
        star.radius,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = star.color;
      ctx.globalAlpha = Math.max(0, star.alpha);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
  };

  StageStarBackground.prototype.tick = function () {
    this.frameId = 0;
    if (!this.isVisible || typeof this.ctx.clearRect !== "function") {
      return;
    }

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawNebula(Date.now() * 0.00045);
    this.drawStars();

    this.frameId = window.requestAnimationFrame(this.tick);
  };

  document.querySelectorAll("[data-circuit-bg]").forEach((canvas) => {
    new StageStarBackground(canvas);
  });
}());
