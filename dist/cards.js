// scripts/cards.js
(() => {
  const SRC = "cards.json";

  // optionales Cache-Busting via ?cb=… durchreichen
  const params = new URLSearchParams(window.location.search);
  const cb = params.get("cb");
  const srcUrl = cb ? `${SRC}?cb=${encodeURIComponent(cb)}` : SRC;

  // "Quelle: …" anzeigen, wenn ein Element mit data-source vorhanden ist
  const sourceEl =
    document.querySelector("[data-source]") ||
    document.getElementById("source-path");
  if (sourceEl) sourceEl.textContent = SRC;

  // Container finden/erzeugen
  const container =
    document.getElementById("cards") ||
    document.querySelector("#cards-list") ||
    (() => {
      const d = document.createElement("div");
      d.id = "cards";
      document.body.appendChild(d);
      return d;
    })();

  // Hilfsfunktion HTML-escape
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[m]);

  // Laden & Rendern
  fetch(srcUrl, { cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((data) => {
      // Unterstützt sowohl [{…}] als auch { cards: [{…}] }
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data.cards)
          ? data.cards
          : [];

      if (!items.length) throw new Error("Keine Karten gefunden.");

      container.innerHTML = items
        .map((c) => {
          const id = c.id ?? "—";
          const name = c.name ?? "—";
          const club = c.club ?? "—";
          const variant = c.variant ?? "—";
          const rarity = c.rarity ?? "—";

          return `
            <article class="card" style="padding:1rem;border-radius:12px;border:1px solid rgba(0,0,0,.08);margin:.75rem 0;">
              <h2 style="font-size:1.25rem;font-weight:700;margin:0 0 .25rem 0">${esc(name)}</h2>
              <p style="margin:.25rem 0"><strong>Club:</strong> ${esc(club)}</p>
              <p style="margin:.25rem 0"><strong>ID:</strong> ${esc(id)}</p>
              <p style="margin:.25rem 0"><strong>Variante:</strong> ${esc(variant)}</p>
              <p style="margin:.25rem 0"><strong>Seltenheit:</strong> ${esc(rarity)}</p>
              <p style="margin:.5rem 0 0">
                <a href="detail.html?id=${encodeURIComponent(id)}">Details</a>
              </p>
            </article>`;
        })
        .join("");
    })
    .catch((err) => {
      container.innerHTML = `
        <p style="color:#e11d48;padding:.5rem;border:1px solid #fecdd3;background:#fff1f2;border-radius:.5rem">
          ❌ Fehler beim Laden: ${esc(err.message)}
        </p>`;
      console.error("[cards.js] Load error:", err);
    });
})();
