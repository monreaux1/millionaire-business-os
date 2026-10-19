// Makes sure brand colors stay readable. AI-picked palettes sometimes put a
// pale "secondary" color on a white page, which makes headlines vanish.

function toRgb(color) {
  const hex = String(color || "").trim().replace(/^#/, "");
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return null;
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

function luminance([r, g, b]) {
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a, b) {
  const ra = toRgb(a);
  const rb = toRgb(b);
  if (!ra || !rb) return 21;
  const [hi, lo] = [luminance(ra), luminance(rb)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Returns `color` if it reads well on `background`, else a dark or light fallback.
export function readableOn(color, background, minRatio = 3) {
  if (contrastRatio(color, background) >= minRatio) return color;
  const bg = toRgb(background);
  const darkBg = bg ? luminance(bg) < 0.4 : false;
  return darkBg ? "#ffffff" : "#111111";
}
