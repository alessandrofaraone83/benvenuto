const app = document.querySelector("#app");

const categoryOrder = ["ristoranti", "bar", "spiagge", "supermercati", "farmacie", "luoghi"];
const localeNames = {
  it: "IT",
  en: "EN",
  fr: "FR",
  de: "DE",
  es: "ES",
};

function getClientSlug() {
  // Cloudflare Pages riscrive /clienti/slug su cliente.html mantenendo l'URL originale.
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts[0] === "clienti" && parts[1]) {
    return parts[1];
  }

  const params = new URLSearchParams(window.location.search);
  return params.get("cliente") || "macaluhome";
}

function getClientDataUrl(slug) {
  const path = `data/clienti/${encodeURIComponent(slug)}.json`;
  return window.location.protocol === "file:" ? path : `/${path}`;
}

function escapeHtml(value = "") {
  // I contenuti arrivano dai JSON cliente: li rendiamo sicuri prima dell'inserimento.
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function assetUrl(path = "") {
  if (window.location.protocol === "file:" && path.startsWith("/")) {
    return path.slice(1);
  }
  return path;
}

function normalizePhone(phone = "") {
  return String(phone).replace(/[^\d+]/g, "");
}

function link(url, label, className = "button button-secondary", external = true) {
  if (!url) return "";
  const target = external ? ' target="_blank" rel="noopener"' : "";
  return `<a class="${className}" href="${escapeHtml(url)}"${target}>${escapeHtml(label)}</a>`;
}

function getSupportedLocales(data) {
  return data.supportedLocales?.length ? data.supportedLocales : Object.keys(data.locales || {});
}

function chooseLocale(data) {
  const supported = getSupportedLocales(data);
  const fallback = data.defaultLocale || supported[0] || "it";
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("lang");

  if (supported.includes(requested)) {
    localStorage.setItem("benvenutoLocale", requested);
    return requested;
  }

  const saved = localStorage.getItem("benvenutoLocale");
  if (supported.includes(saved)) return saved;

  const browserLocales = navigator.languages?.length ? navigator.languages : [navigator.language];
  const browserMatch = browserLocales
    .map((locale) => locale?.slice(0, 2).toLowerCase())
    .find((locale) => supported.includes(locale));

  return browserMatch || fallback;
}

function getLocalizedData(data, locale) {
  if (!data.locales) return { ...data, locale };

  const fallback = data.defaultLocale || "it";
  const copy = data.locales[locale] || data.locales[fallback] || {};
  return {
    ...data,
    ...copy,
    locale,
  };
}

function renderLanguageSwitcher(data, activeLocale) {
  const supported = getSupportedLocales(data);
  if (supported.length < 2) return "";

  return `
    <nav class="language-switcher" aria-label="Seleziona lingua">
      ${supported.map((locale) => `
        <button class="language-button${locale === activeLocale ? " is-active" : ""}" type="button" data-locale="${escapeHtml(locale)}" aria-pressed="${locale === activeLocale}">
          ${escapeHtml(localeNames[locale] || locale.toUpperCase())}
        </button>
      `).join("")}
    </nav>
  `;
}

function renderInfoCard(label, value, href = "") {
  const content = href
    ? `<a class="info-value" href="${escapeHtml(href)}">${escapeHtml(value || "Da verificare")}</a>`
    : `<span class="info-value">${escapeHtml(value || "Da verificare")}</span>`;

  return `
    <article class="info-card">
      <span class="info-label">${escapeHtml(label)}</span>
      ${content}
    </article>
  `;
}

function renderList(items = [], className = "rule-list") {
  return `<ul class="${className}">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderInstructions(items = []) {
  return items.map((item) => `
    <article class="instruction-card">
      <h3>${escapeHtml(item.titolo)}</h3>
      <p>${escapeHtml(item.testo)}</p>
    </article>
  `).join("");
}

function renderMediaSections(data, content) {
  const sections = content.mediaSections || [];
  if (!sections.length) return "";

  return `
    <section class="client-section">
      <div class="client-photo-grid">
        ${sections.map((section) => {
          const image = data.assets?.[section.asset];
          if (!image) return "";
          return `
            <article class="client-photo-card">
              <img src="${escapeHtml(assetUrl(image))}" alt="${escapeHtml(section.alt)}" loading="lazy">
              <div>
                <h2>${escapeHtml(section.title)}</h2>
                <p>${escapeHtml(section.text)}</p>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderTips(content) {
  const consigli = content.consigli || {};
  const labels = content.labels || {};
  const categoryLabels = content.categoryLabels || {};

  return categoryOrder.map((key) => {
    const items = consigli[key] || [];
    if (!items.length) return "";

    return `
      <div class="tip-category">
        <h3>${escapeHtml(categoryLabels[key] || key)}</h3>
        <div class="tips-grid">
          ${items.map((item) => `
            <article class="tip-card">
              <div>
                <h4>${escapeHtml(item.nome)}</h4>
                <p>${escapeHtml(item.descrizione)}</p>
                <span class="tip-distance">${escapeHtml(item.distanza)}</span>
              </div>
              ${link(item.url || item.mapsUrl, labels.openLink || "Apri link", "button button-secondary")}
            </article>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");
}

function renderNumbers(items = []) {
  return items.map((item) => `
    <article class="number-card">
      <span class="info-label">${escapeHtml(item.nome)}</span>
      <a class="info-value" href="tel:${escapeHtml(normalizePhone(item.telefono))}">${escapeHtml(item.telefono)}</a>
    </article>
  `).join("");
}

function renderSocial(social = {}, labels = {}) {
  const links = [];
  if (social.instagram) links.push(link(social.instagram, "Instagram", "button button-secondary"));
  if (social.sito) links.push(link(social.sito, labels.officialSite || "Sito ufficiale", "button button-secondary"));
  return links.length ? `<div class="social-links">${links.join("")}</div>` : "";
}

function renderClient(data, locale = chooseLocale(data)) {
  // Tutte le sezioni della guida sono generate dallo stesso template dati.
  const content = getLocalizedData(data, locale);
  const labels = content.labels || {};
  const heroImage = assetUrl(data.assets?.heroImage || content.heroImage || "");
  const logo = data.assets?.logo ? assetUrl(data.assets.logo) : "";
  const phone = data.host?.telefonoDisplay || data.host?.telefono || "";
  const telHref = `tel:${normalizePhone(data.host?.telefono || phone)}`;
  const mailHref = data.host?.email ? `mailto:${data.host.email}` : "";

  document.documentElement.lang = content.htmlLang || locale;
  document.title = `${data.nome} | ${content.title || "Guida ospiti"}`;

  app.className = "client-shell";
  app.innerHTML = `
    <section class="client-hero" style="background-image: linear-gradient(180deg, rgba(37,37,34,0.03), rgba(37,37,34,0.72)), url('${escapeHtml(heroImage)}');">
      ${renderLanguageSwitcher(data, locale)}
      <div class="client-hero-inner">
        <div class="client-hero-copy">
          ${logo ? `<img class="client-logo" src="${escapeHtml(logo)}" alt="${escapeHtml(data.nome)}" loading="eager">` : ""}
          <p class="eyebrow">${escapeHtml(data.payoff || content.payoff || "Guida ospiti")}</p>
          <h1>${escapeHtml(data.nome)}</h1>
          <p class="lead">${escapeHtml(content.descrizione)}</p>
          <p>${escapeHtml(content.benvenuto || "")}</p>
          <div class="hero-actions">
            ${link(`https://wa.me/${data.host?.whatsapp || ""}`, labels.whatsapp || "WhatsApp host", "button button-primary")}
            ${link(data.indirizzo?.mapsUrl, labels.maps || "Google Maps", "button button-secondary")}
          </div>
        </div>
        <aside class="client-hero-card">
          <p>${escapeHtml(content.heroCardTitle || content.quickInfoTitle || "Informazioni rapide")}</p>
          <h2>${escapeHtml(content.checkin)}</h2>
          <p>${escapeHtml(labels.checkin || "Check-in")}</p>
          <h2>${escapeHtml(content.checkout)}</h2>
          <p>${escapeHtml(labels.checkout || "Check-out")}</p>
          <h2>${escapeHtml(data.wifi?.rete || "Wi-Fi")}</h2>
          <p>${escapeHtml(labels.wifiNetwork || "Rete Wi-Fi")}</p>
        </aside>
      </div>
    </section>

    <section class="client-section">
      <h2 class="section-title">${escapeHtml(content.quickInfoTitle || "Informazioni rapide")}</h2>
      <div class="quick-grid">
        ${renderInfoCard(labels.checkin || "Check-in", content.checkin)}
        ${renderInfoCard(labels.checkout || "Check-out", content.checkout)}
        ${renderInfoCard(labels.wifi || "Wi-Fi", data.wifi?.rete)}
        ${renderInfoCard(labels.address || "Indirizzo", data.indirizzo?.testo)}
        ${renderInfoCard(labels.parking || "Parcheggio", content.parcheggio)}
        ${renderInfoCard(labels.host || "Contatto host", `${data.host?.nome || "Host"} · ${phone}`, telHref)}
        ${renderInfoCard(labels.phone || "Telefono", phone, telHref)}
        ${renderInfoCard(labels.email || "Email", data.host?.email, mailHref)}
      </div>
    </section>

    ${renderMediaSections(data, content)}

    <section class="client-section">
      <h2 class="section-title">${escapeHtml(content.wifiTitle || "Wi-Fi")}</h2>
      <div class="wifi-box">
        <p>${escapeHtml(labels.wifiNetwork || "Rete")}: <strong>${escapeHtml(data.wifi?.rete)}</strong></p>
        <span class="wifi-password" id="wifiPassword">${escapeHtml(data.wifi?.password)}</span>
        <button class="button button-primary" type="button" id="copyPassword">${escapeHtml(labels.copyPassword || "Copia password")}</button>
        <p class="copy-message" id="copyMessage" aria-live="polite"></p>
      </div>
    </section>

    <section class="client-section">
      <h2 class="section-title">${escapeHtml(content.rulesTitle || "Regole della casa")}</h2>
      ${renderList(content.regole)}
    </section>

    <section class="client-section">
      <h2 class="section-title">${escapeHtml(content.instructionsTitle || "Come usare la casa")}</h2>
      <div class="instructions-grid">${renderInstructions(content.istruzioniCasa)}</div>
    </section>

    <section class="client-section">
      <h2 class="section-title">${escapeHtml(content.locationTitle || "Dove siamo")}</h2>
      <article class="card">
        <h3>${escapeHtml(data.indirizzo?.testo)}</h3>
        <p>${escapeHtml(content.zona?.descrizione)}</p>
        ${link(data.indirizzo?.mapsUrl, labels.maps || "Google Maps", "button button-dark")}
      </article>
    </section>

    <section class="client-section">
      <h2 class="section-title">${escapeHtml(content.tipsTitle || "Consigli in zona")}</h2>
      ${renderTips(content)}
    </section>

    <section class="client-section">
      <h2 class="section-title">${escapeHtml(content.checkoutTitle || "Prima del check-out")}</h2>
      <article class="card">
        <h3>${escapeHtml(content.checkoutInfo?.orario)}</h3>
        ${renderList(content.checkoutInfo?.azioni, "checkout-list")}
        <p>${escapeHtml(content.checkoutInfo?.chiavi || "")}</p>
        <p><strong>${escapeHtml(content.checkoutInfo?.messaggio)}</strong></p>
      </article>
    </section>

    <section class="client-section">
      <h2 class="section-title">${escapeHtml(content.numbersTitle || "Numeri utili")}</h2>
      <div class="numbers-grid">${renderNumbers(content.numeriUtili)}</div>
    </section>

    <footer class="client-footer">
      ${logo ? `<img class="client-footer-logo" src="${escapeHtml(logo)}" alt="${escapeHtml(data.nome)}" loading="lazy">` : ""}
      <h2 class="section-title">${escapeHtml(data.nome)}</h2>
      <p>${escapeHtml(content.footerMessage || "Grazie per aver soggiornato da noi")}</p>
      ${renderSocial(data.social, labels)}
    </footer>
  `;

  bindCopyPassword(data.wifi?.password || "", labels);
  bindLanguageSwitcher(data);
}

function bindLanguageSwitcher(data) {
  document.querySelectorAll("[data-locale]").forEach((button) => {
    button.addEventListener("click", () => {
      const locale = button.getAttribute("data-locale");
      if (!getSupportedLocales(data).includes(locale)) return;

      localStorage.setItem("benvenutoLocale", locale);
      const url = new URL(window.location.href);
      url.searchParams.set("lang", locale);
      window.history.replaceState({}, "", url);
      renderClient(data, locale);
    });
  });
}

function bindCopyPassword(password, labels = {}) {
  const button = document.querySelector("#copyPassword");
  const message = document.querySelector("#copyMessage");
  if (!button || !message) return;

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(password);
      message.textContent = labels.passwordCopied || "Password copiata";
    } catch {
      message.textContent = labels.copyFallback || "Seleziona e copia manualmente la password";
    }
  });
}

function renderError() {
  document.title = "Guida non disponibile | Benvenuto Digitale";
  app.innerHTML = `
    <section class="error-state">
      <p class="eyebrow">Benvenuto Digitale</p>
      <h1>Guida non disponibile</h1>
      <p>La guida richiesta non è ancora attiva o il link non è corretto.</p>
    </section>
  `;
}

async function init() {
  const slug = getClientSlug();

  try {
    const response = await fetch(getClientDataUrl(slug), { cache: "no-store" });
    if (!response.ok) throw new Error("Client data not found");
    const data = await response.json();
    renderClient(data);
  } catch {
    renderError();
  }
}

init();
