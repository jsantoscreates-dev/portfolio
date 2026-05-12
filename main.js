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
      clearMorphTimers();
      isMorphing = false;
      cursor.classList.add('is-hidden');
      cursor.classList.remove('is-visible', 'is-link', 'is-media', 'is-morphing', 'is-reversing', 'is-morph-text');
      clearMorphStyles();
      if (cursorText) cursorText.textContent = '';
    });

    window.addEventListener('mouseenter', function() {
      cursor.classList.add('is-visible');
      cursor.classList.remove('is-hidden');
    });

    // Project links — morphing cursor sequence
    var morphFrames = [
      { w: 16, h: 16, r: 9999 },
      { w: 16, h: 12, r: 9999 },
      { w: 20, h: 16, r: 4 },
      { w: 28, h: 20, r: 4 }
    ];
    var MORPH_STEP_MS = 100;
    var MORPH_TEXT_DELAY = 500;
    var morphTimers = [];
    var isMorphing = false;

    function clearMorphTimers() {
      morphTimers.forEach(function(id) { clearTimeout(id); });
      morphTimers = [];
    }

    function applyFrame(frame) {
      cursor.style.width = frame.w + 'px';
      cursor.style.height = frame.h + 'px';
      cursor.style.borderRadius = frame.r + 'px';
      cursor.style.marginLeft = (-frame.w / 2) + 'px';
      cursor.style.marginTop = (-frame.h / 2) + 'px';
      cursor.style.padding = '0';
    }

    var PILL_PAD_X = 16;

    function applyPillState() {
      var textRect = cursorText.getBoundingClientRect();
      var w = Math.ceil(textRect.width) + (PILL_PAD_X * 2);
      var h = Math.ceil(textRect.height);
      cursor.style.width = w + 'px';
      cursor.style.height = h + 'px';
      cursor.style.borderRadius = '0';
      cursor.style.padding = '0';
      cursor.style.marginLeft = (-w / 2) + 'px';
      cursor.style.marginTop = (-h / 2) + 'px';
    }

    function clearMorphStyles() {
      cursor.style.width = '';
      cursor.style.height = '';
      cursor.style.borderRadius = '';
      cursor.style.marginLeft = '';
      cursor.style.marginTop = '';
      cursor.style.padding = '';
    }

    function startMorph(text) {
      clearMorphTimers();
      isMorphing = true;

      cursor.classList.remove('is-link', 'is-media', 'is-reversing', 'is-morph-text');
      cursor.classList.add('is-morphing');
      if (cursorText) cursorText.textContent = text;

      applyFrame(morphFrames[0]);

      for (var i = 1; i < morphFrames.length; i++) {
        (function(step) {
          morphTimers.push(setTimeout(function() {
            applyFrame(morphFrames[step]);
          }, step * MORPH_STEP_MS));
        })(i);
      }

      morphTimers.push(setTimeout(function() {
        applyPillState();
      }, morphFrames.length * MORPH_STEP_MS));

      morphTimers.push(setTimeout(function() {
        cursor.classList.add('is-morph-text');
        isMorphing = false;
      }, MORPH_TEXT_DELAY));
    }

    function reverseMorph() {
      clearMorphTimers();
      isMorphing = false;

      cursor.classList.remove('is-morph-text');
      cursor.classList.add('is-reversing');

      applyFrame(morphFrames[0]);

      morphTimers.push(setTimeout(function() {
        cursor.classList.remove('is-morphing', 'is-reversing');
        clearMorphStyles();
        if (cursorText) cursorText.textContent = '';
      }, 300));
    }

    var projectTargets = document.querySelectorAll('[data-cursor-text]');
    projectTargets.forEach(function(el) {
      el.addEventListener('mouseenter', function() {
        if (prefersReducedMotion) {
          var text = el.getAttribute('data-cursor-text');
          if (cursorText) cursorText.textContent = text;
          cursor.classList.add('is-morphing', 'is-morph-text');
          cursor.classList.remove('is-link', 'is-media');
          applyPillState();
          return;
        }
        startMorph(el.getAttribute('data-cursor-text'));
      });
      el.addEventListener('mouseleave', function() {
        if (prefersReducedMotion) {
          cursor.classList.remove('is-morphing', 'is-morph-text');
          clearMorphStyles();
          if (cursorText) cursorText.textContent = '';
          return;
        }
        reverseMorph();
      });
    });

    // Regular links (exclude project links with cursor text)
    var linkTargets = document.querySelectorAll('a:not([data-cursor-text]), button, [role="button"]');
    linkTargets.forEach(function(el) {
      el.addEventListener('mouseenter', function() {
        if (!cursor.classList.contains('is-morphing')) {
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
        if (!cursor.classList.contains('is-morphing')) {
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
  // Page Load Animation (All pages) — Unified entrance system
  // ==========================================================================

  (function initPageLoadAnimation() {
    // Configuration - 3 Act Animation System
    // Uses Framer-like easing: cubic-bezier(0.22, 1, 0.36, 1)
    var LINE_STAGGER = 100; // ms between headline lines (ACT 2)
    var LINE_DURATION = 700; // ms per line (matches CSS)
    var ACT1_DELAY = 0; // ms - top elements + first project
    var ACT2_DELAY = 150; // ms - headline starts while ACT 1 is still animating

    // Collect elements by data-anim attribute
    var topElements = document.querySelectorAll('[data-anim="top"]');
    var act1Elements = document.querySelectorAll('[data-anim="act1"]');
    var headlines = document.querySelectorAll('[data-anim="headline"]');
    var aboutElements = document.querySelectorAll('[data-anim="about"]');
    var mediaElements = document.querySelectorAll('[data-anim="media"]');
    var bodyElements = document.querySelectorAll('[data-anim="body"]');

    // Exit if no animated elements found
    if (topElements.length === 0 && headlines.length === 0 &&
        act1Elements.length === 0 && aboutElements.length === 0 &&
        mediaElements.length === 0 && bodyElements.length === 0) {
      return;
    }

    // Mark that JS is handling the animation
    document.documentElement.classList.add('js-page-anim');

    // Reduced motion: content already visible via CSS, just exit
    if (prefersReducedMotion) {
      return;
    }

    // Check if element is in viewport
    function isInViewport(el) {
      var rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    }

    // Detect visual line breaks and wrap in mask structure
    function wrapVisualLines(headline) {
      var originalText = headline.textContent;

      // Create temp container to measure line breaks
      var temp = document.createElement('div');
      temp.style.cssText = 'position:absolute;visibility:hidden;white-space:pre-wrap;' +
        'width:' + headline.offsetWidth + 'px;' +
        'font:' + getComputedStyle(headline).font + ';' +
        'letter-spacing:' + getComputedStyle(headline).letterSpacing + ';' +
        'line-height:' + getComputedStyle(headline).lineHeight + ';';
      document.body.appendChild(temp);

      // Split into words and detect line breaks
      var words = originalText.trim().split(/\s+/);
      var lines = [];
      var currentLine = [];
      var lastTop = null;

      temp.innerHTML = '';

      words.forEach(function(word) {
        var span = document.createElement('span');
        span.textContent = word;
        span.style.display = 'inline';

        if (temp.childNodes.length > 0) {
          temp.appendChild(document.createTextNode(' '));
        }
        temp.appendChild(span);

        var rect = span.getBoundingClientRect();
        var top = Math.round(rect.top);

        if (lastTop !== null && top > lastTop) {
          lines.push(currentLine.join(' '));
          currentLine = [word];
        } else {
          currentLine.push(word);
        }
        lastTop = top;
      });

      if (currentLine.length > 0) {
        lines.push(currentLine.join(' '));
      }

      document.body.removeChild(temp);

      // Rebuild headline with mask structure
      headline.innerHTML = '';
      lines.forEach(function(lineText, index) {
        var mask = document.createElement('span');
        mask.className = 'line-mask';

        var text = document.createElement('span');
        text.className = 'line-text';
        text.textContent = lineText;
        text.style.transitionDelay = (index * LINE_STAGGER) + 'ms';

        mask.appendChild(text);
        headline.appendChild(mask);

        if (index < lines.length - 1) {
          headline.appendChild(document.createTextNode(' '));
        }
      });

      return headline.querySelectorAll('.line-text');
    }

    // Intersection Observer for scroll-triggered elements
    function setupScrollReveal(elementsToObserve) {
      if (typeof IntersectionObserver !== 'function' || elementsToObserve.length === 0) {
        elementsToObserve.forEach(function(el) { el.classList.add('is-visible'); });
        return;
      }

      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, {
        root: null,
        threshold: 0.1, // trigger earlier for smoother scroll reveals
        rootMargin: '0px'
      });

      elementsToObserve.forEach(function(el) {
        observer.observe(el);
      });
    }

    // Main animation sequence - 3 Act System
    function startPageAnimation() {
      // Process all headlines
      var allLineElements = [];
      headlines.forEach(function(headline) {
        var lineElements = wrapVisualLines(headline);
        lineElements.forEach(function(line) {
          allLineElements.push(line);
        });
      });

      // Separate visible vs below-fold elements for scroll-triggered animation
      var belowFoldMedia = [];
      mediaElements.forEach(function(el) {
        if (!isInViewport(el)) {
          belowFoldMedia.push(el);
        }
      });

      var belowFoldBody = [];
      bodyElements.forEach(function(el) {
        if (!isInViewport(el)) {
          belowFoldBody.push(el);
        }
      });

      // ACT 1 (0ms): Top elements + first project
      setTimeout(function() {
        topElements.forEach(function(el) {
          el.classList.add('is-visible');
        });
        act1Elements.forEach(function(el) {
          el.classList.add('is-visible');
        });
      }, ACT1_DELAY);

      // ACT 2 (150ms): Headline mask reveal with stagger
      setTimeout(function() {
        allLineElements.forEach(function(line) {
          line.classList.add('is-visible');
        });

        // ACT 3: About text fades in after headline starts (but not too late)
        var aboutDelay = Math.min(allLineElements.length * LINE_STAGGER, 400);
        setTimeout(function() {
          aboutElements.forEach(function(el) {
            el.classList.add('is-visible');
          });
        }, aboutDelay);

        // Calculate when headline animation finishes
        var headlineDuration = (allLineElements.length * LINE_STAGGER) + LINE_DURATION;

        // Clean up headline transition delays after animation completes
        setTimeout(function() {
          allLineElements.forEach(function(line) {
            line.style.transitionDelay = '';
          });
        }, headlineDuration + 100);
      }, ACT2_DELAY);

      // Below-fold elements (scroll-triggered)
      setupScrollReveal(belowFoldMedia.concat(belowFoldBody));
    }

    // Handle window resize (re-wrap headline lines)
    var resizeTimeout;
    var lastWidth = window.innerWidth;

    window.addEventListener('resize', function() {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;

      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        headlines.forEach(function(headline) {
          var existingLines = headline.querySelectorAll('.line-text');
          if (existingLines.length > 0 && existingLines[0].classList.contains('is-visible')) {
            var lineElements = wrapVisualLines(headline);
            lineElements.forEach(function(line) {
              line.classList.add('is-visible');
              line.style.transitionDelay = '';
            });
          }
        });
      }, 200);
    });

    // Wait for fonts before starting
    function waitForFontsAndStart() {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(startPageAnimation);
      } else if (document.documentElement.classList.contains('fonts-loaded')) {
        requestAnimationFrame(startPageAnimation);
      } else {
        setTimeout(startPageAnimation, 100);
      }
    }

    waitForFontsAndStart();
  })();

  // ==========================================================================
  // Sticky Navigation
  // ==========================================================================

  var stickyNav = document.querySelector('.sticky-nav');
  if (stickyNav) {
    stickyNav.classList.add('visible');
  }

  // ==========================================================================
  // Page Transitions — View Transitions API with fallback
  // ==========================================================================

  var hasStaticHeader = function() {
    return stickyNav && stickyNav.classList.contains('visible');
  };

  // Check if View Transitions API is supported and motion is allowed
  var supportsViewTransitions = typeof document.startViewTransition === 'function';

  function isInternalLink(href) {
    if (!href) return false;
    if (href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) return false;
    return true;
  }

  function navigateWithTransition(href) {
    // Store header state
    if (hasStaticHeader()) {
      sessionStorage.setItem('fromStaticHeader', 'true');
    } else {
      sessionStorage.removeItem('fromStaticHeader');
    }

    // Use View Transitions if supported and motion is allowed
    if (supportsViewTransitions && !prefersReducedMotion) {
      document.startViewTransition(function() {
        window.location.href = href;
      });
    } else {
      // Fallback: direct navigation
      window.location.href = href;
    }
  }

  // Intercept internal link clicks
  document.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function(e) {
      var href = link.getAttribute('href');
      if (!isInternalLink(href)) return;

      e.preventDefault();
      navigateWithTransition(href);
    });
  });

  // Handle project card clicks (entire card is clickable)
  document.querySelectorAll('.home-project').forEach(function(card) {
    var mediaLink = card.querySelector('.home-project__media');
    if (!mediaLink) return;

    var href = mediaLink.getAttribute('href');
    if (!href) return;

    // Make the text area also trigger navigation
    var aside = card.querySelector('.home-project__aside');
    if (aside) {
      aside.style.cursor = 'pointer';
      aside.addEventListener('click', function(e) {
        // Don't interfere with actual links inside aside
        if (e.target.closest('a')) return;

        e.preventDefault();
        if (isInternalLink(href)) {
          navigateWithTransition(href);
        } else {
          window.open(href, '_blank', 'noopener,noreferrer');
        }
      });
    }
  });

  sessionStorage.removeItem('fromStaticHeader');

  // ==========================================================================
  // Email Copy to Clipboard
  // ==========================================================================

  document.querySelectorAll('a[href^="mailto:"]').forEach(function(emailLink) {
    emailLink.addEventListener('click', function(e) {
      e.preventDefault();

      var email = emailLink.getAttribute('href').replace('mailto:', '');
      var originalText = emailLink.textContent;

      // Copy to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(function() {
          // Show "Copied!" feedback
          emailLink.textContent = 'Copied!';
          emailLink.style.pointerEvents = 'none';

          // Restore original text after 2 seconds
          setTimeout(function() {
            emailLink.textContent = originalText;
            emailLink.style.pointerEvents = '';
          }, 2000);
        }).catch(function() {
          // Fallback: open mail client
          window.location.href = 'mailto:' + email;
        });
      } else {
        // Fallback for older browsers
        window.location.href = 'mailto:' + email;
      }
    });
  });

  // ==========================================================================
  // Video Autoplay on Viewport Visibility
  // ==========================================================================

  var videos = document.querySelectorAll('video.project-card-video, .cs-row__media video');

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

  document.querySelectorAll('[data-back-to-top]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      try {
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
      } catch (e) {
        window.scrollTo(0, 0);
      }
    });
  });

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
        var nav = qs('.navigation[data-animate]', header);
        if (nav) reveal(nav);

        var heroIntro = qs('.home-hero__intro[data-animate]', header);
        var heroText = qs('.hero-text[data-animate]', header);
        if (heroIntro) {
          reveal(heroIntro);
        } else if (heroText) {
          reveal(heroText);
        }

        setTimeout(function() {
          projectEls.forEach(reveal);
        }, 300);
      };

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

      var headerBar = qs('.cv-header[data-animate]', about) || qs('.header-bar[data-animate]', about);
      var image = qs('.about-image-wrapper[data-animate]', about);
      var content = qs('.cv-body[data-animate]', about) || qs('.about-content[data-animate]', about);

      [headerBar, image, content].forEach(markEntranceElement);

      var start = function() {
        if (headerBar) reveal(headerBar);

        setTimeout(function() {
          if (image) reveal(image);
        }, 150);

        setTimeout(function() {
          if (content) reveal(content);
        }, image ? 300 : 150);
      };

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

      var leadZone = qs('.cs-lead', caseStudy) || qs('.pft-zone--lead', caseStudy);
      if (!leadZone) return false;

      var headerBar = qs('.cs-topbar[data-animate]', leadZone) || qs('.header-bar[data-animate]', leadZone);
      var titleStack = qs('.cs-headline[data-animate]', leadZone) || qs('.pft-title-stack[data-animate]', leadZone);
      var heroMedia = qs('.cs-rows .cs-row__media[data-animate]', caseStudy) || qs('.pft-hero-media[data-animate]', leadZone);

      [headerBar, titleStack, heroMedia].forEach(markEntranceElement);

      var start = function() {
        if (headerBar) reveal(headerBar);

        setTimeout(function() {
          if (titleStack) reveal(titleStack);
        }, 150);

        setTimeout(function() {
          if (heroMedia) reveal(heroMedia);
        }, 300);
      };

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
      // Skip — now using unified page load animation system with data-anim attributes
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
