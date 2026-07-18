/* ═══════════════════════════════════════════════════════════════
   SPATIAL COMPUTING PORTFOLIO — APP.JS
   Muhammad Zargham Abbas — "Entering the Tech Future"
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── HELPERS ─────────────────────────────────────────────── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ── DOM REFS ────────────────────────────────────────────── */
  const loader      = $('#loader');
  const loaderCircle= $('#loader-circle');
  const loaderGreet = $('#loader-greeting');
  const loaderName  = $('#loader-name');
  const loaderBar   = $('#loader-progress');
  const mainContent = $('#main-content');
  const cursorDot   = $('#cursor-dot');
  const cursorRing  = $('#cursor-ring');
  const canvas      = $('#ambient-canvas');
  const tiltCard    = $('#tilt-card');
  const tiltAura    = $('#tilt-aura');
  const tiltSheen   = $('#tilt-sheen');
  const nav         = $('#main-nav');

  /* ═══════════════════════════════════════════════════════════
     1. INTRO LOADER — SMOOTH DECRYPT
     ═══════════════════════════════════════════════════════════ */
  const FINAL_NAME = 'MUHAMMAD ZARGHAM ABBAS';
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const DURATION = 3000;

  function runLoader() {
    const len = FINAL_NAME.length;
    const lockTimes = [];

    for (let i = 0; i < len; i++) {
      lockTimes.push(
        DURATION * 0.15 + DURATION * 0.75 * (i / (len - 1)) + Math.random() * 80
      );
    }

    const phases = [
      { at: 0,    text: 'Initializing' },
      { at: 0.25, text: 'Decrypting Identity' },
      { at: 0.55, text: 'Loading Portfolio' },
      { at: 0.85, text: 'Welcome' },
    ];
    let phaseIdx = 0;

    const start = performance.now();
    const revealed = new Array(len).fill(false);
    const totalDash = 339.292;

    function frame(now) {
      const elapsed = now - start;
      const p = Math.min(elapsed / DURATION, 1);

      // Progress bar
      loaderBar.style.width = `${p * 100}%`;

      // SVG ring fill
      loaderCircle.setAttribute('stroke-dashoffset', String(totalDash * (1 - p)));

      // Phase greeting
      while (phaseIdx < phases.length - 1 && p >= phases[phaseIdx + 1].at) {
        phaseIdx++;
      }
      loaderGreet.textContent = phases[phaseIdx].text;

      // Name decrypt
      let display = '';
      for (let i = 0; i < len; i++) {
        if (FINAL_NAME[i] === ' ') { display += ' '; continue; }
        if (elapsed >= lockTimes[i]) revealed[i] = true;
        display += revealed[i]
          ? FINAL_NAME[i]
          : CHARS[Math.floor(Math.random() * CHARS.length)];
      }
      loaderName.textContent = display;

      if (p < 1) {
        requestAnimationFrame(frame);
      } else {
        loaderName.textContent = FINAL_NAME;
        setTimeout(revealSite, 500);
      }
    }

    requestAnimationFrame(frame);
  }

  function revealSite() {
    loader.classList.add('is-done');
    mainContent.style.opacity = '1';
    mainContent.style.visibility = 'visible';
    mainContent.style.transition = 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1)';
    startCounters();
    animateProgressBars();
  }

  /* ═══════════════════════════════════════════════════════════
     2. CUSTOM CURSOR
     ═══════════════════════════════════════════════════════════ */
  let mx = 0, my = 0;
  let dx = 0, dy = 0;
  let rx = 0, ry = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  });

  function tickCursor() {
    dx = lerp(dx, mx, 0.2);
    dy = lerp(dy, my, 0.2);
    rx = lerp(rx, mx, 0.1);
    ry = lerp(ry, my, 0.1);

    cursorDot.style.left = `${dx}px`;
    cursorDot.style.top  = `${dy}px`;
    cursorRing.style.left = `${rx}px`;
    cursorRing.style.top  = `${ry}px`;

    requestAnimationFrame(tickCursor);
  }
  requestAnimationFrame(tickCursor);

  // Hover states
  const HOVER_SEL = 'a, button, .magnetic-el, .glass-panel, .tilt-card, .lab__node, .connect__card';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(HOVER_SEL)) {
      cursorDot.classList.add('is-hover');
      cursorRing.classList.add('is-hover');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(HOVER_SEL)) {
      cursorDot.classList.remove('is-hover');
      cursorRing.classList.remove('is-hover');
    }
  });

  /* ═══════════════════════════════════════════════════════════
     3. MAGNETIC ELEMENTS
     ═══════════════════════════════════════════════════════════ */
  $$('.magnetic-el').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const moveX = (e.clientX - cx) * 0.2;
      const moveY = (e.clientY - cy) * 0.2;
      el.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
      el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(() => { el.style.transition = ''; }, 500);
    });
  });

  /* ═══════════════════════════════════════════════════════════
     4. AMBIENT BACKGROUND (Canvas Orbs)
     ═══════════════════════════════════════════════════════════ */
  const ctx = canvas.getContext('2d');
  let cw, ch;
  let ambientMx = 0, ambientMy = 0;

  function resizeCanvas() {
    cw = canvas.width = window.innerWidth;
    ch = canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  document.addEventListener('mousemove', (e) => {
    ambientMx = e.clientX;
    ambientMy = e.clientY;
  });

  class Orb {
    constructor(color, radius) {
      this.color = color;
      this.x = Math.random() * cw;
      this.y = Math.random() * ch;
      this.r = radius;
      this.vx = (Math.random() - 0.5) * 0.2;
      this.vy = (Math.random() - 0.5) * 0.2;
      this.baseOpacity = 0.035 + Math.random() * 0.035;
    }
    update() {
      const ddx = ambientMx - this.x;
      const ddy = ambientMy - this.y;
      this.x += this.vx + ddx * 0.0005;
      this.y += this.vy + ddy * 0.0005;
      // wrap
      if (this.x < -this.r) this.x = cw + this.r;
      if (this.x > cw + this.r) this.x = -this.r;
      if (this.y < -this.r) this.y = ch + this.r;
      if (this.y > ch + this.r) this.y = -this.r;
    }
    draw() {
      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
      g.addColorStop(0, this.color.replace('__A__', String(this.baseOpacity)));
      g.addColorStop(1, this.color.replace('__A__', '0'));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const orbs = [
    new Orb('rgba(0, 229, 255, __A__)', 220),
    new Orb('rgba(0, 229, 255, __A__)', 180),
    new Orb('rgba(168, 85, 247, __A__)', 250),
    new Orb('rgba(168, 85, 247, __A__)', 200),
    new Orb('rgba(100, 180, 255, __A__)', 160),
    new Orb('rgba(200, 120, 255, __A__)', 190),
    new Orb('rgba(0, 200, 200, __A__)', 140),
  ];

  function renderOrbs() {
    ctx.clearRect(0, 0, cw, ch);
    for (const o of orbs) {
      o.update();
      o.draw();
    }
    requestAnimationFrame(renderOrbs);
  }
  renderOrbs();

  /* ═══════════════════════════════════════════════════════════
     5. 3D TILT CARD — PROFILE IMAGE
     ═══════════════════════════════════════════════════════════ */
  if (tiltCard) {
    const MAX_TILT = 14;

    tiltCard.addEventListener('mousemove', (e) => {
      const rect = tiltCard.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hw = rect.width / 2;
      const hh = rect.height / 2;

      const nx = (x - hw) / hw;  // –1 → +1
      const ny = (y - hh) / hh;

      const rotX = -ny * MAX_TILT;
      const rotY =  nx * MAX_TILT;

      tiltCard.style.transform =
        `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.03, 1.03, 1.03)`;

      // Dynamic aura
      if (tiltAura) {
        const pctX = (x / rect.width * 100);
        const pctY = (y / rect.height * 100);
        tiltAura.style.background =
          `radial-gradient(circle at ${pctX}% ${pctY}%, rgba(0,229,255,0.3), rgba(168,85,247,0.15) 50%, transparent 80%)`;
        tiltAura.style.opacity = '1';
      }

      // Sheen highlight
      if (tiltSheen) {
        const sheenX = (x / rect.width * 100);
        const sheenY = (y / rect.height * 100);
        tiltSheen.style.background =
          `radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(255,255,255,0.08), transparent 60%)`;
        tiltSheen.style.opacity = '1';
      }
    });

    tiltCard.addEventListener('mouseleave', () => {
      tiltCard.style.transition = 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
      tiltCard.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      if (tiltAura) tiltAura.style.opacity = '0';
      if (tiltSheen) tiltSheen.style.opacity = '0';
    });

    tiltCard.addEventListener('mouseenter', () => {
      tiltCard.style.transition = 'none';
    });
  }

  /* ═══════════════════════════════════════════════════════════
     6. SCROLL REVEAL — INTERSECTION OBSERVER
     ═══════════════════════════════════════════════════════════ */
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );
  $$('.reveal').forEach((el) => revealObs.observe(el));

  /* ═══════════════════════════════════════════════════════════
     7. HERO COUNTERS
     ═══════════════════════════════════════════════════════════ */
  function startCounters() {
    $$('.counter').forEach((el) => {
      const target = parseInt(el.dataset.target, 10);
      if (isNaN(target)) return;
      const duration = 2200;
      const start = performance.now();
      function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 4); // ease out quart
        el.textContent = Math.round(target * ease);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  /* ═══════════════════════════════════════════════════════════
     8. PROGRESS BAR ANIMATION (Lab Nodes)
     ═══════════════════════════════════════════════════════════ */
  function animateProgressBars() {
    const barObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const fill = entry.target.querySelector('.lab__node-bar-fill');
            if (fill) {
              // Force reflow then set width
              fill.style.width = '0%';
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  fill.style.width = fill.style.getPropertyValue('--fill');
                });
              });
            }
            barObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    $$('.lab__node').forEach((node) => barObs.observe(node));
  }

  /* ═══════════════════════════════════════════════════════════
     9. NAV — HIDE ON SCROLL DOWN, SHOW ON SCROLL UP
     ═══════════════════════════════════════════════════════════ */
  let lastScrollY = 0;
  let scrollTicking = false;

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        if (currentY > lastScrollY && currentY > 120) {
          nav.classList.add('is-hidden');
        } else {
          nav.classList.remove('is-hidden');
        }
        lastScrollY = currentY;
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  /* ═══════════════════════════════════════════════════════════
     10. SMOOTH SCROLL FOR ANCHOR LINKS
     ═══════════════════════════════════════════════════════════ */
  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = $(anchor.getAttribute('href'));
      if (target) {
        const offset = 80; // account for fixed nav
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ═══════════════════════════════════════════════════════════
     11. HERO TEXT PARALLAX ON MOUSE
     ═══════════════════════════════════════════════════════════ */
  const heroContent = $('.hero__content');
  if (heroContent) {
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 6;
      const y = (e.clientY / window.innerHeight - 0.5) * 6;
      heroContent.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

  /* ═══════════════════════════════════════════════════════════
     12. LAB NODE HOVER GLOW INTENSIFY
     ═══════════════════════════════════════════════════════════ */
  $$('.lab__node').forEach((node) => {
    node.addEventListener('mouseenter', () => {
      const glow = node.querySelector('.lab__node-glow');
      if (glow) glow.style.opacity = '0.12';
    });
    node.addEventListener('mouseleave', () => {
      const glow = node.querySelector('.lab__node-glow');
      if (glow) glow.style.opacity = '';
    });
  });

  /* ═══════════════════════════════════════════════════════════
     13. VISION MILESTONE DOT GLOW ON SCROLL
     ═══════════════════════════════════════════════════════════ */
  const milestoneObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const dot = entry.target.querySelector('.vision__milestone-dot');
        if (!dot) return;
        if (entry.isIntersecting) {
          dot.style.borderColor = '#00e5ff';
          dot.style.boxShadow = '0 0 16px rgba(0, 229, 255, 0.3)';
          dot.style.background = 'rgba(0, 229, 255, 0.15)';
        }
      });
    },
    { threshold: 0.5 }
  );
  $$('.vision__milestone').forEach((m) => milestoneObs.observe(m));

  /* ═══════════════════════════════════════════════════════════
     14. CONNECT CARD SUBTLE TILT
     ═══════════════════════════════════════════════════════════ */
  $$('.connect__card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const nx = (x / rect.width - 0.5) * 2;
      const ny = (y / rect.height - 0.5) * 2;
      card.style.transform = `perspective(600px) rotateX(${-ny * 3}deg) rotateY(${nx * 3}deg) translateY(-3px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(() => { card.style.transition = ''; }, 500);
    });
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'none';
    });
  });

  /* ═══════════════════════════════════════════════════════════
     15. MARQUEE PAUSE ON HOVER
     ═══════════════════════════════════════════════════════════ */
  const marqueeTrack = $('.marquee__track');
  if (marqueeTrack) {
    const marqueeEl = marqueeTrack.parentElement;
    marqueeEl.addEventListener('mouseenter', () => {
      marqueeTrack.style.animationPlayState = 'paused';
    });
    marqueeEl.addEventListener('mouseleave', () => {
      marqueeTrack.style.animationPlayState = 'running';
    });
  }

  /* ═══════════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════════ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runLoader);
  } else {
    runLoader();
  }

})();
