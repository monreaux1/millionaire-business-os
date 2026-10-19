// Keeps AI designer notes out of the copy that funnel visitors see.
// The generator is asked for visual direction too, and sometimes it writes
// that direction into customer-facing fields ("Layout: green check icon
// (#1F9D6B)…", "(connect URL after generation)"). Those notes are moved into
// the page's `design_notes` field, which the public page never renders.

const PAGES = ["landing_page", "order_page", "upsell_page", "thank_you_page"];
const SKIP_KEY = /visual|design_notes|^price_anchor$/i;

const DESIGN_LABEL =
  /^\s*[-•*]?\s*(?:\*\*)?\s*(layout|design|visual|visuals|hero|imagery|image|photo|typography|type|font|fonts|colou?rs?|palette|icon|icons|button|link button|cta button|background|mobile|desktop|section|spacing|style|styling|graphic|graphics|animation|note|designer note)s?\b[^:\n]{0,40}:/i;
const DESIGN_HINT =
  /#[0-9a-f]{6}\b|#[0-9a-f]{3}\b|\b(?:connect|insert|add|paste)\s+(?:the\s+|your\s+)?(?:url|link)\b|after generation|\bplaceholder\b|\bmobile[- ]first\b|\bfont[- ]weight\b|\bpx\b|\bsans[- ]serif\b|\bhex\b|\{\{|\}\}/i;
const PAREN_NOTE = /\s*[([][^()[\]]*?(?:#[0-9a-f]{3,6}\b|url|link|after generation|placeholder|layout|icon|font|colou?r|designer)[^()[\]]*?[)\]]/gi;

// "It's presented as a quiet card below the buttons, with this line: '…'"
// → keep only the quoted copy.
const LEAD_IN = /(?:^|(?<=[.!?]\s))[^.!?]*\b(?:presented|shown|displayed|placed|styled|rendered)\s+(?:as|in|below|above|under|beside|next to|inside)\b[^.!?:]*:\s*/gi;
const PLACEMENT_HINT = /\b(?:presented|shown|displayed|placed|styled|rendered)\s+(?:as\s+a|below|above|under|beside|next to|inside)\b|\bnot a pop-?up\b/i;

const isDesignNote = (text) => DESIGN_LABEL.test(text) || DESIGN_HINT.test(text) || PLACEMENT_HINT.test(text);

// Returns { clean, notes } for one string.
function cleanString(value) {
  const notes = [];
  const keptLines = [];
  for (const rawLine of String(value).split(/\n+/)) {
    if (!rawLine.trim()) continue;
    // A line that starts with a design label ("Layout:", "Icon:") is all notes.
    if (DESIGN_LABEL.test(rawLine)) { notes.push(rawLine.trim()); continue; }
    // Otherwise drop design sentences, then strip design asides "(…)".
    let hadLeadIn = false;
    let unwrapped = rawLine.replace(LEAD_IN, (match) => {
      notes.push(match.trim());
      hadLeadIn = true;
      return "\u0000";
    });
    if (hadLeadIn) {
      // Drop the quote marks that wrapped the copy after the lead-in.
      const quoted = /\u0000['"‘“]/.test(unwrapped);
      unwrapped = unwrapped.replace(/\u0000['"‘“]?/g, "");
      if (quoted) unwrapped = unwrapped.replace(/['"’”](\s*)$/, "$1");
    }
    const kept = unwrapped.split(/(?<=[.!?])\s+/).filter((sentence) => {
      const withoutAsides = sentence.replace(PAREN_NOTE, "");
      if (isDesignNote(withoutAsides) || (withoutAsides !== sentence && /#[0-9a-f]{3,6}\b/i.test(sentence) && /\b(background|colou?r|icon|font|layout|use a)\b/i.test(withoutAsides))) {
        notes.push(sentence.trim());
        return false;
      }
      return true;
    });
    let line = kept.join(" ").replace(PAREN_NOTE, (match) => {
      notes.push(match.trim());
      return "";
    });
    line = line.replace(/\s{2,}/g, " ").replace(/\s+([.,!?;:])/g, "$1").trim();
    if (line && !/^[-•*:.,]+$/.test(line)) keptLines.push(line);
  }
  return { clean: keptLines.join("\n"), notes };
}

function cleanValue(value, notes) {
  if (typeof value === "string") {
    const result = cleanString(value);
    notes.push(...result.notes);
    return result.clean;
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return cleanValue(item, notes);
        if (item && typeof item === "object") return cleanObject(item, notes);
        return item;
      })
      .filter((item) => item !== "" && item !== null && item !== undefined);
  }
  if (value && typeof value === "object") return cleanObject(value, notes);
  return value;
}

function cleanObject(obj, notes) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SKIP_KEY.test(key)) { out[key] = value; continue; }
    const cleaned = cleanValue(value, notes);
    if (cleaned === "" || (Array.isArray(cleaned) && cleaned.length === 0 && Array.isArray(value) && value.length > 0)) continue;
    out[key] = cleaned;
  }
  return out;
}

const isUrl = (value) => /^https?:\/\/\S+$/i.test(String(value || "").trim());

export function sanitizeFunnelCopy(funnel) {
  if (!funnel || typeof funnel !== "object") return funnel;
  for (const pageKey of PAGES) {
    const page = funnel[pageKey];
    if (!page || typeof page !== "object") continue;
    const notes = [];
    const cleaned = cleanObject(page, notes);
    if (pageKey === "thank_you_page" && cleaned.community_link && !isUrl(cleaned.community_link)) {
      notes.push(`Community link: ${cleaned.community_link}`);
      delete cleaned.community_link;
    }
    if (notes.length) {
      const existing = typeof page.design_notes === "string" && page.design_notes ? [page.design_notes] : [];
      cleaned.design_notes = [...existing, ...new Set(notes)].join("\n");
    }
    funnel[pageKey] = cleaned;
  }
  return funnel;
}
