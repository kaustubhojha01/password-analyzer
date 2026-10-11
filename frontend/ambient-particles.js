/**
 * ============================================================================
 * CYBER PASSWORD ANALYZER - 4K 3D AMBIENT PARTICLE ENGINE
 * ============================================================================
 * Premium, high-definition 3D particle system featuring:
 *  - 3 distinct spatial depth planes (Foreground Bokeh, Midground Cyber Nodes,
 *    and Deep Atmospheric Stardust).
 *  - High-DPI / 4K native canvas scaling for razor-sharp rendering.
 *  - Pre-rendered offscreen sprite caching for 60fps/120fps GPU performance.
 *  - Organic clustering around the rotating 3D cyber rings + whole-page drift.
 *  - Smooth stereoscopic 3D parallax on mouse move.
 *  - Automatic power-saving pause when off-screen or tab is hidden.
 * ============================================================================
 */

(function () {
  'use strict';

  // Configuration
  const CONFIG = {
    particleCountDesktop: 220,
    particleCountMobile: 110,
    palette: {
      cyan:       'rgba(0, 240, 255, ',
      iceBlue:    'rgba(67, 139, 255, ',
      brightBlue: 'rgba(30, 140, 255, ',
      magenta:    'rgba(235, 45, 185, ',
      purple:     'rgba(152, 91, 255, ',
      white:      'rgba(240, 248, 255, '
    }
  };

  class Ambient3DParticleField {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: true });
      if (!this.ctx) return;

      this.width = 0;
      this.height = 0;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      this.particles = [];
      this.sprites = {};

      // Parallax mouse tracking
      this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
      this.animId = null;
      this.isRunning = false;
      this.lastTime = 0;

      this._initSprites();
      this._bindEvents();
      this.resize();
      this._createParticles();
      this.start();
    }

    /* ─── Pre-rendered Sprite Cache for 4K Performance ─── */
    _initSprites() {
      const makeSprite = (size, drawFn) => {
        const off = document.createElement('canvas');
        off.width = size;
        off.height = size;
        const octx = off.getContext('2d');
        drawFn(octx, size / 2, size / 2, size / 2);
        return off;
      };

      // 1. Soft Foreground Bokeh Discs (Cyan & Magenta)
      this.sprites.bokehCyan = makeSprite(96, (ctx, cx, cy, r) => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, 'rgba(0, 240, 255, 0.45)');
        g.addColorStop(0.35, 'rgba(0, 240, 255, 0.22)');
        g.addColorStop(0.7, 'rgba(67, 139, 255, 0.08)');
        g.addColorStop(1, 'rgba(0, 240, 255, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      });

      this.sprites.bokehMagenta = makeSprite(96, (ctx, cx, cy, r) => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, 'rgba(235, 45, 185, 0.40)');
        g.addColorStop(0.35, 'rgba(152, 91, 255, 0.20)');
        g.addColorStop(0.7, 'rgba(152, 91, 255, 0.06)');
        g.addColorStop(1, 'rgba(152, 91, 255, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Glowing Sharp Midground Nodes (Cyan & Electric Blue)
      this.sprites.nodeCyan = makeSprite(36, (ctx, cx, cy, r) => {
        const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, r);
        g.addColorStop(0, 'rgba(255, 255, 255, 1)');
        g.addColorStop(0.2, 'rgba(0, 240, 255, 0.95)');
        g.addColorStop(0.5, 'rgba(0, 240, 255, 0.35)');
        g.addColorStop(1, 'rgba(0, 240, 255, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      });

      this.sprites.nodePurple = makeSprite(36, (ctx, cx, cy, r) => {
        const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, r);
        g.addColorStop(0, 'rgba(255, 255, 255, 1)');
        g.addColorStop(0.2, 'rgba(195, 95, 255, 0.95)');
        g.addColorStop(0.5, 'rgba(152, 91, 255, 0.35)');
        g.addColorStop(1, 'rgba(152, 91, 255, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Crisp Micro Stardust Dot
      this.sprites.stardust = makeSprite(16, (ctx, cx, cy, r) => {
        const g = ctx.createRadialGradient(cx, cy, 0.5, cx, cy, r);
        g.addColorStop(0, 'rgba(240, 248, 255, 1)');
        g.addColorStop(0.4, 'rgba(0, 240, 255, 0.6)');
        g.addColorStop(1, 'rgba(0, 240, 255, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    _createParticles() {
      const isMobile = this.width < 768;
      const count = isMobile ? CONFIG.particleCountMobile : CONFIG.particleCountDesktop;
      this.particles = [];

      for (let i = 0; i < count; i++) {
        // Depth: 0.0 (deep distance) to 1.0 (near camera)
        const z = Math.random();

        // 65% spawn in the cluster around the right-side ring orbit; 35% disperse whole-page
        const inOrbitCluster = Math.random() < 0.65;
        let x, y;

        if (inOrbitCluster) {
          // Centered around the rings (right side: 55% to 105% width)
          const angle = Math.random() * Math.PI * 2;
          const radius = (Math.random() * 0.42 + 0.08) * Math.min(this.width, this.height);
          const ringCenterX = this.width * 0.78;
          const ringCenterY = this.height * 0.50;
          x = ringCenterX + Math.cos(angle) * radius * 1.15;
          y = ringCenterY + Math.sin(angle) * radius * 0.85;
        } else {
          // Spread across whole screen
          x = Math.random() * this.width;
          y = Math.random() * this.height;
        }

        // Particle tier based on depth
        let type, sprite, baseSize;
        if (z > 0.72) {
          // Foreground Bokeh Orb
          type = 'bokeh';
          sprite = Math.random() < 0.6 ? this.sprites.bokehCyan : this.sprites.bokehMagenta;
          baseSize = 20 + Math.random() * 32;
        } else if (z > 0.35) {
          // Midground Cyber Node
          type = 'node';
          sprite = Math.random() < 0.7 ? this.sprites.nodeCyan : this.sprites.nodePurple;
          baseSize = 6 + Math.random() * 9;
        } else {
          // Deep Background Stardust
          type = 'star';
          sprite = this.sprites.stardust;
          baseSize = 3 + Math.random() * 4.5;
        }

        this.particles.push({
          x: x,
          y: y,
          baseX: x,
          baseY: y,
          z: z,
          type: type,
          sprite: sprite,
          size: baseSize,
          vx: (Math.random() - 0.48) * (0.2 + z * 0.35),
          vy: (Math.random() - 0.52) * (0.15 + z * 0.3),
          alpha: 0.4 + Math.random() * 0.6,
          twinkleSpeed: 0.8 + Math.random() * 2.2,
          phase: Math.random() * Math.PI * 2,
          floatAmp: 6 + Math.random() * 16,
          floatFreq: 0.0008 + Math.random() * 0.0012
        });
      }
    }

    _bindEvents() {
      window.addEventListener('resize', () => this.resize(), { passive: true });

      window.addEventListener('mousemove', (e) => {
        // Normalized cursor offset (-1 to 1)
        this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
        this.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });

      // Pause rendering when tab is hidden to save GPU/battery
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.stop();
        } else {
          this.start();
        }
      });
    }

    resize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;

      this.canvas.width = Math.floor(this.width * this.dpr);
      this.canvas.height = Math.floor(this.height * this.dpr);
      this.canvas.style.width = this.width + 'px';
      this.canvas.style.height = this.height + 'px';

      this.ctx.scale(this.dpr, this.dpr);

      if (this.particles.length > 0) {
        // Re-adjust out of bound particles
        for (const p of this.particles) {
          if (p.x > this.width + 50) p.x = Math.random() * this.width;
          if (p.y > this.height + 50) p.y = Math.random() * this.height;
        }
      }
    }

    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      this.lastTime = performance.now();
      const loop = (now) => {
        if (!this.isRunning) return;
        this._update(now);
        this._render(now);
        this.animId = requestAnimationFrame(loop);
      };
      this.animId = requestAnimationFrame(loop);
    }

    stop() {
      this.isRunning = false;
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
    }

    _update(now) {
      // Smooth mouse lerp for 3D parallax
      this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.04;
      this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.04;

      const w = this.width;
      const h = this.height;

      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];

        // Natural spatial drift
        p.x += p.vx;
        p.y += p.vy;

        // Subtle 3D harmonic floating oscillation
        const floatY = Math.sin(now * p.floatFreq + p.phase) * p.floatAmp * 0.02;
        p.y += floatY;

        // Wrap boundaries seamlessly with buffer
        const buf = 60;
        if (p.x < -buf) p.x = w + buf;
        else if (p.x > w + buf) p.x = -buf;

        if (p.y < -buf) p.y = h + buf;
        else if (p.y > h + buf) p.y = -buf;
      }
    }

    _render(now) {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);

      ctx.globalCompositeOperation = 'lighter';

      const mx = this.mouse.x;
      const my = this.mouse.y;

      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];

        // 3D stereoscopic parallax offset based on depth (z)
        // Foreground particles shift up to 35px, background particles shift only 4px
        const parallaxX = mx * (p.z * 32 + 4);
        const parallaxY = my * (p.z * 24 + 3);

        const drawX = p.x + parallaxX;
        const drawY = p.y + parallaxY;

        // Subtle pulsing twinkle
        const twinkle = 0.75 + Math.sin(now * 0.002 * p.twinkleSpeed + p.phase) * 0.25;
        const alpha = Math.max(0, Math.min(1, p.alpha * twinkle));

        ctx.globalAlpha = alpha;

        const size = p.size;
        ctx.drawImage(
          p.sprite,
          drawX - size / 2,
          drawY - size / 2,
          size,
          size
        );
      }

      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';
    }

    destroy() {
      this.stop();
      this.particles = [];
    }
  }

  // Auto-init on DOM ready
  function init() {
    const canvas = document.getElementById('ambient3DParticleCanvas');
    if (!canvas) return;

    if (window.ambient3DParticlesInstance) {
      window.ambient3DParticlesInstance.destroy();
    }
    window.ambient3DParticlesInstance = new Ambient3DParticleField(canvas);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.Ambient3DParticleField = Ambient3DParticleField;
})();
