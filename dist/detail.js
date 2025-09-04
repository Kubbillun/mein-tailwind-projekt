// public/detail.js
// Rendert eine Karte anhand der ID (?id=...) aus cards.json

(function () {
  const el = {
    title: document.querySelector("h1"),
    detail: document.getElementById("card-detail"),
  };

  function setStatus(msg) {
    if (el.detail) el.detail.innerHTML = `<p class="muted">${escapeHtml(msg)}</p>`;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function getId() {
    const usp = new URLSearchParams(window.location.search);
    return usp.get("id");
  }

  async function loadCard(id) {
    // cards.json liegt im Root der gebauten Seite (dist/cards.json)
    const res = await fetch("cards.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`cards.json laden fehlgeschlagen (${res.status})`);
    const data = await res.json();

    // Formatvarianten abfangen (Array oder Objekt mit cards-Array)
    const list = Array.isArray(data) ? data : (Array.isArray(data.cards) ? data.cards : []);
    return list.find((c) => c.id === id) || null;
  }

  function renderCard(card) {
    if (!el.detail) return;
    el.detail.innerHTML = `
      <dl>
        <dt>Name</dt><dd>${escapeHtml(card.name || "—")}</dd>
        <dt>Club</dt><dd>${escapeHtml(card.club || "—")}</dd>
        <dt>ID</dt><dd>${escapeHtml(card.id || "—")}</dd>
        <dt>Variante</dt><dd>${escapeHtml(card.variant || "—")}</dd>
        <dt>Seltenheit</dt><dd>${escapeHtml(card.rarity || "—")}</dd>
      </dl>
    `;
  }

  async function main() {
    try {
      const id = getId();
      if (!id) {
        setStatus("Kein Karten‑ID‑Parameter ?id=…");
        return;
      }

      setStatus("Lade Karte…");
      const card = await loadCard(id);
      if (!card) {
        setStatus("Karte nicht gefunden.");
        return;
      }

      setStatus("");
      renderCard(card);
    } catch (err) {
      console.error(err);
      setStatus("Fehler beim Laden.");
    }
  }

  main();
})();
