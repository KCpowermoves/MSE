/* Maryland Smart Energy — share-tracking.
 *
 * Three responsibilities:
 *   1. Read ?an=<slug> from the URL (or sessionStorage), persist it, and
 *      append it onto every same-origin <a href>. The slug rides along with
 *      the visitor and lands in the hidden form field on /contact.html and
 *      in the Paperform embed on /0deposit/ via prefill-inherit.
 *   2. On blog post pages, render a soft share banner crediting the referrer
 *      and linking to /0deposit/?an=<slug>.
 *   3. On contact.html, resolve the slug to a full name (and company when
 *      known), update the offer banner accordingly, and pre-fill the
 *      "Tell Us About Your Building" textarea with "Referred by ...".
 *
 * Slugs use underscores to match /0deposit/agents.json. The free-form
 * fallback also tolerates dashes for safety.
 */
(function () {
  'use strict';

  if (typeof window === 'undefined' || !document) return;

  var STORAGE_KEY = 'mse_an';
  var DISMISS_KEY = 'mse_an_banner_dismissed';
  var REFERRERS_URL = '/referrers.json';
  var AGENTS_URL = '/0deposit/agents.json';

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

  // ── 3. Resolve slug → full name (+ company) and apply page-specific UI ─
  resolveAffiliate(slug).then(function (affiliate) {
    if (isBlogPost() && !isDismissed()) injectShareBanner(slug, affiliate);
    applyToContactPage(slug, affiliate);
  });

  // ────────────────────────────────────────────────────────────────────────
  function sanitizeSlug(raw) {
    return String(raw || '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 80);
  }

  function isBlogPost() {
    var p = location.pathname.toLowerCase();
    if (!p.startsWith('/blog/')) return false;
    if (!p.endsWith('.html')) return false;
    if (p === '/blog/index.html') return false;
    return true;
  }

  function isDismissed() {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1'; } catch (e) { return false; }
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

      if (target.searchParams.has('an')) return;

      target.searchParams.set('an', slug);

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

  // Resolve the slug → { name, company, source } by checking referrers.json
  // first, then 0deposit/agents.json. Falls back to title-case when neither
  // has the slug. Always resolves (never rejects).
  function resolveAffiliate(slug) {
    if (!window.fetch) {
      return Promise.resolve({ name: titleCase(slug), company: null, source: 'fallback' });
    }
    var fetchJson = function (url) {
      return fetch(url, { cache: 'default' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });
    };
    return Promise.all([fetchJson(REFERRERS_URL), fetchJson(AGENTS_URL)])
      .then(function (results) {
        var refData = results[0];
        var agentData = results[1];
        var refEntry = refData && refData.referrers && refData.referrers[slug];
        if (refEntry && refEntry.name) {
          return { name: refEntry.name, company: refEntry.company || null, source: 'referrers' };
        }
        var agentEntry = agentData && agentData[slug];
        if (agentEntry && agentEntry.name) {
          return { name: agentEntry.name, company: agentEntry.company || null, source: 'agents' };
        }
        return { name: titleCase(slug), company: null, source: 'fallback' };
      });
  }

  // ── Blog post share banner ─────────────────────────────────────────────
  function injectShareBanner(slug, affiliate) {
    if (document.querySelector('.mse-share-banner')) return;
    var siteHeader = document.querySelector('.site-header');
    if (!siteHeader || !siteHeader.parentNode) return;

    var displayName = affiliate.name;
    var displayCompany = affiliate.company;
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

    siteHeader.appendChild(banner);

    var dismissBtn = banner.querySelector('.mse-share-banner-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', function () {
        try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
        banner.parentNode && banner.parentNode.removeChild(banner);
      });
    }
  }

  // ── Contact-page enhancements (offer banner copy + message prefill) ─────
  function applyToContactPage(slug, affiliate) {
    var offerBanner = document.getElementById('offer-banner');
    var offerBannerTitle = document.getElementById('offer-banner-title');
    var offerBannerBody = document.getElementById('offer-banner-body');
    var messageField = document.getElementById('message');

    if (!offerBanner && !messageField) return;

    var hasOffer = (function () {
      var u; try { u = new URL(window.location.href); } catch (e) { return false; }
      var fromUrl = u.searchParams.get('offer');
      var fromStorage = '';
      try { fromStorage = sessionStorage.getItem('mse_offer') || ''; } catch (e) {}
      return (fromUrl || fromStorage) === '0deposit';
    })();

    var displayName = affiliate.name;
    var displayCompany = affiliate.company;
    var nameWithCompany = displayCompany ? displayName + ' at ' + displayCompany : displayName;

    // Offer banner copy
    if (offerBanner && offerBannerTitle) {
      if (hasOffer) {
        offerBannerTitle.textContent = '✓ Your $0 Deposit Offer from ' + nameWithCompany + ' Has Been Applied';
        if (offerBannerBody) {
          offerBannerBody.textContent = "No deposit required. Complete this form and we'll reach out to confirm your appointment.";
        }
        offerBanner.style.display = 'flex';
      } else {
        offerBannerTitle.textContent = '✓ Referred by ' + nameWithCompany;
        if (offerBannerBody) {
          offerBannerBody.textContent = "We'll let " + firstNameOf(displayName) + " know your request came through. Complete this form and we'll reach out to confirm your appointment.";
        }
        offerBanner.style.display = 'flex';
      }
    }

    // Pre-fill the "Tell Us About Your Building" textarea, but only if it's empty
    if (messageField && !messageField.value) {
      var refLine = displayCompany
        ? 'Referred by ' + displayName + ' at ' + displayCompany + '.'
        : 'Referred by ' + displayName + '.';
      messageField.value = refLine + '\n\n';
    }
  }
})();
