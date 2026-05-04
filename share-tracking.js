/* Maryland Smart Energy — share-tracking.
 *
 * Four responsibilities:
 *   1. Read ?an=<slug> (and ?co=<company>) from the URL or sessionStorage,
 *      persist them, and append them onto every same-origin <a href>. The
 *      slug rides along with the visitor and lands in the hidden form field
 *      on /contact.html and in the Paperform embed on /0deposit/ via
 *      prefill-inherit.
 *   2. On blog post pages, render a soft share banner crediting the referrer
 *      and linking to /0deposit/?an=<slug>.
 *   3. On blog post pages, also inject a "Share & get credit" widget at the
 *      bottom of the article so any reader can become a referrer for their
 *      own network.
 *   4. On contact.html, resolve the slug to a full name (and company when
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
  var STORAGE_KEY_CO = 'mse_co';
  var DISMISS_KEY = 'mse_an_banner_dismissed';
  var REFERRERS_URL = '/referrers.json';
  var AGENTS_URL = '/0deposit/agents.json';

  // ── 1. Read & sanitize the slug + optional company override ────────────
  var url;
  try { url = new URL(window.location.href); } catch (e) { return; }
  var rawAn = url.searchParams.get('an') || '';
  var rawCo = url.searchParams.get('co') || '';
  if (!rawAn) {
    try { rawAn = sessionStorage.getItem(STORAGE_KEY) || ''; } catch (e) {}
  }
  if (!rawCo) {
    try { rawCo = sessionStorage.getItem(STORAGE_KEY_CO) || ''; } catch (e) {}
  }
  var slug = sanitizeSlug(rawAn);
  var companyOverride = sanitizeCompany(rawCo);

  // The share-credit widget renders even when ?an= is absent, so don't bail
  // out here. We just skip the rest of the slug-bound logic.
  if (slug) {
    try { sessionStorage.setItem(STORAGE_KEY, slug); } catch (e) {}
    if (companyOverride) {
      try { sessionStorage.setItem(STORAGE_KEY_CO, companyOverride); } catch (e) {}
    }
    // ── 2. Rewrite same-origin internal links so ?an= (and ?co=) ride along
    rewriteLinks(slug, companyOverride);

    // ── 3. Resolve slug → full name (+ company) and apply page UI ────────
    resolveAffiliate(slug, companyOverride).then(function (affiliate) {
      if (isBlogPost() && !isDismissed()) injectShareBanner(slug, affiliate);
      applyToContactPage(slug, affiliate);
    });
  }

  // ── 4. Inject share-credit widget on blog posts (always, regardless of an)
  if (isBlogPost()) injectShareCreditWidget();

  // ────────────────────────────────────────────────────────────────────────
  function sanitizeSlug(raw) {
    return String(raw || '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 80);
  }

  // Looser than slug — visitors type free-form company names with spaces and
  // ampersands. Strip HTML-dangerous chars + newlines, collapse whitespace,
  // cap length.
  function sanitizeCompany(raw) {
    return String(raw || '')
      .replace(/[<>"'`\\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80);
  }

  // Convert a free-form name into a slug suitable for ?an=.
  function nameToSlug(name) {
    return String(name || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip diacritics
      .replace(/[^a-z0-9\s_-]/g, '')
      .trim()
      .replace(/[\s_-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 60);
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

  function rewriteLinks(slug, company) {
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

      var changed = false;
      if (!target.searchParams.has('an')) {
        target.searchParams.set('an', slug);
        changed = true;
      }
      if (company && !target.searchParams.has('co')) {
        target.searchParams.set('co', company);
        changed = true;
      }
      if (!changed) return;

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

  // Resolve the slug → { name, company, source }. Priority:
  //   1. referrers.json (curated)
  //   2. /0deposit/agents.json (sales agents)
  //   3. ?co= URL parameter (self-encoded sharer with company)
  //   4. Title-case the slug (free-form fallback)
  function resolveAffiliate(slug, companyOverride) {
    if (!window.fetch) {
      return Promise.resolve({
        name: titleCase(slug),
        company: companyOverride || null,
        source: companyOverride ? 'self-encoded' : 'fallback',
      });
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
        return {
          name: titleCase(slug),
          company: companyOverride || null,
          source: companyOverride ? 'self-encoded' : 'fallback',
        };
      });
  }

  // ── Blog post: top sticky share banner ─────────────────────────────────
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
    if (displayCompany && affiliate.source === 'self-encoded') {
      offerHref += '&co=' + encodeURIComponent(displayCompany);
    }

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

  // ── Blog post: bottom-of-article share-credit widget ───────────────────
  // Lets ANY visitor become a referrer for their own network. Inputs name
  // (required) and company (optional), generates a personalized URL, and
  // exposes LinkedIn / X / email / copy-link actions.
  function injectShareCreditWidget() {
    if (document.querySelector('.mse-share-credit')) return;
    var article = document.querySelector('article.post-body');
    if (!article) return;

    var widget = document.createElement('section');
    widget.className = 'mse-share-credit';
    widget.innerHTML =
      '<div class="mse-share-credit-inner">' +
        '<div class="mse-share-credit-eyebrow">Share &amp; Get Credit</div>' +
        '<h2 class="mse-share-credit-title">Know someone in your network who needs to read this?</h2>' +
        '<p class="mse-share-credit-sub">Share this article with your contacts. If your share leads to a project we close, we\'ll know it came from you.</p>' +
        '<div class="mse-share-credit-form" data-state="empty">' +
          '<div class="mse-share-credit-fields">' +
            '<label class="mse-share-credit-field">' +
              '<span class="mse-share-credit-label">Your name <em>*</em></span>' +
              '<input type="text" class="mse-share-credit-name" placeholder="Sarah Smith" maxlength="60" autocomplete="name" />' +
            '</label>' +
            '<label class="mse-share-credit-field">' +
              '<span class="mse-share-credit-label">Company <em class="mse-share-credit-optional">(optional)</em></span>' +
              '<input type="text" class="mse-share-credit-company" placeholder="Smith Properties LLC" maxlength="80" autocomplete="organization" />' +
            '</label>' +
          '</div>' +
        '</div>' +
        '<div class="mse-share-credit-actions" hidden>' +
          '<div class="mse-share-credit-url-row">' +
            '<input type="text" class="mse-share-credit-url" readonly aria-label="Your personalized share link" />' +
            '<button type="button" class="mse-share-credit-copy" data-no-share-track>Copy link</button>' +
          '</div>' +
          '<div class="mse-share-credit-buttons">' +
            '<a class="mse-share-credit-btn mse-share-credit-li" target="_blank" rel="noopener noreferrer" data-no-share-track>' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 18V9.93H5.67V18h2.67zM7 8.78a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1zM18.34 18v-4.42c0-2.49-1.34-3.65-3.13-3.65a2.7 2.7 0 0 0-2.46 1.36V9.93H10.1c.04.78 0 8.07 0 8.07h2.66v-4.5c0-.24.02-.48.09-.65.19-.48.63-.98 1.36-.98.96 0 1.34.73 1.34 1.8V18h2.66z"/></svg>' +
              ' Share to LinkedIn' +
            '</a>' +
            '<a class="mse-share-credit-btn mse-share-credit-tw" target="_blank" rel="noopener noreferrer" data-no-share-track>' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zM17.083 19.77h1.833L7.084 4.126H5.117z"/></svg>' +
              ' Share to X' +
            '</a>' +
            '<a class="mse-share-credit-btn mse-share-credit-em" data-no-share-track>' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"/></svg>' +
              ' Email it' +
            '</a>' +
          '</div>' +
          '<p class="mse-share-credit-fineprint">Honor system — we trust the name you enter. If a lead comes in via your link, we\'ll reach out.</p>' +
        '</div>' +
      '</div>';

    article.appendChild(widget);

    var nameInput = widget.querySelector('.mse-share-credit-name');
    var companyInput = widget.querySelector('.mse-share-credit-company');
    var actions = widget.querySelector('.mse-share-credit-actions');
    var urlField = widget.querySelector('.mse-share-credit-url');
    var copyBtn = widget.querySelector('.mse-share-credit-copy');
    var liBtn = widget.querySelector('.mse-share-credit-li');
    var twBtn = widget.querySelector('.mse-share-credit-tw');
    var emBtn = widget.querySelector('.mse-share-credit-em');

    var docTitle = document.title.split('|')[0].trim() || document.title;

    function update() {
      var name = nameInput.value.trim();
      var company = sanitizeCompany(companyInput.value);
      var nameSlug = nameToSlug(name);
      if (!nameSlug || nameSlug.length < 2) {
        actions.hidden = true;
        return;
      }
      var base = location.origin + location.pathname;
      var qs = '?an=' + encodeURIComponent(nameSlug);
      if (company) qs += '&co=' + encodeURIComponent(company);
      var shareUrl = base + qs;
      urlField.value = shareUrl;

      var encUrl = encodeURIComponent(shareUrl);
      var encTitle = encodeURIComponent(docTitle);
      liBtn.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encUrl;
      twBtn.href = 'https://twitter.com/intent/tweet?url=' + encUrl + '&text=' + encTitle;
      emBtn.href = 'mailto:?subject=' + encTitle + '&body=' + encodeURIComponent('Thought you\'d find this useful:\n\n' + shareUrl);

      actions.hidden = false;
    }

    nameInput.addEventListener('input', update);
    companyInput.addEventListener('input', update);

    copyBtn.addEventListener('click', function () {
      var v = urlField.value;
      if (!v) return;
      var done = function () {
        var prev = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('is-copied');
        setTimeout(function () {
          copyBtn.textContent = prev;
          copyBtn.classList.remove('is-copied');
        }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(v).then(done, function () {
          urlField.select();
          try { document.execCommand('copy'); } catch (e) {}
          done();
        });
      } else {
        urlField.select();
        try { document.execCommand('copy'); } catch (e) {}
        done();
      }
    });
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

    if (messageField && !messageField.value) {
      var refLine = displayCompany
        ? 'Referred by ' + displayName + ' at ' + displayCompany + '.'
        : 'Referred by ' + displayName + '.';
      messageField.value = refLine + '\n\n';
    }
  }
})();
