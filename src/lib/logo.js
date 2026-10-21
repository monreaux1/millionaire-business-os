import { useEffect, useState } from "react";

// Brand logo (orange mark + black lettering on transparent). Set VITE_LOGO_URL to swap it.
export const LOGO_URL = import.meta.env.VITE_LOGO_URL || "https://media.base44.com/images/public/68b3ceea8626205b99d31641/8da510d05_mblogo.png";

// Loads the logo, trims its transparent margin and returns a data URL.
// light: the black lettering disappears on dark backgrounds, so dark/neutral
// pixels are redrawn in a light color; the orange mark stays as is.
export function useBrandLogo(src, { light = false } = {}) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const width = Math.min(img.naturalWidth, 1200);
        const height = Math.round((img.naturalHeight * width) / img.naturalWidth);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const data = ctx.getImageData(0, 0, width, height);
        const px = data.data;
        for (let i = 0; i < px.length; i += 4) {
          const [r, g, b] = [px[i], px[i + 1], px[i + 2]];
          const max = Math.max(r, g, b);
          const saturation = max ? (max - Math.min(r, g, b)) / max : 0;
          if (light && px[i + 3] > 0 && (max < 90 || saturation < 0.4)) {
            px[i] = 244; px[i + 1] = 240; px[i + 2] = 255;
          }
        }
        ctx.putImageData(data, 0, 0);
        // Trim the transparent margin so the logo fills its space.
        let top = height, left = width, right = 0, bottom = 0;
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            if (px[(y * width + x) * 4 + 3] > 16) {
              if (x < left) left = x;
              if (x > right) right = x;
              if (y < top) top = y;
              if (y > bottom) bottom = y;
            }
          }
        }
        let out = canvas;
        if (right > left && bottom > top) {
          out = document.createElement("canvas");
          out.width = right - left + 1;
          out.height = bottom - top + 1;
          out.getContext("2d").drawImage(canvas, left, top, out.width, out.height, 0, 0, out.width, out.height);
        }
        if (!cancelled) setUrl(out.toDataURL("image/png"));
      } catch {
        /* cross-origin blocked: keep the text wordmark */
      }
    };
    img.src = src;
    return () => { cancelled = true; };
  }, [src, light]);
  return url;
}


// True when the app is showing its dark theme (manual toggle or system setting).
export function useIsDark() {
  const read = () => {
    if (typeof document === "undefined") return false;
    const root = document.documentElement;
    if (root.classList.contains("dark")) return true;
    if (root.classList.contains("light")) return false;
    return Boolean(window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  };
  const [dark, setDark] = useState(read);
  useEffect(() => {
    const update = () => setDark(read());
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    mq?.addEventListener?.("change", update);
    return () => { obs.disconnect(); mq?.removeEventListener?.("change", update); };
  }, []);
  return dark;
}
