/* ==========================================================================
   Orizons Studio — Cookie Consent Banner + Preference Center
   ========================================================================== */

(function () {
  "use strict";

  var GA_MEASUREMENT_ID = "G-22SYNHXC59";
  var COOKIE_NAME = "orizons_consent";
  var COOKIE_MAX_AGE_DAYS = 365;
  var COOKIE_POLICY_URL = "/cookie-policy";

  function setCookie(name, value, days) {
    var maxAge = days * 24 * 60 * 60;
    var secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie =
      name + "=" + encodeURIComponent(value) +
      "; path=/; max-age=" + maxAge + "; SameSite=Lax" + secure;
  }

  function getCookie(name) {
    var match = document.cookie.match(
      new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)")
    );
    return match ? decodeURIComponent(match[1]) : null;
  }

  function deleteCookie(name) {
    var hostParts = window.location.hostname.split(".");
    var domains = [""];
    if (hostParts.length > 1) domains.push("; domain=." + hostParts.slice(-2).join("."));
    domains.forEach(function (domain) {
      document.cookie = name + "=; path=/; max-age=0" + domain;
    });
  }

  function readConsent() {
    var raw = getCookie(COOKIE_NAME);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function writeConsent(analytics) {
    var consent = { analytics: !!analytics, ts: Date.now(), v: 1 };
    setCookie(COOKIE_NAME, JSON.stringify(consent), COOKIE_MAX_AGE_DAYS);
    return consent;
  }

  function loadAnalytics() {
    if (window.__ocGaLoaded) return;
    window.__ocGaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
    document.head.appendChild(script);
  }

  function revokeAnalytics() {
    window.__ocGaLoaded = false;
    window.dataLayer = [];
    deleteCookie("_ga");
    document.cookie.split(";").forEach(function (c) {
      var name = c.split("=")[0].trim();
      if (name.indexOf("_ga_") === 0) deleteCookie(name);
    });
  }

  var COOKIE_ROWS = {
    necessary: [
      { name: "orizons_consent", duration: "1 year", purpose: "Stores your cookie consent preference so the banner does not appear on every visit." }
    ],
    analytics: [
      { name: "_ga", duration: "2 years", purpose: "Assigns a unique ID to distinguish users and count visits (Google Analytics 4)." },
      { name: "_ga_22SYNHXC59", duration: "2 years", purpose: "Persists session state across page requests (Google Analytics 4)." }
    ]
  };

  function cookieTable(rows) {
    var html = '<table class="oc-cookie-table"><thead><tr><th>Cookie</th><th>Duration</th><th>Purpose</th></tr></thead><tbody>';
    rows.forEach(function (r) {
      html += "<tr><td>" + r.name + "</td><td>" + r.duration + "</td><td>" + r.purpose + "</td></tr>";
    });
    return html + "</tbody></table>";
  }

  function buildBanner() {
    var el = document.createElement("div");
    el.id = "oc-banner";
    el.setAttribute("role", "region");
    el.setAttribute("aria-label", "Cookie consent");
    el.innerHTML =
      '<div class="oc-copy">' +
        '<p class="oc-title">We value your privacy</p>' +
        '<p class="oc-text">We use cookies to operate this site and, with your consent, to understand how it is used. ' +
        'See our <a href="' + COOKIE_POLICY_URL + '">Cookie Policy</a>.</p>' +
      '</div>' +
      '<div class="oc-actions">' +
        '<button type="button" class="oc-btn oc-btn-text" id="oc-open-settings">Cookie settings</button>' +
        '<button type="button" class="oc-btn oc-btn-outline" id="oc-reject-all">Reject all</button>' +
        '<button type="button" class="oc-btn oc-btn-solid" id="oc-accept-all">Accept all</button>' +
      '</div>';
    return el;
  }

  function buildPreferenceCenter(state) {
    var overlay = document.createElement("div");
    overlay.id = "oc-pc-overlay";
    overlay.setAttribute("role", "presentation");
    overlay.innerHTML =
      '<div id="oc-pc" role="dialog" aria-modal="true" aria-labelledby="oc-pc-title">' +
        '<div class="oc-pc-header">' +
          '<h2 id="oc-pc-title">Privacy Preference Centre</h2>' +
          '<button type="button" id="oc-pc-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<p class="oc-pc-intro">When you visit orizons.in we store cookies on your browser. Choose which categories you allow below. Strictly necessary cookies cannot be switched off — they are required for the site to function.</p>' +
        '<div class="oc-pc-body">' +
          '<div class="oc-cat" data-open="false">' +
            '<div class="oc-cat-head" tabindex="0" role="button" aria-expanded="false">' +
              '<span class="oc-cat-label"><span class="oc-chevron" aria-hidden="true"></span>Strictly necessary cookies</span>' +
              '<span class="oc-always-on">Always active</span>' +
            '</div>' +
            '<div class="oc-cat-detail"><p>Essential for the website to function correctly, such as remembering your cookie choice. These cannot be disabled.</p>' + cookieTable(COOKIE_ROWS.necessary) + '</div>' +
          '</div>' +
          '<div class="oc-cat" data-open="false">' +
            '<div class="oc-cat-head" tabindex="0" role="button" aria-expanded="false">' +
              '<span class="oc-cat-label"><span class="oc-chevron" aria-hidden="true"></span>Analytics cookies</span>' +
              '<div class="oc-toggle" id="oc-analytics-toggle" role="switch" tabindex="0" aria-checked="' + (state.analytics ? "true" : "false") + '" aria-label="Analytics cookies"><div class="oc-toggle-knob"></div></div>' +
            '</div>' +
            '<div class="oc-cat-detail"><p>Help us understand how visitors use the site (Google Analytics 4) so we can improve it. Only set if you consent.</p>' + cookieTable(COOKIE_ROWS.analytics) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="oc-pc-footer">' +
          '<button type="button" class="oc-btn oc-btn-outline" id="oc-pc-reject-all">Reject all</button>' +
          '<button type="button" class="oc-btn oc-btn-solid" id="oc-pc-confirm">Confirm my choices</button>' +
        '</div>' +
      '</div>';
    return overlay;
  }

  var bannerEl = null;
  var overlayEl = null;
  var lastFocused = null;

  function removeBanner() {
    if (bannerEl && bannerEl.parentNode) bannerEl.parentNode.removeChild(bannerEl);
    bannerEl = null;
  }

  function showBanner() {
    if (bannerEl) return;
    bannerEl = buildBanner();
    document.body.appendChild(bannerEl);
    document.getElementById("oc-accept-all").addEventListener("click", function () { applyConsent(true); removeBanner(); });
    document.getElementById("oc-reject-all").addEventListener("click", function () { applyConsent(false); removeBanner(); });
    document.getElementById("oc-open-settings").addEventListener("click", openPreferences);
  }

  function closePreferences() {
    if (overlayEl && overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl);
    overlayEl = null;
    document.removeEventListener("keydown", onPcKeydown);
    if (lastFocused) lastFocused.focus();
  }

  function onPcKeydown(e) {
    if (e.key === "Escape") { closePreferences(); return; }
    if (e.key === "Tab" && overlayEl) {
      var focusables = overlayEl.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  function openPreferences() {
    var current = readConsent() || { analytics: false };
    lastFocused = document.activeElement;
    overlayEl = buildPreferenceCenter(current);
    document.body.appendChild(overlayEl);

    var toggle = document.getElementById("oc-analytics-toggle");
    function flipToggle() {
      toggle.setAttribute("aria-checked", toggle.getAttribute("aria-checked") === "true" ? "false" : "true");
    }
    toggle.addEventListener("click", flipToggle);
    toggle.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flipToggle(); } });

    Array.prototype.forEach.call(overlayEl.querySelectorAll(".oc-cat-head"), function (head) {
      function toggleOpen() {
        var cat = head.parentNode;
        var isOpen = cat.getAttribute("data-open") === "true";
        cat.setAttribute("data-open", isOpen ? "false" : "true");
        head.setAttribute("aria-expanded", isOpen ? "false" : "true");
      }
      head.addEventListener("click", function (e) { if (!e.target.closest("#oc-analytics-toggle")) toggleOpen(); });
      head.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && !e.target.closest("#oc-analytics-toggle")) { e.preventDefault(); toggleOpen(); } });
    });

    document.getElementById("oc-pc-close").addEventListener("click", closePreferences);
    document.getElementById("oc-pc-reject-all").addEventListener("click", function () { applyConsent(false); closePreferences(); removeBanner(); });
    document.getElementById("oc-pc-confirm").addEventListener("click", function () {
      applyConsent(toggle.getAttribute("aria-checked") === "true");
      closePreferences(); removeBanner();
    });
    document.addEventListener("keydown", onPcKeydown);
    document.getElementById("oc-pc-close").focus();
  }

  function applyConsent(analyticsGranted) {
    writeConsent(analyticsGranted);
    if (analyticsGranted) loadAnalytics(); else revokeAnalytics();
  }

  function init() {
    var consent = readConsent();
    if (consent === null) showBanner();
    else if (consent.analytics) loadAnalytics();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.OrizonsConsent = {
    openPreferences: openPreferences,
    getConsent: readConsent,
    resetConsent: function () { deleteCookie(COOKIE_NAME); revokeAnalytics(); showBanner(); }
  };
})();
