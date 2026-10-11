/* ==========================================================================
   CYBER PASSWORD ANALYZER - INTRODUCTION PAGE INTERACTIVE SCRIPT
   Seamless view transitions, client-side educational sandbox,
   interactive card spotlights, and hash routing.
   ========================================================================== */

(function () {
  'use strict';

  // Sample passwords for demonstration
  const SAMPLE_PASSWORDS = [
    'K9#mQ2$vL8!zW5@',
    'V0rt3x&Cyber77#',
    'Sun$et#Horizon92!',
    'Tr0ub4dor&Sky89*',
    '9x!N3bula#Pulse$',
    'Aeg1s&Shield*2026',
  ];
  let sampleIndex = 0;

  /* ---------------- View Routing & Switching ---------------- */
  const introPage = document.getElementById('introPage');
  const dashboardApp = document.getElementById('dashboardApp');

  function showIntro() {
    if (introPage) introPage.style.display = 'block';
    if (dashboardApp) dashboardApp.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.location.hash !== '' && window.location.hash !== '#intro') {
      history.pushState(null, '', '#intro');
    }
    if (window.ambient3DParticlesInstance) {
      window.ambient3DParticlesInstance.start();
    }
    initScrollReveal();
  }

  function showDashboard(targetView = 'dashboard') {
    if (introPage) introPage.style.display = 'none';
    if (dashboardApp) dashboardApp.style.display = 'grid';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (window.ambient3DParticlesInstance) {
      window.ambient3DParticlesInstance.stop();
    }

    // Switch view inside existing dashboard
    const navBtn = document.querySelector(`.nav-item[data-view="${targetView}"]`);
    if (navBtn) {
      navBtn.click();
    }

    if (window.location.hash !== `#${targetView}`) {
      history.pushState(null, '', `#${targetView}`);
    }
    initScrollReveal();
  }

  function handleRoute() {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    const dashboardViews = ['dashboard', 'analyzer', 'generator', 'breach', 'history', 'tips', 'settings', 'about'];
    
    if (dashboardViews.includes(hash)) {
      showDashboard(hash);
    } else {
      showIntro();
    }
  }

  /* ---------------- Educational Demo Evaluation (100% Client-Side) ---------------- */
  function evaluateDemoPassword(pw) {
    pw = pw || '';
    const len = pw.length;
    const hasUpper = /[A-Z]/.test(pw);
    const hasLower = /[a-z]/.test(pw);
    const hasDigits = /[0-9]/.test(pw);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pw);
    const len16 = len >= 16;

    let pool = 0;
    if (hasLower) pool += 26;
    if (hasUpper) pool += 26;
    if (hasDigits) pool += 10;
    if (hasSpecial) pool += 33;
    pool = pool || 1;

    const entropy = Math.round(len * Math.log2(pool) * 10) / 10;

    // Weighted educational score
    let score = Math.min(100, Math.round((len / 16) * 35));
    if (hasUpper) score += 15;
    if (hasLower) score += 15;
    if (hasDigits) score += 15;
    if (hasSpecial) score += 20;
    if (len < 8) score = Math.min(score, 30);
    score = Math.max(0, Math.min(100, score));

    let scoreLabel = 'Weak';
    let labelColor = 'var(--intro-rose)';
    if (score >= 85) {
      scoreLabel = 'Excellent';
      labelColor = 'var(--intro-green)';
    } else if (score >= 65) {
      scoreLabel = 'Good';
      labelColor = 'var(--intro-blue)';
    } else if (score >= 40) {
      scoreLabel = 'Fair';
      labelColor = 'var(--intro-amber)';
    }

    let crackEstimate = 'Instantly';
    if (score >= 85) crackEstimate = 'Millions of Years';
    else if (score >= 70) crackEstimate = 'Hundreds of Years';
    else if (score >= 50) crackEstimate = 'A Few Weeks';
    else if (score >= 30) crackEstimate = 'A Few Hours';

    return {
      len,
      hasUpper,
      hasLower,
      hasDigits,
      hasSpecial,
      len16,
      entropy,
      score,
      scoreLabel,
      labelColor,
      crackEstimate,
    };
  }

  function updateDemoUI() {
    const input = document.getElementById('demoPasswordInput');
    if (!input) return;

    const val = input.value;
    const res = evaluateDemoPassword(val);

    const scoreNum = document.getElementById('demoScoreNum');
    const scoreLabel = document.getElementById('demoScoreLabel');
    const entropyVal = document.getElementById('demoEntropyVal');
    const crackVal = document.getElementById('demoCrackVal');

    if (scoreNum) {
      scoreNum.textContent = `${res.score}/100`;
      scoreNum.style.color = res.labelColor;
    }
    if (scoreLabel) {
      scoreLabel.textContent = res.scoreLabel;
      scoreLabel.style.color = res.labelColor;
      scoreLabel.style.backgroundColor = `${res.labelColor}26`;
    }
    if (entropyVal) entropyVal.textContent = `${res.entropy} bits`;
    if (crackVal) crackVal.textContent = res.crackEstimate;

    // Check items
    const checkUpper = document.getElementById('checkUpper');
    const checkLower = document.getElementById('checkLower');
    const checkDigits = document.getElementById('checkDigits');
    const checkSpecial = document.getElementById('checkSpecial');
    const checkLength = document.getElementById('checkLength');

    if (checkUpper) checkUpper.classList.toggle('valid', res.hasUpper);
    if (checkLower) checkLower.classList.toggle('valid', res.hasLower);
    if (checkDigits) checkDigits.classList.toggle('valid', res.hasDigits);
    if (checkSpecial) checkSpecial.classList.toggle('valid', res.hasSpecial);
    if (checkLength) checkLength.classList.toggle('valid', res.len >= 12);
  }

  /* ---------------- Initialization ---------------- */
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Routing
    handleRoute();
    window.addEventListener('hashchange', handleRoute);

    // 2. Navigation CTA buttons to Dashboard
    document.querySelectorAll('.open-dashboard-trigger').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = btn.dataset.view || 'dashboard';
        showDashboard(targetView);
      });
    });

    // 3. Return to Intro button inside Dashboard
    document.querySelectorAll('.return-intro-trigger').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        showIntro();
      });
    });

    // 4. Smooth Anchor Scrolling inside Intro Page
    document.querySelectorAll('.intro-scroll-trigger').forEach((link) => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (targetId && targetId.startsWith('#')) {
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
            e.preventDefault();
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });

    // 5. Interactive Demo handlers
    const demoInput = document.getElementById('demoPasswordInput');
    const demoRollBtn = document.getElementById('demoRollBtn');
    const demoToggleVis = document.getElementById('demoToggleVis');

    if (demoInput) {
      demoInput.addEventListener('input', updateDemoUI);
      updateDemoUI();
    }

    if (demoRollBtn) {
      demoRollBtn.addEventListener('click', () => {
        sampleIndex = (sampleIndex + 1) % SAMPLE_PASSWORDS.length;
        if (demoInput) {
          demoInput.value = SAMPLE_PASSWORDS[sampleIndex];
          updateDemoUI();
        }
      });
    }

    if (demoToggleVis && demoInput) {
      demoToggleVis.addEventListener('click', () => {
        demoInput.type = demoInput.type === 'password' ? 'text' : 'password';
      });
    }

    // 6. Natural 3D tilt & floating hover interaction on interactive cards
    const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isFinePointer && !prefersReducedMotion) {
      const tiltCards = document.querySelectorAll('.intro-feature-card, .intro-principle-card, .intro-step-card');
      tiltCards.forEach((card) => {
        let rafId = null;
        let targetTiltX = 0;
        let targetTiltY = 0;
        const maxTilt = card.classList.contains('intro-feature-card') ? 5 : 4; // subtle natural tilt angle

        card.addEventListener('pointerenter', () => {
          card.style.setProperty('--tilt-lift', '-10px');
        });

        card.addEventListener('pointermove', (e) => {
          const rect = card.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          card.style.setProperty('--mouse-x', `${x}px`);
          card.style.setProperty('--mouse-y', `${y}px`);

          // Calculate normalized coordinates (-1 to 1) from card center
          const dx = ((x / rect.width) - 0.5) * 2;
          const dy = ((y / rect.height) - 0.5) * 2;

          targetTiltX = -dy * maxTilt;
          targetTiltY = dx * maxTilt;

          if (!rafId) {
            rafId = requestAnimationFrame(() => {
              card.style.setProperty('--tilt-x', `${targetTiltX.toFixed(2)}deg`);
              card.style.setProperty('--tilt-y', `${targetTiltY.toFixed(2)}deg`);
              rafId = null;
            });
          }
        });

        card.addEventListener('pointerleave', () => {
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
          // Smoothly restore to exact original position, rotation, and appearance
          card.style.setProperty('--tilt-lift', '0px');
          card.style.setProperty('--tilt-x', '0deg');
          card.style.setProperty('--tilt-y', '0deg');
        });
      });
    }

    // 7. Scroll-Triggered Reveal Controller (Viewport Pop-up)
    initScrollReveal();
  });

  /* ---------------- Scroll-Triggered Reveal Controller ---------------- */
  function initScrollReveal() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Enable CSS reveal styles now that JS is running
    document.documentElement.classList.add('has-scroll-reveal');

    // Automatically ensure all target sections, cards, and feature blocks are registered
    const targetSelectors = [
      '.intro-section-header',
      '.intro-principle-card',
      '.intro-feature-card',
      '.intro-demo-box',
      '.intro-step-card',
      '.intro-cta-section .intro-container',
      '.intro-footer .intro-container',
      '.stat-grid .stat-card',
      '#view-dashboard .card'
    ];
    targetSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        el.classList.add('scroll-reveal');
      });
    });

    const revealElements = document.querySelectorAll('.scroll-reveal:not(.is-revealed)');
    if (!revealElements.length) return;

    if (!('IntersectionObserver' in window)) {
      revealElements.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach((el) => observer.observe(el));
  }

  // Export functions to window if needed
  window.CyberIntro = {
    showIntro,
    showDashboard,
    initScrollReveal,
  };
  window.initScrollReveal = initScrollReveal;
})();
