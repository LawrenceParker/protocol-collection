// Shared card design, used by the Collections and My Cards pages.
//
//   renderCard(card, rarity, note)
//     card:   a row from the cards table (player, team, role, event, event_type, year)
//     rarity: that card's event type row from event_rarities (colour, colour2)
//     note:   optional extra text for the hover tooltip
//
// Colours come from event_rarities in Supabase (colour, and colour2 for two-tone cards).
// To add a new card type, add a row there. No code change is needed.

(function () {
  const FALLBACK = [139, 152, 166];   // grey, used if an event type has no colour
  const DARKEN = 0.55;                // single-colour cards fade to this much of their colour

  function parseHex(hex) {
    if (typeof hex !== "string") return null;
    let h = hex.trim().replace("#", "");
    if (h.length === 3) h = h.split("").map(c => c + c).join("");
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  }

  function toHex(rgb) {
    return "#" + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  }

  function luminance(rgb) {
    const f = v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
  }

  // White or near-black text, whichever is easier to read on this colour
  function textOn(rgb) {
    const L = luminance(rgb);
    const withWhite = 1.05 / (L + 0.05);
    const withDark = (L + 0.05) / 0.05;
    return withWhite >= withDark ? "#ffffff" : "#10161c";
  }

  function make(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  window.renderCard = function (card, rarity, note) {
    rarity = rarity || {};
    const top = parseHex(rarity.colour) || FALLBACK;
    const bottom = parseHex(rarity.colour2) || top.map(v => v * DARKEN);
    const middle = top.map((v, i) => (v + bottom[i]) / 2);

    const el = make("div", "player-card");
    el.style.setProperty("--card-top", toHex(top));
    el.style.setProperty("--card-bottom", toHex(bottom));
    el.style.setProperty("--text-top", textOn(top));
    el.style.setProperty("--text-mid", textOn(middle));
    el.style.setProperty("--text-bottom", textOn(bottom));

    el.title = [card.event, card.year].filter(Boolean).join(" ") + (note ? " | From " + note : "");

    el.appendChild(make("div", "pc-role", card.role || ""));

    const centre = make("div", "pc-centre");
    centre.appendChild(make("div", "pc-name", card.player));
    if (card.team) centre.appendChild(make("div", "pc-team", card.team));
    el.appendChild(centre);

    el.appendChild(make("div", "pc-type", card.event_type));
    return el;
  };
})();
