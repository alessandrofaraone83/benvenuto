(function () {
  function trackCta(link) {
    var detail = {
      event: "cta_click",
      cta: link.getAttribute("data-track-cta") || "link",
      channel: link.getAttribute("data-track-channel") || "",
      href: link.href,
      label: link.textContent.trim(),
    };

    window.dispatchEvent(new CustomEvent("benvenuto:cta-click", { detail: detail }));

    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(detail);
    }

    if (typeof window.gtag === "function") {
      window.gtag("event", detail.event, {
        event_category: "CTA",
        event_label: detail.label,
        channel: detail.channel,
        cta: detail.cta,
      });
    }

    if (typeof window.plausible === "function") {
      window.plausible("CTA click", { props: detail });
    }
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest("a[data-track-cta]");
    if (!link) return;
    trackCta(link);
  });
})();
