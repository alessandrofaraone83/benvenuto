const app = document.querySelector("#app");

const categoryLabels = {
  ristoranti: "Ristoranti",
  bar: "Bar e colazioni",
  spiagge: "Spiagge",
  supermercati: "Supermercati",
  farmacie: "Farmacie",
  luoghi: "Luoghi da visitare",
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

function escapeHtml(value = "") {
  // I contenuti arrivano dai JSON cliente: li rendiamo sicuri prima dell'inserimento.
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function link(url, label, className = "button button-secondary") {
  if (!url) return "";
  return `<a class="${className}" href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`;
}

function renderInfoCard(label, value) {
  return `
    <article class="info-card">
      <span class="info-label">${escapeHtml(label)}</span>
      <span class="info-value">${escapeHtml(value || "Da verificare")}</span>
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

function renderTips(consigli = {}) {
  return Object.entries(categoryLabels).map(([key, label]) => {
    const items = consigli[key] || [];
    if (!items.length) return "";

    return `
      <div class="tip-category">
        <h3>${label}</h3>
        <div class="tips-grid">
          ${items.map((item) => `
            <article class="tip-card">
              <div>
                <h4>${escapeHtml(item.nome)}</h4>
                <p>${escapeHtml(item.descrizione)}</p>
                <span class="tip-distance">${escapeHtml(item.distanza)}</span>
              </div>
              ${link(item.mapsUrl, "Apri su Maps", "button button-secondary")}
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
      <a class="info-value" href="tel:${escapeHtml(item.telefono)}">${escapeHtml(item.telefono)}</a>
    </article>
  `).join("");
}

function renderSocial(social = {}) {
  const links = [];
  if (social.instagram) links.push(link(social.instagram, "Instagram", "button button-secondary"));
  if (social.sito) links.push(link(social.sito, "Sito ufficiale", "button button-secondary"));
  return links.length ? `<div class="social-links">${links.join("")}</div>` : "";
}

function renderClient(data) {
  // Tutte le sezioni della guida sono generate dallo stesso template dati.
  document.title = `${data.nome} | Guida ospiti`;

  app.className = "client-shell";
  app.innerHTML = `
    <section class="client-hero" style="background-image: linear-gradient(180deg, rgba(37,37,34,0.05), rgba(37,37,34,0.68)), url('${escapeHtml(data.heroImage)}');">
      <div class="client-hero-inner">
        <div class="client-hero-copy">
          <p class="eyebrow">${escapeHtml(data.payoff || "Guida ospiti")}</p>
          <h1>${escapeHtml(data.nome)}</h1>
          <p class="lead">${escapeHtml(data.descrizione)}</p>
          <p>${escapeHtml(data.benvenuto || "Benvenuti, siamo felici di ospitarvi.")}</p>
          <div class="hero-actions">
            ${link(`https://wa.me/${data.host?.whatsapp || ""}`, "WhatsApp host", "button button-primary")}
            ${link(data.indirizzo?.mapsUrl, "Google Maps", "button button-secondary")}
          </div>
        </div>
        <aside class="client-hero-card">
          <p>Informazioni rapide</p>
          <h2>${escapeHtml(data.checkin)}</h2>
          <p>Check-in</p>
          <h2>${escapeHtml(data.checkout)}</h2>
          <p>Check-out</p>
          <h2>${escapeHtml(data.wifi?.rete || "Wi-Fi")}</h2>
          <p>Rete Wi-Fi</p>
        </aside>
      </div>
    </section>

    <section class="client-section">
      <h2 class="section-title">Informazioni rapide</h2>
      <div class="quick-grid">
        ${renderInfoCard("Check-in", data.checkin)}
        ${renderInfoCard("Check-out", data.checkout)}
        ${renderInfoCard("Wi-Fi", data.wifi?.rete)}
        ${renderInfoCard("Indirizzo", data.indirizzo?.testo)}
        ${renderInfoCard("Parcheggio", data.parcheggio)}
        ${renderInfoCard("Contatto host", `${data.host?.nome || "Host"} · ${data.host?.telefono || ""}`)}
      </div>
    </section>

    <section class="client-section">
      <h2 class="section-title">Wi-Fi</h2>
      <div class="wifi-box">
        <p>Rete: <strong>${escapeHtml(data.wifi?.rete)}</strong></p>
        <span class="wifi-password" id="wifiPassword">${escapeHtml(data.wifi?.password)}</span>
        <button class="button button-primary" type="button" id="copyPassword">Copia password</button>
        <p class="copy-message" id="copyMessage" aria-live="polite"></p>
      </div>
    </section>

    <section class="client-section">
      <h2 class="section-title">Regole della casa</h2>
      ${renderList(data.regole)}
    </section>

    <section class="client-section">
      <h2 class="section-title">Come usare la casa</h2>
      <div class="instructions-grid">${renderInstructions(data.istruzioniCasa)}</div>
    </section>

    <section class="client-section">
      <h2 class="section-title">Dove siamo</h2>
      <article class="card">
        <h3>${escapeHtml(data.indirizzo?.testo)}</h3>
        <p>${escapeHtml(data.zona?.descrizione)}</p>
        ${link(data.indirizzo?.mapsUrl, "Google Maps", "button button-dark")}
      </article>
    </section>

    <section class="client-section">
      <h2 class="section-title">Consigli in zona</h2>
      ${renderTips(data.consigli)}
    </section>

    <section class="client-section">
      <h2 class="section-title">Prima del check-out</h2>
      <article class="card">
        <h3>${escapeHtml(data.checkoutInfo?.orario)}</h3>
        ${renderList(data.checkoutInfo?.azioni, "checkout-list")}
        <p>${escapeHtml(data.checkoutInfo?.chiavi || "")}</p>
        <p><strong>${escapeHtml(data.checkoutInfo?.messaggio)}</strong></p>
      </article>
    </section>

    <section class="client-section">
      <h2 class="section-title">Numeri utili</h2>
      <div class="numbers-grid">${renderNumbers(data.numeriUtili)}</div>
    </section>

    <footer class="client-footer">
      <h2 class="section-title">${escapeHtml(data.nome)}</h2>
      <p>Grazie per aver soggiornato da noi</p>
      ${renderSocial(data.social)}
    </footer>
  `;

  bindCopyPassword(data.wifi?.password || "");
}

function bindCopyPassword(password) {
  const button = document.querySelector("#copyPassword");
  const message = document.querySelector("#copyMessage");
  if (!button || !message) return;

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(password);
      message.textContent = "Password copiata";
    } catch {
      message.textContent = "Seleziona e copia manualmente la password";
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
    const response = await fetch(`/data/clienti/${encodeURIComponent(slug)}.json`, { cache: "no-store" });
    if (!response.ok) throw new Error("Client data not found");
    const data = await response.json();
    renderClient(data);
  } catch {
    renderError();
  }
}

init();
