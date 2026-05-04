/* Maryland Smart Energy — share-tracking.
 *
 * Two responsibilities:
 *   1. Read ?an=<slug> from the URL (or sessionStorage), persist it, and
 *      append it onto every same-origin <a href>. The slug rides along with
 *      the visitor and lands in the hidden form field on /contact.html and
 *      in the Paperform embed on /0deposit/ via prefill-inherit.
 *   2. On blog post pages, render a soft share banner crediting the referrer
 *      and linking to /0deposit/?an=<slug>.
 *
 * Slugs use underscores to match /0deposit/agents.json. The free-form
 * fallback also tolerates dashes for safety.
 */
(function () {
  'use strict';

  if (typeof window === 'undefined' || !document) return;

  var STORAGE_KEY = 'mse_an';
  var DISMISS_KEY = 'mse_an_banner_dismissed';
  var REGISTRY_URL = '/referrers.json';

  // ── 1. Read & sanitize the slug ─────────────────────────────────────────
  var url;
  try { url = new URL(window.location.href); } catch (e) { return; }
  var rawAn = url.searchParams.get('an') || '';
  if (!rawAn) {
    try { rawAn = sessionStorage.getItem(STORAGE_KEY) || ''; } catch (e) {}
  }
  var slug = sanitizeSlug(rawAn);
  if (!slug) return;

  try { sessionStorage.setItem(STORAGE_KEY, slug); } catch (e) {}

  // ── 2. Rewrite same-origin internal links so ?an= rides along ──────────
  rewriteLinks(slug);

  // ── 3. On blog posts, render the share banner (after registry lookup) ─
  if (isBlogPost() && !isDismissed()) {
    lookupReferrer(slug, function (entry) {
      injectBanner(slug, entry);
    });
  }

  // ────────────────────────────────────────────────────────────────────────
  function sanitizeSlug(raw) {
    return String(raw || '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 80);
  }

  function isBlogPost() {
    var p = location.pathname.toLowerCase();
    // Blog posts live at /blog/<slug>.html. Exclude /blog.html (the index).
    if (!p.startsWith('/blog/')) return false;
    if (!p.endsWith('.html')) return false;
    if (p === '/blog/index.html') return false;
    return true;
  }

  function isDismissed() {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1'; } catch (e) { return false; }
  }

  function rewriteLinks(slug) {
    var origin = location.origin;
    var sameOriginHosts = {};
    sameOriginHosts[origin] = true;
    sameOriginHosts['https://mdsmartenergy.com'] = true;
    sameOriginHosts['https://www.mdsmartenergy.com'] = true;
    sameOriginHosts['http://mdsmartenergy.com'] = true;
    sameOriginHosts['http://www.mdsmartenergy.com'] = true;

    function process(a) {
      if (!a || !a.getAttribute) return;
      if (a.hasAttribute('data-no-share-track')) return;
      var href = a.getAttribute('href');
      if (!href) return;

      // Skip non-navigation schemes
      var lower = href.trim().toLowerCase();
      if (lower.startsWith('tel:') ||
          lower.startsWith('mailto:') ||
          lower.startsWith('javascript:') ||
          lower.startsWith('sms:') ||
          lower.startsWith('#')) return;

      var target;
      try { target = new URL(href, location.href); } catch (e) { return; }

      var targetHost = target.protocol + '//' + target.host;
      if (!sameOriginHosts[targetHost]) return;

      // Already has an=? Don't override (preserves the banner's pre-baked link).
      if (target.searchParams.has('an')) return;

      target.searchParams.set('an', slug);

      // Preserve original href style: relative stays relative, absolute stays absolute.
      var newHref;
      if (/^https?:\/\//i.test(href)) {
        newHref = target.toString();
      } else {
        newHref = target.pathname + target.search + target.hash;
      }
      a.setAttribute('href', newHref);
    }

    var links = document.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) process(links[i]);

    // Catch links injected later (Paperform embed, dynamic widgets).
    if (typeof MutationObserver !== 'undefined') {
      var mo = new MutationObserver(function (muts) {
        for (var m = 0; m < muts.length; m++) {
          var added = muts[m].addedNodes;
          for (var j = 0; j < added.length; j++) {
            var node = added[j];
            if (node.nodeType !== 1) continue;
            if (node.tagName === 'A') process(node);
            if (node.querySelectorAll) {
              var nested = node.querySelectorAll('a[href]');
              for (var k = 0; k < nested.length; k++) process(nested[k]);
            }
          }
        }
      });
      mo.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  function lookupReferrer(slug, cb) {
    if (!window.fetch) { cb(null); return; }
    fetch(REGISTRY_URL, { cache: 'default' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.referrers) { cb(null); return; }
        var entry = data.referrers[slug];
        cb(entry && entry.name ? entry : null);
      })
      .catch(function () { cb(null); });
  }

  function titleCase(slug) {
    return slug
      .split(/[_-]+/)
      .filter(Boolean)
      .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); })
      .join(' ');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function firstNameOf(fullName) {
    return String(fullName).trim().split(/\s+/)[0] || fullName;
  }

  function injectBanner(slug, entry) {
    if (document.querySelector('.mse-share-banner')) return; // already injected
    var siteHeader = document.querySelector('.site-header');
    if (!siteHeader || !siteHeader.parentNode) return;

    var displayName, displayCompany;
    if (entry && entry.name) {
      displayName = entry.name;
      displayCompany = entry.company || null;
    } else {
      displayName = titleCase(slug);
      displayCompany = null;
    }

    var firstName = firstNameOf(displayName);
    var lineHtml;
    if (displayCompany) {
      lineHtml =
        '<strong>' + escapeHtml(firstName) + ' at ' + escapeHtml(displayCompany) + '</strong>' +
        " thought you'd find this useful.";
    } else {
      lineHtml =
        '<strong>' + escapeHtml(displayName) + '</strong>' +
        " thought you'd find this useful.";
    }

    var offerHref = '/0deposit/?an=' + encodeURIComponent(slug);

    var banner = document.createElement('div');
    banner.className = 'mse-share-banner';
    banner.setAttribute('role', 'note');
    banner.setAttribute('aria-label', 'Shared with you by ' + displayName);
    banner.innerHTML =
      '<div class="mse-share-banner-inner">' +
        '<svg class="mse-share-banner-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
          '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>' +
        '<div class="mse-share-banner-text">' +
          '<span class="mse-share-banner-line">' + lineHtml + '</span>' +
          '<a class="mse-share-banner-cta" href="' + escapeHtml(offerHref) + '" data-no-share-track>' +
            'Check out the special offer they have for you' +
            ' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
              '<path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg>' +
          '</a>' +
        '</div>' +
        '<button type="button" class="mse-share-banner-dismiss" aria-label="Dismiss this message">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
            '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
          '</svg>' +
        '</button>' +
      '</div>';

    siteHeader.parentNode.insertBefore(banner, siteHeader.nextSibling);

    var dismissBtn = banner.querySelector('.mse-share-banner-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', function () {
        try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
        banner.parentNode && banner.parentNode.removeChild(banner);
      });
    }
  }
})();
