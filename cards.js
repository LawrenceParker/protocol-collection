// Shared ID badge design, used by the Collections and My Cards pages.
//
//   renderCard(card, rarity, note)
//     card:   a row from the cards table (player, team, role, event, event_type, year)
//     rarity: that card's event type row from event_rarities (colour, colour2)
//     note:   optional extra text for the hover tooltip
//
// The badge shows the player name (tab, top right), role and team (under the photo)
// and the full event name plus year (up the left edge). The event TYPE is only used
// for the badge colour, which comes from event_rarities in Supabase:
//   colour  = tab, photo frame and accents
//   colour2 = footer strip (optional, blank means the same as colour)
// To add a new card type, add a row there. No code change is needed.

(function () {
  const FALLBACK = [139, 152, 166];   // grey, used if an event type has no colour

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

  // Long names get a smaller font so they still fit. Sizes are in cqw
  // (1% of the badge width), so they scale with the badge.
  function fit(text, max, min, budget) {
    const len = Math.max(String(text || "").length, 1);
    return Math.max(min, Math.min(max, budget / len)) + "cqw";
  }

  window.renderCard = function (card, rarity, note) {
    rarity = rarity || {};
    const c1 = parseHex(rarity.colour) || FALLBACK;
    const c2 = parseHex(rarity.colour2) || c1;
    const eventText = [card.event, card.year].filter(Boolean).join(" ");

    const el = make("div", "player-card");
    el.style.setProperty("--b1", toHex(c1));
    el.style.setProperty("--b2", toHex(c2));
    el.style.setProperty("--t1", textOn(c1));
    el.style.setProperty("--t2", textOn(c2));
    el.style.setProperty("--name-size", fit(card.player, 13, 7, 78));
    el.style.setProperty("--event-size", fit(eventText, 8.5, 5, 160));
    el.style.setProperty("--role-size", fit(card.role, 7, 5.2, 62));

    el.title = [card.player, eventText, card.event_type].filter(Boolean).join(" | ") + (note ? " | From " + note : "");

    el.appendChild(make("div", "bd-art", eventText));
    el.appendChild(make("div", "bd-radar"));

    const tab = make("div", "bd-tab");
    tab.appendChild(make("div", "bd-name", card.player));
    el.appendChild(tab);

    el.appendChild(make("div", "bd-photo"));
    el.appendChild(make("div", "bd-role", card.role || ""));
    el.appendChild(make("div", "bd-team", card.team || ""));
    el.appendChild(make("div", "bd-logo"));
    el.appendChild(make("div", "bd-foot"));
    return el;
  };
})();
