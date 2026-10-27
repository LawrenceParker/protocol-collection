// Pack opening animation, used by collections.html.
//
// Usage:
//   const reveal = Reveal.start(collection);   // overlay appears, pack starts shaking
//   ... call the database, and wait for reveal.minTime so the shake plays out ...
//   await reveal.show(cards, rarities);        // burst, face-down cards, click to flip
//   reveal.cancel();                           // use instead of show() if something went wrong
//
// Needs cards.js (renderCard) and cards.css / reveal.css.

(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SHAKE_MS = 1400;   // how long the pack shakes before it can open
  const BURST_MS = 500;    // length of the burst
  const FLIP_GAP_MS = 120; // delay between cards when using "Reveal all"

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function make(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function start(collection) {
    let closed = false;
    let onClose = null;

    const overlay = make("div", "reveal");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Opening " + collection.name);

    const flash = make("div", "rv-flash");
    const stage = make("div", "rv-stage");
    overlay.appendChild(flash);
    overlay.appendChild(stage);

    // ----- the pack -----
    const pack = make("div", "rv-pack" + (reduce ? "" : " shaking"));
    if (collection.colour) pack.style.setProperty("--pack-colour", collection.colour);
    const body = make("div", "rv-pack-body");
    const label = make("div", "rv-pack-label");
    label.appendChild(make("div", "rv-pack-name", collection.name));
    label.appendChild(make("div", "rv-pack-sub", collection.cards_per_pack + " cards"));
    body.appendChild(label);
    pack.appendChild(make("div", "rv-pack-crimp"));
    pack.appendChild(body);
    pack.appendChild(make("div", "rv-pack-crimp"));
    stage.appendChild(pack);

    function close() {
      if (closed) return;
      closed = true;
      document.removeEventListener("keydown", onKey);
      overlay.remove();
      document.body.classList.remove("rv-lock");
      if (onClose) onClose();
    }

    function onKey(e) {
      if (e.key === "Escape") close();
    }

    document.addEventListener("keydown", onKey);
    document.body.classList.add("rv-lock");
    document.body.appendChild(overlay);

    return {
      // Resolves once the pack has shaken for long enough
      minTime: sleep(reduce ? 0 : SHAKE_MS),

      cancel: close,

      // Resolves when the player closes the overlay
      async show(cards, rarities) {
        if (closed) return;

        if (!reduce) {
          pack.classList.remove("shaking");
          pack.classList.add("burst");
          flash.classList.add("go");
          await sleep(BURST_MS);
          if (closed) return;
        }

        stage.replaceChildren();

        const row = make("div", "rv-row");
        const hint = make("p", "rv-hint", "Click a card to reveal it");
        const btn = make("button", "rv-btn secondary", "Reveal all");
        const slots = [];
        let flipped = 0;

        function flip(slot) {
          if (slot.classList.contains("flipped")) return;
          slot.classList.add("flipped");
          flipped++;
          if (flipped === cards.length) {
            btn.disabled = false;
            btn.textContent = "Done";
            btn.classList.remove("secondary");
            hint.textContent = "Added to My Cards";
            btn.focus();
          }
        }

        cards.forEach((card, i) => {
          const slot = make("div", "rv-slot");
          slot.style.setProperty("--i", i);
          slot.tabIndex = 0;
          slot.setAttribute("role", "button");
          slot.setAttribute("aria-label", "Reveal card " + (i + 1));

          slot.appendChild(make("div", "rv-back"));
          const face = make("div", "rv-face");
          face.appendChild(renderCard(card, rarities[card.event_type]));
          slot.appendChild(face);

          slot.addEventListener("click", () => flip(slot));
          slot.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              flip(slot);
            }
          });

          row.appendChild(slot);
          slots.push(slot);
        });

        btn.addEventListener("click", () => {
          if (flipped === cards.length) {
            close();
            return;
          }
          btn.disabled = true;
          slots.forEach((slot, i) => {
            setTimeout(() => flip(slot), reduce ? 0 : i * FLIP_GAP_MS);
          });
        });

        stage.appendChild(row);
        stage.appendChild(hint);
        stage.appendChild(btn);

        return new Promise(resolve => { onClose = resolve; });
      }
    };
  }

  window.Reveal = { start };
})();
