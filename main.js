/**
 * Portfolio - Main JavaScript
 * Handles sticky navigation, scroll reveals, and video autoplay
 */

(function() {
  'use strict';

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

  var allRevealEls = document.querySelectorAll('.reveal-text, .fade-media');
  var revealQueue = [];
  var isRevealing = false;
  var isMobile = window.innerWidth <= 600;
  var REVEAL_DURATION = 1.6; // seconds
  var STAGGER = isMobile ? 250 : 400; // ms between each element
  var SCROLL_THRESHOLD = isMobile ? 0.70 : 0.85;

  allRevealEls.forEach(function(el) {
    revealQueue.push({
      el: el,
      triggered: false,
      done: false
    });
  });

  // Split into header elements (load) and content elements (scroll)
  var headerEls = [];
  var scrollEls = [];

  var firstMediaFound = false;

  revealQueue.forEach(function(item) {
    var isHeader = item.el.closest('.header') || item.el.closest('.header-bar');
    var isFirstMedia = !firstMediaFound && item.el.classList.contains('fade-media');

    if (isHeader || isFirstMedia) {
      if (isFirstMedia) firstMediaFound = true;
      headerEls.push(item);
    } else {
      scrollEls.push(item);
    }
  });

  function revealItem(item) {
    item.triggered = true;
    item.el.style.transition = 'clip-path ' + REVEAL_DURATION + 's cubic-bezier(0.16, 1, 0.3, 1)';
    item.el.style.clipPath = 'inset(0 0% 0 0)';
    item.el.classList.add('revealed');
  }

  // Reveal header elements sequentially on load
  function revealHeader(index) {
    if (index >= headerEls.length) {
      // Header done, now listen for scroll reveals
      initialDone = true;
      return;
    }
    revealItem(headerEls[index]);
    isRevealing = true;
    setTimeout(function() {
      isRevealing = false;
      revealHeader(index + 1);
    }, STAGGER);
  }

  // Reveal scroll elements one at a time when in viewport
  var initialDone = false;

  function revealNextScroll() {
    if (!initialDone || isRevealing) return;

    for (var i = 0; i < scrollEls.length; i++) {
      var item = scrollEls[i];
      if (item.triggered) continue;

      var rect = item.el.getBoundingClientRect();
      if (rect.top > window.innerHeight * SCROLL_THRESHOLD) break;

      revealItem(item);
      isRevealing = true;
      setTimeout(function() {
        isRevealing = false;
        revealNextScroll();
      }, STAGGER);

      return;
    }
  }

  // Scroll handler
  var ticking = false;

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function() {
        revealNextScroll();
        ticking = false;
      });
    }
  }

  if (revealQueue.length > 0) {
    window.addEventListener('scroll', onScroll, { passive: true });

    // Wait for fonts to load, then start header reveal
    function startReveal() {
      setTimeout(function() {
        revealHeader(0);
      }, 1200);
    }

    if (document.documentElement.classList.contains('fonts-loaded')) {
      startReveal();
    } else {
      var fontObserver = new MutationObserver(function() {
        if (document.documentElement.classList.contains('fonts-loaded')) {
          fontObserver.disconnect();
          startReveal();
        }
      });
      fontObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      setTimeout(startReveal, 1500);
    }
  }

})();
