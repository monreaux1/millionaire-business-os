import { jsPDF } from "jspdf";

const BRAND = {
  primary: "#FF6A3D",
  dark: "#F54D34",
  black: "#0D0D0D",
  gray: "#F4F4F4",
  muted: "#6B7280",
};

function hexToRgb(hex) {
  const h = (hex || "#000000").replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16) || 0,
    parseInt(h.substring(2, 4), 16) || 0,
    parseInt(h.substring(4, 6), 16) || 0,
  ];
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function generateFreebiePDF({ type, data, logoDataUrl, brandColor, businessName, purpose = "lead_magnet" }) {
  const primary = brandColor || BRAND.primary;
  const cPrimary = hexToRgb(primary);
  const cBlack = hexToRgb(BRAND.black);
  const cMuted = hexToRgb(BRAND.muted);
  const cGray = hexToRgb(BRAND.gray);

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 56;
  const contentW = pageW - margin * 2;
  let y = margin;
  let pageNum = 1;

  const logo = await loadImage(logoDataUrl);
  const imgFmt = logoDataUrl && logoDataUrl.startsWith("data:image/jpeg") ? "JPEG" : "PNG";

  const placeLogo = (maxW, maxH, x, align = "left") => {
    if (!logo) return;
    const ratio = Math.min(maxW / logo.naturalWidth, maxH / logo.naturalHeight);
    const w = logo.naturalWidth * ratio;
    const h = logo.naturalHeight * ratio;
    const px = align === "center" ? x - w / 2 : x;
    try {
      doc.addImage(logoDataUrl, imgFmt, px, y, w, h, undefined, "FAST");
    } catch (_) {}
  };

  const drawHeader = () => {
    doc.setFillColor(...cPrimary);
    doc.rect(0, 0, pageW, 5, "F");
    if (logo) {
      const maxW = 90, maxH = 26;
      const ratio = Math.min(maxW / logo.naturalWidth, maxH / logo.naturalHeight);
      const w = logo.naturalWidth * ratio;
      const h = logo.naturalHeight * ratio;
      try { doc.addImage(logoDataUrl, imgFmt, margin, 20, w, h, undefined, "FAST"); } catch (_) {}
    }
    if (businessName) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...cMuted);
      doc.text(businessName.toUpperCase(), pageW - margin, 32, { align: "right" });
    }
  };

  const drawFooter = () => {
    if (pageNum <= 1) return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...cMuted);
    doc.text(String(pageNum), pageW / 2, pageH - 24, { align: "center" });
  };

  const startContentPage = () => {
    doc.addPage();
    pageNum++;
    drawHeader();
    y = 64;
  };

  const ensure = (h) => {
    if (y + h > pageH - margin - 10) {
      drawFooter();
      startContentPage();
    }
  };

  const para = (text, { size = 11, color = cBlack, style = "normal", gap = 6 } = {}) => {
    if (text == null || text === "") return;
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(text), contentW);
    lines.forEach((line) => {
      ensure(size + 5);
      doc.text(line, margin, y);
      y += size + 5;
    });
    y += gap;
  };

  const heading = (text, size = 15) => {
    y += 10;
    ensure(size + 14);
    doc.setFillColor(...cPrimary);
    doc.rect(margin, y - size + 2, 3, size, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(...cBlack);
    const lines = doc.splitTextToSize(String(text), contentW - 10);
    lines.forEach((line) => {
      ensure(size + 5);
      doc.text(line, margin + 10, y);
      y += size + 5;
    });
    y += 4;
  };

  const subheading = (text, size = 11) => {
    y += 4;
    para(text, { size, color: cPrimary, style: "bold", gap: 3 });
  };

  const bullets = (items, { size = 11 } = {}) => {
    if (!items) return;
    items.forEach((item) => {
      if (item == null) return;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(size);
      doc.setTextColor(...cBlack);
      const lines = doc.splitTextToSize(String(item), contentW - 18);
      lines.forEach((line, i) => {
        ensure(size + 5);
        if (i === 0) {
          doc.setFillColor(...cPrimary);
          doc.circle(margin + 4, y - 3, 1.6, "F");
        }
        doc.text(line, margin + 16, y);
        y += size + 5;
      });
      y += 3;
    });
    y += 4;
  };

  const ctaBox = (text) => {
    if (!text) return;
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    const lines = doc.splitTextToSize(String(text), contentW - 32);
    const boxH = Math.max(60, lines.length * 18 + 28);
    ensure(boxH + 6);
    doc.setFillColor(...cPrimary);
    doc.roundedRect(margin, y, contentW, boxH, 10, 10, "F");
    let ty = y + 24;
    lines.forEach((line) => {
      doc.text(line, margin + 20, ty);
      ty += 18;
    });
    y += boxH + 12;
  };

  // ===== COVER PAGE =====
  doc.setFillColor(...cPrimary);
  doc.rect(0, 0, pageW, 150, "F");

  if (logo) {
    const maxW = 150, maxH = 56;
    const ratio = Math.min(maxW / logo.naturalWidth, maxH / logo.naturalHeight);
    const w = logo.naturalWidth * ratio;
    const h = logo.naturalHeight * ratio;
    try { doc.addImage(logoDataUrl, imgFmt, (pageW - w) / 2, 36, w, h, undefined, "FAST"); } catch (_) {}
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  const coverLabel = purpose === "paid_product" ? "PREMIUM DIGITAL PRODUCT" : purpose === "client_delivery" ? "CLIENT RESOURCE" : "FREE BUSINESS RESOURCE";
  doc.text(coverLabel, pageW / 2, 128, { align: "center" });

  y = 200;
  const coverTitle = data.title || "Your Asset";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(...cBlack);
  const tlines = doc.splitTextToSize(String(coverTitle), contentW);
  tlines.forEach((line) => {
    ensure(36);
    doc.text(line, margin, y);
    y += 36;
  });
  y += 6;

  if (data.subtitle) {
    para(data.subtitle, { size: 14, color: cMuted, style: "normal", gap: 14 });
  }

  doc.setFillColor(...cPrimary);
  doc.rect(margin, y, 64, 3, "F");
  y += 22;

  if (data.intro) {
    para(data.intro, { size: 12, color: cBlack, gap: 10 });
  }

  // ===== CONTENT PAGES =====
  startContentPage();
  const yStart = y;

  const renderers = {
    ebook: (d) => {
      if (d.toc?.length) {
        heading("Table of Contents", 14);
        d.toc.forEach((t, i) => para(`${i + 1}. ${t}`, { size: 11, gap: 2 }));
        y += 6;
      }
      d.sections?.forEach((s, i) => {
        heading(`${i + 1}. ${s.heading}`, 15);
        if (s.body) para(s.body);
        if (s.steps?.length) { subheading("Action Steps"); bullets(s.steps); }
        if (s.example) { subheading("Example"); para(s.example, { color: cMuted }); }
      });
      if (d.final_section) { heading("Bringing It Together", 15); para(d.final_section); }
    },
    checklist: (d) => {
      d.categories?.forEach((cat) => {
        heading(cat.name, 15);
        if (cat.items?.length) bullets(cat.items);
      });
      if (d.quick_wins?.length) { heading("Quick Wins", 15); bullets(d.quick_wins); }
    },
    prompt_pack: (d) => {
      d.categories?.forEach((cat) => {
        heading(cat.name, 15);
        if (cat.description) para(cat.description, { color: cMuted });
        cat.prompts?.forEach((p, i) => {
          subheading(`Prompt ${i + 1}`);
          para(p);
        });
      });
      if (d.usage_tips?.length) { heading("Usage Tips", 15); bullets(d.usage_tips); }
    },
    templates: (d) => {
      d.sections?.forEach((sec) => {
        heading(sec.name, 15);
        if (sec.description) para(sec.description, { color: cMuted });
        sec.items?.forEach((item) => {
          subheading(item.label);
          para(item.content);
        });
      });
      if (d.daily_usage) { heading("Daily Usage", 15); para(d.daily_usage); }
    },
    workbook: (d) => {
      d.sections?.forEach((sec) => {
        heading(sec.name, 15);
        if (sec.instructions) para(sec.instructions, { color: cMuted });
        sec.exercises?.forEach((ex, i) => {
          subheading(`Exercise ${i + 1}`);
          para(ex.prompt);
          if (ex.space_hint) para(ex.space_hint, { size: 10, color: cMuted });
        });
      });
      if (d.reflection_questions?.length) { heading("Reflection Questions", 15); bullets(d.reflection_questions); }
      if (d.final_message) { heading("Final Message", 15); para(d.final_message); }
    },
    mini_training: (d) => {
      d.lessons?.forEach((lesson, i) => {
        heading(`Lesson ${i + 1}: ${lesson.title}`, 15);
        if (lesson.objective) para(`Objective: ${lesson.objective}`, { color: cMuted });
        if (lesson.script) para(lesson.script);
        if (lesson.example) { subheading("Example"); para(lesson.example); }
        if (lesson.key_takeaway) para(`Key Takeaway: ${lesson.key_takeaway}`, { style: "bold" });
      });
      if (d.bonus_tips?.length) { heading("Bonus Tips", 15); bullets(d.bonus_tips); }
      if (d.transition) { heading("What's Next", 15); para(d.transition); }
    },
  };

  // unwrap if the LLM returned a raw string or wrapped in a "response" key
  let content = data;
  if (typeof content === "string") content = { raw_text: content };
  if (content.response && typeof content.response === "object") content = content.response;

  const renderer = renderers[type];
  if (renderer) renderer(content);

  // generic deep-walk fallback so the PDF is never empty
  const genericWalk = (obj) => {
    if (obj == null) return;
    if (typeof obj === "string") { if (obj.trim()) para(obj); return; }
    if (Array.isArray(obj)) {
      obj.forEach((item) => {
        if (item == null) return;
        if (typeof item === "object") genericWalk(item);
        else if (String(item).trim()) para(String(item), { color: cMuted });
      });
      return;
    }
    Object.entries(obj).forEach(([k, v]) => {
      if (["title", "subtitle", "intro", "cta", "response"].includes(k)) return;
      if (v == null || v === "") return;
      const label = k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      if (typeof v === "string") { heading(label, 14); para(v); }
      else if (Array.isArray(v)) {
        heading(label, 14);
        const strs = v.filter((i) => typeof i === "string");
        if (strs.length) bullets(strs);
        v.filter((i) => i && typeof i === "object").forEach((i) => genericWalk(i));
      } else if (typeof v === "object") { heading(label, 14); genericWalk(v); }
    });
  };

  if (y - yStart < 24) {
    if (content.raw_text) { heading("Content", 15); para(content.raw_text); }
    else genericWalk(content);
  }

  ctaBox(content.cta);
  drawFooter();
  doc.save(`business-asset-${type}-${Date.now()}.pdf`);
}