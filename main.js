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
  // Custom Cursor (desktop only, disabled for reduced-motion)
  // ==========================================================================

  (function initCustomCursor() {
    var supportsCustomCursor = false;
    try {
      supportsCustomCursor =
        window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    } catch (e) {}

    if (!supportsCustomCursor) return;

    var cursor = document.querySelector('.custom-cursor');
    if (!cursor) return;

    var cursorText = cursor.querySelector('.cursor-text');

    document.documentElement.classList.add('has-custom-cursor');

    var mouseX = window.innerWidth / 2;
    var mouseY = window.innerHeight / 2;
    var currentX = mouseX;
    var currentY = mouseY;
    var ease = 0.18;

    function render() {
      currentX += (mouseX - currentX) * ease;
      currentY += (mouseY - currentY) * ease;
      cursor.style.transform = 'translate3d(' + currentX + 'px, ' + currentY + 'px, 0)';
      requestAnimationFrame(render);
    }

    window.addEventListener('mousemove', function(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.classList.add('is-visible');
      cursor.classList.remove('is-hidden');
    });

    window.addEventListener('mouseleave', function() {
      cursor.classList.add('is-hidden');
      cursor.classList.remove('is-visible', 'is-link', 'is-media', 'is-project');
      if (cursorText) cursorText.textContent = '';
    });

    window.addEventListener('mouseenter', function() {
      cursor.classList.add('is-visible');
      cursor.classList.remove('is-hidden');
    });

    // Project links with custom cursor text (pill state) — handled first, highest priority
    var projectTargets = document.querySelectorAll('[data-cursor-text]');
    projectTargets.forEach(function(el) {
      el.addEventListener('mouseenter', function() {
        var text = el.getAttribute('data-cursor-text');
        if (cursorText) cursorText.textContent = text;
        cursor.classList.add('is-project');
        cursor.classList.remove('is-link', 'is-media');
      });
      el.addEventListener('mouseleave', function() {
        cursor.classList.remove('is-project');
        if (cursorText) cursorText.textContent = '';
      });
    });

    // Regular links (exclude project links with cursor text)
    var linkTargets = document.querySelectorAll('a:not([data-cursor-text]), button, [role="button"]');
    linkTargets.forEach(function(el) {
      el.addEventListener('mouseenter', function() {
        if (!cursor.classList.contains('is-project')) {
          cursor.classList.add('is-link');
          cursor.classList.remove('is-media');
        }
      });
      el.addEventListener('mouseleave', function() {
        cursor.classList.remove('is-link');
      });
    });

    // Media targets (exclude project card media which have cursor text)
    var mediaTargets = document.querySelectorAll('.project-card:not(:has([data-cursor-text])), img, video');
    mediaTargets.forEach(function(el) {
      el.addEventListener('mouseenter', function() {
        if (!cursor.classList.contains('is-project')) {
          cursor.classList.add('is-media');
          cursor.classList.remove('is-link');
        }
      });
      el.addEventListener('mouseleave', function() {
        cursor.classList.remove('is-media');
      });
    });

    render();
  })();

  // ==========================================================================
  // Sticky Navigation
  // ==========================================================================

  var stickyNav = document.querySelector('.sticky-nav');
  if (stickyNav) {
    stickyNav.classList.add('visible');
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

  if (videos.length > 0 && typeof IntersectionObserver === 'function') {
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
  // Animation System — fade (text/UI) and image (scale+fade)
  // ==========================================================================

  /*
    Page-load entrance sequences:
    - Home:       header (0ms) → hero (150ms) → first project (300ms)
    - About:      header (0ms) → image (150ms) → content (300ms)
    - Case Study: header (0ms) → title (150ms) → hero image (300ms)

    Scroll reveal: 20% threshold, animate once
  */

  var Animated = (function() {
    var REVEAL_CLASS = 'is-revealed';
    var SAFETY_REVEAL_MS = 1500;

    function qsAll(selector, root) {
      return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function qs(selector, root) {
      return (root || document).querySelector(selector);
    }

    function reveal(el) {
      if (!el || el.classList.contains(REVEAL_CLASS)) return;
      el.classList.add(REVEAL_CLASS);
    }

    function revealAll(selector, root) {
      qsAll(selector, root).forEach(reveal);
    }

    // Track entrance elements to exclude from scroll reveal
    var entranceElements = [];

    function markEntranceElement(el) {
      if (el && entranceElements.indexOf(el) === -1) {
        entranceElements.push(el);
      }
    }

    function isEntranceElement(el) {
      return entranceElements.indexOf(el) !== -1;
    }

    function initReducedMotion() {
      revealAll('[data-animate]');
      return true;
    }

    // --------------------------------------------------------------------------
    // Page-load entrance animations
    // --------------------------------------------------------------------------

    function initHomeEntrance() {
      var header = qs('[data-entrance="header"]');
      var firstProject = qs('[data-entrance="project"]');
      if (!header) return false;

      // Collect entrance elements
      var headerEls = qsAll('[data-animate]', header);
      var projectEls = firstProject ? qsAll('[data-animate]', firstProject) : [];

      headerEls.forEach(markEntranceElement);
      projectEls.forEach(markEntranceElement);

      var start = function() {
        // 1. Header elements at 0ms (nav)
        var nav = qs('.navigation[data-animate]', header);
        if (nav) reveal(nav);

        // 2. Hero text at 0ms (single fade, starts immediately)
        var heroText = qs('.hero-text[data-animate]', header);
        if (heroText) reveal(heroText);

        // 3. First project at 300ms
        setTimeout(function() {
          projectEls.forEach(reveal);
        }, 300);
      };

      // Safety fallback
      setTimeout(function() {
        headerEls.forEach(function(el) {
          if (!el.classList.contains(REVEAL_CLASS)) reveal(el);
        });
        projectEls.forEach(function(el) {
          if (!el.classList.contains(REVEAL_CLASS)) reveal(el);
        });
      }, SAFETY_REVEAL_MS);

      waitForFonts(start);
      return true;
    }

    function initAboutEntrance() {
      var about = qs('[data-entrance="about"]');
      if (!about) return false;

      // Collect entrance elements
      var headerBar = qs('.header-bar[data-animate]', about);
      var image = qs('.about-image-wrapper[data-animate]', about);
      var content = qs('.about-content[data-animate]', about);

      [headerBar, image, content].forEach(markEntranceElement);

      var start = function() {
        // 1. Header at 0ms
        if (headerBar) reveal(headerBar);

        // 2. Image at 150ms
        setTimeout(function() {
          if (image) reveal(image);
        }, 150);

        // 3. Content at 300ms
        setTimeout(function() {
          if (content) reveal(content);
        }, 300);
      };

      // Safety fallback
      setTimeout(function() {
        [headerBar, image, content].forEach(function(el) {
          if (el && !el.classList.contains(REVEAL_CLASS)) reveal(el);
        });
      }, SAFETY_REVEAL_MS);

      waitForFonts(start);
      return true;
    }

    function initCaseStudyEntrance() {
      var caseStudy = qs('[data-entrance="casestudy"]');
      if (!caseStudy) return false;

      // Collect entrance elements (first zone only)
      var leadZone = qs('.pft-zone--lead', caseStudy);
      if (!leadZone) return false;

      var headerBar = qs('.header-bar[data-animate]', leadZone);
      var titleStack = qs('.pft-title-stack[data-animate]', leadZone);
      var heroMedia = qs('.pft-hero-media[data-animate]', leadZone);

      [headerBar, titleStack, heroMedia].forEach(markEntranceElement);

      var start = function() {
        // 1. Header at 0ms
        if (headerBar) reveal(headerBar);

        // 2. Title at 150ms
        setTimeout(function() {
          if (titleStack) reveal(titleStack);
        }, 150);

        // 3. Hero image at 300ms
        setTimeout(function() {
          if (heroMedia) reveal(heroMedia);
        }, 300);
      };

      // Safety fallback
      setTimeout(function() {
        [headerBar, titleStack, heroMedia].forEach(function(el) {
          if (el && !el.classList.contains(REVEAL_CLASS)) reveal(el);
        });
      }, SAFETY_REVEAL_MS);

      waitForFonts(start);
      return true;
    }

    function waitForFonts(callback) {
      if (document.documentElement.classList.contains('fonts-loaded')) {
        requestAnimationFrame(callback);
        return;
      }

      var started = false;
      var tryStart = function() {
        if (started) return;
        started = true;
        callback();
      };

      var mo = new MutationObserver(function() {
        if (document.documentElement.classList.contains('fonts-loaded')) {
          mo.disconnect();
          tryStart();
        }
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      setTimeout(tryStart, 800);
    }

    // --------------------------------------------------------------------------
    // Scroll reveal (20% threshold, animate once)
    // --------------------------------------------------------------------------

    function initScrollReveal() {
      if (typeof IntersectionObserver !== 'function') {
        revealAll('[data-animate]');
        return;
      }

      var scrollElements = qsAll('[data-animate]').filter(function(el) {
        return !isEntranceElement(el);
      });

      if (scrollElements.length === 0) return;

      var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          obs.unobserve(entry.target);
        });
      }, {
        root: null,
        threshold: 0.2,
        rootMargin: '0px'
      });

      scrollElements.forEach(function(el) {
        obs.observe(el);
      });
    }

    // --------------------------------------------------------------------------
    // Init
    // --------------------------------------------------------------------------

    function init() {
      if (prefersReducedMotion) return initReducedMotion();

      // Detect page type and run appropriate entrance
      initHomeEntrance() || initAboutEntrance() || initCaseStudyEntrance();

      // Scroll reveal for remaining elements
      initScrollReveal();

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
