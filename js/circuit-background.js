(function () {
  const themeColor = '0, 255, 204'; // Neon Cyan

  class DataCluster {
    constructor(width, height) {
      this.canvasW = width;
      this.canvasH = height;
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.width = Math.random() * 60 + 20;
      this.height = Math.random() * 40 + 20;
      this.opacity = Math.random() * 0.3;
      this.lines = [];
      
      let linesCount = Math.floor(Math.random() * 5) + 3;
      for (let i = 0; i < linesCount; i++) {
        this.lines.push({
          yOff: Math.random() * this.height,
          width: Math.random() * this.width,
          xOff: Math.random() * 10
        });
      }
    }

    draw(ctx) {
      if (Math.random() < 0.05) {
        this.opacity = Math.random() * 0.4;
      }
      ctx.save();
      ctx.fillStyle = `rgba(${themeColor}, ${this.opacity})`;
      ctx.shadowBlur = 5;
      ctx.shadowColor = `rgba(${themeColor}, 0.5)`;

      this.lines.forEach(line => {
        ctx.fillRect(this.x + line.xOff, this.y + line.yOff, line.width, 2);
      });
      ctx.restore();
    }

    update(ctx) {
      this.x -= 0.2;
      if (this.x < -100) this.x = this.canvasW + 50;
      this.draw(ctx);
    }
  }

  class Node {
    constructor(width, height) {
      this.canvasW = width;
      this.canvasH = height;
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 1.5;
      this.vy = (Math.random() - 0.5) * 1.5;
      this.radius = Math.random() * 2 + 1;
      this.label = (Math.random() * 99).toFixed(2);
    }

    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${themeColor}, 0.8)`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `rgba(${themeColor}, 1)`;
      ctx.fill();

      ctx.font = "10px Courier New";
      ctx.fillStyle = `rgba(${themeColor}, 0.5)`;
      ctx.shadowBlur = 0;
      ctx.fillText(this.label, this.x + 6, this.y - 6);
      ctx.closePath();
    }

    update(ctx, mouse) {
      if (this.x > this.canvasW || this.x < 0) this.vx = -this.vx;
      if (this.y > this.canvasH || this.y < 0) this.vy = -this.vy;

      this.x += this.vx;
      this.y += this.vy;

      if (mouse.x != null && mouse.y != null) {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (mouse.radius - distance) / mouse.radius;
          
          this.x += forceDirectionX * force * 1.5;
          this.y += forceDirectionY * force * 1.5;
        }
      }

      this.draw(ctx);
    }
  }

  function CyberpunkBackground(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.mouse = { x: null, y: null, radius: 180 };
    this.particles = [];
    this.dataClusters = [];
    
    this.resize = this.resize.bind(this);
    this.tick = this.tick.bind(this);
    
    this.bindEvents();
    this.resize();
    this.initScene();
    
    requestAnimationFrame(this.tick);
  }

  CyberpunkBackground.prototype.bindEvents = function () {
    window.addEventListener("resize", this.resize);
    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    window.addEventListener("mouseout", () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });
  };

  CyberpunkBackground.prototype.resize = function () {
    const ratio = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    this.canvas.style.width = this.width + "px";
    this.canvas.style.height = this.height + "px";
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.initScene();
  };

  CyberpunkBackground.prototype.initScene = function () {
    this.particles = [];
    this.dataClusters = [];

    let clusterCount = Math.floor(((this.width * this.height) / 30000) * 0.7);
    for (let i = 0; i < clusterCount; i++) {
      this.dataClusters.push(new DataCluster(this.width, this.height));
    }

    let nodeCount = Math.floor(((this.width * this.height) / 12000) * 0.7);
    nodeCount = Math.max(28, Math.min(nodeCount, 105));
    for (let i = 0; i < nodeCount; i++) {
      this.particles.push(new Node(this.width, this.height));
    }
  };

  CyberpunkBackground.prototype.connectParticles = function () {
    const ctx = this.ctx;
    const particles = this.particles;
    const mouse = this.mouse;

    for (let a = 0; a < particles.length; a++) {
      for (let b = a; b < particles.length; b++) {
        let dx = particles[a].x - particles[b].x;
        let dy = particles[a].y - particles[b].y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 120) {
          let opacity = 1 - (distance / 120);

          if (mouse.x != null) {
            let distToMouseA = Math.hypot(mouse.x - particles[a].x, mouse.y - particles[a].y);
            let distToMouseB = Math.hypot(mouse.x - particles[b].x, mouse.y - particles[b].y);
            if (distToMouseA < mouse.radius && distToMouseB < mouse.radius) {
              opacity += 0.5;
              ctx.lineWidth = 1.5;
            } else {
              ctx.lineWidth = 0.5;
            }
          } else {
            ctx.lineWidth = 0.5;
          }

          ctx.strokeStyle = `rgba(${themeColor}, ${opacity * 0.8})`;
          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(particles[b].x, particles[b].y);

          ctx.shadowBlur = 5;
          ctx.shadowColor = `rgba(${themeColor}, ${opacity})`;

          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      if (mouse.x != null && mouse.y != null) {
        let dx = particles[a].x - mouse.x;
        let dy = particles[a].y - mouse.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
          let opacity = 1 - (distance / mouse.radius);
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.5})`;
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }
  };

  CyberpunkBackground.prototype.tick = function () {
    requestAnimationFrame(this.tick);
    
    // 拖尾残影效果
    this.ctx.fillStyle = 'rgba(2, 8, 10, 0.5)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.dataClusters.forEach(cluster => cluster.update(this.ctx));
    this.connectParticles();
    this.particles.forEach(particle => particle.update(this.ctx, this.mouse));
  };

  document.querySelectorAll("[data-circuit-bg]").forEach((canvas) => {
    new CyberpunkBackground(canvas);
  });
}());
