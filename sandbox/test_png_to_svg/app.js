const fileInput = document.getElementById("fileInput");
const pixelSizeInput = document.getElementById("pixelSize");
const includeTransparentInput = document.getElementById("includeTransparent");

const convertBtn = document.getElementById("convertBtn");
const downloadBtn = document.getElementById("downloadBtn");
const copyBtn = document.getElementById("copyBtn");

const output = document.getElementById("output");
const previewHost = document.getElementById("previewHost");
const stats = document.getElementById("stats");

let lastSvgText = "";

function clampInt(n, min, max) {
  const v = Number.parseInt(String(n), 10);
  if (Number.isNaN(v)) return min;
  return Math.max(min, Math.min(max, v));
}

function rgbaKey(r, g, b, a) {
  return `${r},${g},${b},${a}`;
}

function rgbaToCss(r, g, b, a) {
  if (a === 255) return `rgb(${r} ${g} ${b})`;
  const alpha = Math.round((a / 255) * 1000) / 1000;
  return `rgba(${r} ${g} ${b} / ${alpha})`;
}

async function fileToImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function imageToImageData(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not get 2D canvas context");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Option 3:
 * - merge horizontal runs per row
 * - generate a palette and use CSS classes (.c0, .c1, ...)
 */
function imageDataToSvg(imageData, { pixelSize, includeTransparent }) {
  const w = imageData.width;
  const h = imageData.height;
  const data = imageData.data;

  /** @type {Map<string, number>} */
  const paletteIndexByKey = new Map();
  /** @type {string[]} */
  const paletteCss = [];

  function classForRgba(r, g, b, a) {
    const key = rgbaKey(r, g, b, a);
    let idx = paletteIndexByKey.get(key);
    if (idx == null) {
      idx = paletteIndexByKey.size;
      paletteIndexByKey.set(key, idx);
      paletteCss.push(`.c${idx}{fill:${rgbaToCss(r, g, b, a)};}`);
    }
    return `c${idx}`;
  }

  /** @type {string[]} */
  const rects = [];
  let rectCount = 0;

  const t0 = performance.now();

  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (!includeTransparent && a === 0) {
        x++;
        continue;
      }

      const runClass = classForRgba(r, g, b, a);
      const startX = x;
      x++;

      while (x < w) {
        const j = (y * w + x) * 4;
        const r2 = data[j];
        const g2 = data[j + 1];
        const b2 = data[j + 2];
        const a2 = data[j + 3];

        if (!includeTransparent && a2 === 0) break;
        if (r2 !== r || g2 !== g || b2 !== b || a2 !== a) break;
        x++;
      }

      const runLen = x - startX;
      rectCount++;
      rects.push(
        `<rect x="${startX * pixelSize}" y="${y * pixelSize}" width="${runLen * pixelSize}" height="${pixelSize}" class="${runClass}"/>`
      );
    }
  }

  const t1 = performance.now();

  const svgW = w * pixelSize;
  const svgH = h * pixelSize;

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" shape-rendering="crispEdges">`,
    `<style>${paletteCss.join("")}</style>`,
    rects.join("\n"),
    `</svg>`,
  ].join("\n");

  return {
    svg,
    stats: {
      width: w,
      height: h,
      pixelSize,
      paletteSize: paletteIndexByKey.size,
      rectCount,
      ms: Math.round((t1 - t0) * 100) / 100,
    },
  };
}

function downloadText(filename, text, mime) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

function setStats(s) {
  if (!s) {
    stats.textContent = "";
    return;
  }

  stats.textContent = `PNG ${s.width}×${s.height} | pixelSize=${s.pixelSize} | palette=${s.paletteSize} | rects=${s.rectCount} | ${s.ms}ms`;
}

fileInput.addEventListener("change", () => {
  convertBtn.disabled = !fileInput.files || fileInput.files.length === 0;
  downloadBtn.disabled = true;
  copyBtn.disabled = true;
  output.value = "";
  previewHost.innerHTML = "";
  setStats(null);
  lastSvgText = "";
});

convertBtn.addEventListener("click", async () => {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;

  convertBtn.disabled = true;
  downloadBtn.disabled = true;
  copyBtn.disabled = true;
  stats.textContent = "Converting...";

  try {
    const pixelSize = clampInt(pixelSizeInput.value, 1, 256);
    const includeTransparent = Boolean(includeTransparentInput.checked);

    const img = await fileToImage(file);
    const imageData = imageToImageData(img);

    const result = imageDataToSvg(imageData, { pixelSize, includeTransparent });

    lastSvgText = result.svg;
    output.value = result.svg;
    previewHost.innerHTML = result.svg;
    setStats(result.stats);

    downloadBtn.disabled = false;
    copyBtn.disabled = false;
  } catch (e) {
    console.error(e);
    stats.textContent = `Error: ${e instanceof Error ? e.message : String(e)}`;
  } finally {
    convertBtn.disabled = false;
  }
});

downloadBtn.addEventListener("click", () => {
  if (!lastSvgText) return;
  downloadText("pixelart.svg", lastSvgText, "image/svg+xml;charset=utf-8");
});

copyBtn.addEventListener("click", async () => {
  if (!lastSvgText) return;
  try {
    await navigator.clipboard.writeText(lastSvgText);
    stats.textContent = "Copied SVG to clipboard.";
  } catch {
    stats.textContent = "Copy failed (clipboard permission). You can still select the textarea and copy manually.";
  }
});
