/**
 * Portfolio - Main JavaScript
 * Handles sticky navigation, scroll reveals, and video autoplay
 */

(function() {
  'use strict';

  // Add a JS hook class.
  // IMPORTANT: We only enable "motion hiding" after init succeeds (js-motion),
  // so a JS error never results in invisible content.
  document.documentElement.classList.add('js');

  var prefersReducedMotion = false;
  try {
    prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  // ==========================================================================
  // Sticky Navigation
  // ==========================================================================

  var stickyNav = document.querySelector('.sticky-nav');
  var heroText = document.querySelector('.hero-text');
  var headerBar = document.querySelector('.header-bar');
  var scrollTarget = heroText || headerBar;

  if (scrollTarget && stickyNav) {
    var navObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          stickyNav.classList.remove('visible');
        } else {
          stickyNav.classList.add('visible');
        }
      });
    }, { threshold: 0 });

    navObserver.observe(scrollTarget);
  }

  // ==========================================================================
  // Page Transitions - Store state before navigation
  // ==========================================================================

  var hasStaticHeader = function() {
    return stickyNav && stickyNav.classList.contains('visible');
  };

  document.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      var href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;

      if (hasStaticHeader()) {
        sessionStorage.setItem('fromStaticHeader', 'true');
      } else {
        sessionStorage.removeItem('fromStaticHeader');
      }
    });
  });

  sessionStorage.removeItem('fromStaticHeader');

  // ==========================================================================
  // Video Autoplay on Viewport Visibility
  // ==========================================================================

  var videos = document.querySelectorAll('.project-card-video');

  if (videos.length > 0) {
    var videoObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        var video = entry.target;
        if (entry.isIntersecting) {
          video.play().catch(function() {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.25 });

    videos.forEach(function(video) {
      videoObserver.observe(video);
    });
  }

  // ==========================================================================
  // Scroll Reveal — sequential, one element at a time
  // ==========================================================================

  // New motion architecture — semantic roles via data-animate.
  // - No queue-based "one at a time" reveals.
  // - Different behaviors per role: hero / media / title / copy / cta.
  // - IO-driven, low state, no scroll thrash.

  var Animated = (function() {
    var REVEAL_CLASS = 'is-revealed';

    function qsAll(selector, root) {
      return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function reveal(el) {
      if (!el || el.classList.contains(REVEAL_CLASS)) return;
      el.classList.add(REVEAL_CLASS);
    }

    function revealAll(selector) {
      qsAll(selector).forEach(reveal);
    }

    function initReducedMotion() {
      revealAll('[data-animate]');
      return true;
    }

    function initHero() {
      var hero = document.querySelector('[data-animate=\"hero\"]');
      if (!hero) return;

      var heroCopy = hero.querySelector('[data-animate=\"hero-copy\"]');
      var heroNav = hero.querySelector('[data-animate=\"hero-nav\"]');
      var SAFETY_REVEAL_MS = 1200;

      // Keep it deliberate but not "landing page".
      // Use small stagger to avoid template feel.
      // If fonts-loaded is present, we start immediately; otherwise a short delay.
      var start = function() {
        // Reveal the hero container first so child opacity isn't compounded.
        reveal(hero);
        if (heroCopy) reveal(heroCopy);
        setTimeout(function() {
          if (heroNav) reveal(heroNav);
        }, 140);
      };

      // Safety: never allow the hero to remain hidden (extensions / edge cases).
      // Runs regardless of font-loading path.
      setTimeout(function() {
        if (hero && !hero.classList.contains(REVEAL_CLASS)) reveal(hero);
        if (heroCopy && !heroCopy.classList.contains(REVEAL_CLASS)) reveal(heroCopy);
        if (heroNav && !heroNav.classList.contains(REVEAL_CLASS)) reveal(heroNav);
      }, SAFETY_REVEAL_MS);

      if (document.documentElement.classList.contains('fonts-loaded')) {
        // Start as soon as possible; avoid waiting on IO or other async hooks.
        requestAnimationFrame(start);
        return;
      }

      // Fallback: don't block forever if fonts hang.
      var started = false;
      var tryStart = function() {
        if (started) return;
        started = true;
        start();
      };

      var mo = new MutationObserver(function() {
        if (document.documentElement.classList.contains('fonts-loaded')) {
          mo.disconnect();
          tryStart();
        }
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      setTimeout(tryStart, 700);
    }

    function observeGroup(selector, options) {
      var els = qsAll(selector);
      if (els.length === 0) return;

      var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          obs.unobserve(entry.target);
        });
      }, options);

      els.forEach(function(el) { obs.observe(el); });
    }

    function initScrollMotion() {
      // Media: a touch more presence, reveal earlier.
      observeGroup('[data-animate=\"media\"]', {
        root: null,
        threshold: 0.18,
        rootMargin: '0px 0px -10% 0px'
      });

      // Titles: crisp + quick.
      observeGroup('[data-animate=\"title\"]', {
        root: null,
        threshold: 0.25,
        rootMargin: '0px 0px -12% 0px'
      });

      // Copy blocks: softer, slightly later.
      observeGroup('[data-animate=\"copy\"]', {
        root: null,
        threshold: 0.3,
        rootMargin: '0px 0px -8% 0px'
      });

      // CTAs: minimal motion; mostly hover does the work.
      observeGroup('[data-animate=\"cta\"]', {
        root: null,
        threshold: 0.55,
        rootMargin: '0px 0px -6% 0px'
      });
    }

    function init() {
      if (prefersReducedMotion) return initReducedMotion();
      initHero();
      initScrollMotion();
      return true;
    }

    return { init: init };
  })();

  try {
    document.documentElement.classList.add('js-motion');
    Animated.init();
  } catch (e) {
    document.documentElement.classList.remove('js-motion');
  }

})();
