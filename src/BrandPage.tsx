// /brend — preuzimanje logotipa u PNG (Full HD / 4K) i SVG.
// Sve se crta na <canvas> pa je Manrope font uvijek tačan (SVG-kao-slika ne
// učitava web fontove). Ikona je vektorska (logoVector.ts) — nema pikselizacije.

import { useEffect, useRef, useState } from "react";
import { LOGO_ICON_SRC, LOGO_ICON_DATA_URI } from "./lib/logoVector";

/* ─────────── boje (identične navbaru) ─────────── */
const GRAD_FROM = "#5EEAD4"; // teal-300
const GRAD_TO = "#67E8F9"; // cyan-300
const BOX_DARK_BG = "#0B0B0F";
const BOX_LIGHT_BG = "#FFFFFF";

/* ─────────── jedinične mjere (okvir ikone = 100) ─────────── */
const U_BOX = 100;
const U_GAP = 24;
const U_FONT = 55; // 22px tekst na 40px okviru = 0.55
const U_TRACK = -0.025; // tracking-tight
const U_PAD = 12;
const U_RADIUS = 0.24;
const U_BORDER = 2.2;

type Kind = "full" | "icon" | "flask" | "wordmark";

type Variant = {
  id: string;
  kind: Kind;
  onLight: boolean;
  title: string;
  note: string;
};

const VARIANTS: Variant[] = [
  { id: "full", kind: "full", onLight: false, title: "Puni logo — tamna pozadina", note: "Ikona + DevLab. Za crnu i tamnu podlogu." },
  { id: "full-light", kind: "full", onLight: true, title: "Puni logo — svijetla pozadina", note: "Ikona + DevLab u crnoj. Za bijelu podlogu." },
  { id: "icon", kind: "icon", onLight: false, title: "Samo ikona sa okvirom", note: "Tikvica u tamnom zaobljenom okviru." },
  { id: "flask", kind: "flask", onLight: false, title: "Samo tikvica", note: "Bez okvira — za vlastitu pozadinu." },
  { id: "wordmark", kind: "wordmark", onLight: false, title: "Samo tekst — tamna pozadina", note: "DevLab, bijelo + tirkizni gradijent." },
  { id: "wordmark-light", kind: "wordmark", onLight: true, title: "Samo tekst — svijetla pozadina", note: "DevLab u crnoj + tirkizni gradijent." },
];

/* ─────────── učitavanje PRAVE tikvice (512×512 PNG, prozirna pozadina) ─────────── */
let flaskPromise: Promise<HTMLImageElement> | null = null;
function loadFlask(): Promise<HTMLImageElement> {
  if (!flaskPromise) {
    flaskPromise = new Promise((resolve, reject) => {
      const load = (src: string, onFail?: () => void) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => (onFail ? onFail() : reject(new Error("icon")));
        img.src = src;
      };
      // prvo pravi fajl; ako ne uspije, ugrađena kopija
      load(LOGO_ICON_SRC, () => load(LOGO_ICON_DATA_URI));
    });
  }
  return flaskPromise;
}

function fontOk(): Promise<void> {
  const anyDoc = document as Document & { fonts?: FontFaceSet };
  if (!anyDoc.fonts) return Promise.resolve();
  return Promise.all([
    anyDoc.fonts.load("800 100px Manrope"),
    anyDoc.fonts.load("700 100px Manrope"),
  ]).then(() => undefined);
}

/* ─────────── crtanje ─────────── */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function setFont(ctx: CanvasRenderingContext2D, size: number) {
  ctx.font = `800 ${size}px Manrope, system-ui, -apple-system, "Segoe UI", sans-serif`;
}

/** Crta logo i vraća platno sa prozirnom pozadinom. */
async function renderLogo(variant: Variant, unitPx: number): Promise<HTMLCanvasElement> {
  const [flask] = await Promise.all([loadFlask(), fontOk()]);

  const box = unitPx;
  const gap = box * (U_GAP / U_BOX);
  const font = box * (U_FONT / U_BOX);
  const pad = box * (U_PAD / U_BOX);
  const track = font * U_TRACK;
  const ink = variant.onLight ? "#060606" : "#FFFFFF";

  // probno platno — samo za mjerenje teksta
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) throw new Error("canvas");
  setFont(probe, font);
  if ("letterSpacing" in probe) {
    (probe as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${track}px`;
  }
  const wDev = probe.measureText("Dev").width;
  const wLab = probe.measureText("Lab").width;
  const measured = probe.measureText("DevLab");
  const asc = measured.actualBoundingBoxAscent || font * 0.72;
  const desc = measured.actualBoundingBoxDescent || 0;
  const textW = wDev + wLab;
  const textH = asc + desc;

  const showIcon = variant.kind === "full" || variant.kind === "icon";
  const showBox = variant.kind === "full" || variant.kind === "icon";
  const showText = variant.kind === "full" || variant.kind === "wordmark";

  // visina sadržaja
  const contentH = showBox ? box : variant.kind === "flask" ? box : Math.max(textH, box * 0.5);
  const iconW = showIcon ? box : 0;
  const contentW =
    variant.kind === "flask"
      ? box
      : (showIcon ? iconW + (showText ? gap : 0) : 0) + (showText ? textW : 0);

  const W = Math.ceil(contentW + pad * 2);
  const H = Math.ceil(contentH + pad * 2);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("ctx");

  const left = pad;
  const cy = H / 2;

  if (showBox) {
    const bx = left;
    const by = cy - box / 2;
    // podloga okvira
    roundRect(ctx, bx, by, box, box, box * U_RADIUS);
    ctx.fillStyle = variant.onLight ? BOX_LIGHT_BG : BOX_DARK_BG;
    ctx.fill();
    // rub (unutar okvira)
    const bw = box * (U_BORDER / U_BOX);
    roundRect(ctx, bx + bw / 2, by + bw / 2, box - bw, box - bw, (box - bw) * U_RADIUS);
    ctx.strokeStyle = variant.onLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.15)";
    ctx.lineWidth = bw;
    ctx.stroke();
    // tikvica — 70% okvira, centrirana (isto kao navbar)
    const isz = box * 0.7;
    ctx.drawImage(flask, bx + (box - isz) / 2, by + (box - isz) / 2, isz, isz);
  } else if (variant.kind === "flask") {
    ctx.drawImage(flask, left, cy - box / 2, box, box);
  }

  if (showText) {
    const tx = left + (showIcon ? box + gap : 0);
    const baseline = cy + (asc - desc) / 2;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    setFont(ctx, font);
    if ("letterSpacing" in ctx) {
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${track}px`;
    }
    ctx.fillStyle = ink;
    ctx.fillText("Dev", tx, baseline);

    const grad = ctx.createLinearGradient(tx + wDev, cy, tx + textW, cy);
    grad.addColorStop(0, GRAD_FROM);
    grad.addColorStop(1, GRAD_TO);
    ctx.fillStyle = grad;
    ctx.fillText("Lab", tx + wDev, baseline);
  }

  return canvas;
}

/* ─────────── SVG (vektorski master) ─────────── */
function logoSvg(variant: Variant): string {
  const box = U_BOX;
  const gap = U_GAP;
  const font = U_FONT;
  const pad = U_PAD;
  const track = font * U_TRACK;
  const ink = variant.onLight ? "#060606" : "#FFFFFF";
  // gruba procjena širine teksta: Manrope 800 ≈ 0.62em po znaku
  const textW = font * 0.62 * 6 * 0.94;
  const showIcon = variant.kind === "full" || variant.kind === "icon";
  const showBox = variant.kind === "full" || variant.kind === "icon";
  const showText = variant.kind === "full" || variant.kind === "wordmark";
  const showIcon0 = showBox;
  const contentW = showBox
    ? box + (showText ? gap : 0) + (showText ? textW : 0)
    : variant.kind === "flask"
      ? box
      : textW;
  const W = contentW + pad * 2;
  const H = (showBox || variant.kind === "flask" ? box : font * 1.2) + pad * 2;
  const lid = variant.kind === "flask" ? "flask" : showIcon0 ? "icon" : "word";

  const flaskPaths = `<image x="0" y="0" width="64" height="64" href="${LOGO_ICON_DATA_URI}" preserveAspectRatio="xMidYMid meet"/>`;

  const iconPart = showBox
    ? `<g>
      <rect x="${pad}" y="${pad}" width="${box}" height="${box}" rx="${box * U_RADIUS}" fill="${variant.onLight ? BOX_LIGHT_BG : BOX_DARK_BG}" stroke="${variant.onLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.15)"}" stroke-width="${U_BORDER}"/>
      <g transform="translate(${pad + box * 0.15} ${pad + box * 0.15}) scale(${(box * 0.7) / 64})">${flaskPaths}</g>
    </g>`
    : variant.kind === "flask"
      ? `<g transform="translate(${pad} ${pad}) scale(${box / 64})">${flaskPaths}</g>`
      : "";

  const textPart = showText
    ? `<defs><linearGradient id="labGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${GRAD_FROM}"/><stop offset="1" stop-color="${GRAD_TO}"/>
      </linearGradient></defs>
    <text font-family="Manrope, system-ui, sans-serif" font-weight="800" font-size="${font}" letter-spacing="${track.toFixed(3)}" x="${pad + (showIcon ? box + gap : 0)}" y="${(pad + box / 2).toFixed(2)}" dominant-baseline="central"><tspan fill="${ink}">Dev</tspan><tspan fill="url(#labGrad)">Lab</tspan></text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(W)}" height="${Math.round(H)}" viewBox="0 0 ${Math.round(W)} ${Math.round(H)}" fill="none" data-logo="${lid}">
${iconPart}
${textPart}
</svg>`;
}

/* ─────────── preuzimanje ─────────── */
function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function downloadPng(variant: Variant, targetW: number) {
  // širina je linearna u jediničnoj veličini — dva prolaza daju tačan broj piksela
  let unit = 400;
  let canvas = await renderLogo(variant, unit);
  for (let i = 0; i < 4 && canvas.width !== targetW; i++) {
    unit = (unit * targetW) / canvas.width;
    canvas = await renderLogo(variant, unit);
  }
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  if (!blob) throw new Error("png");
  saveBlob(blob, `devlab-logo-${variant.id}-${canvas.width}px.png`);
}

async function downloadSvg(variant: Variant) {
  const svg = logoSvg(variant);
  saveBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), `devlab-logo-${variant.id}.svg`);
}

/* ─────────── kartica ─────────── */
function VariantCard({ variant }: { variant: Variant }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Svetle verzije se pregledaju na bijeloj podlozi (inače se crni tekst ne vidi).
  const previewBg = variant.onLight ? "#FFFFFF" : "#060606";
  const checker = variant.onLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.035)";

  useEffect(() => {
    let alive = true;
    const host = wrapRef.current;
    if (!host) return;
    renderLogo(variant, 260)
      .then((c) => {
        if (!alive || !wrapRef.current) return;
        c.style.maxWidth = "100%";
        c.style.maxHeight = "132px";
        c.style.width = "auto";
        c.style.height = "auto";
        wrapRef.current.innerHTML = "";
        wrapRef.current.appendChild(c);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [variant]);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch {
      alert("Preuzimanje nije uspjelo. Pokušajte ponovo.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-none border border-white/12 bg-[#0B0B0F]">
      <div
        ref={wrapRef}
        className="flex h-[180px] items-center justify-center px-6"
        style={{
          background: previewBg,
          backgroundImage: `linear-gradient(45deg,${checker} 25%,transparent 25%,transparent 75%,${checker} 75%),linear-gradient(45deg,${checker} 25%,transparent 25%,transparent 75%,${checker} 75%)`,
          backgroundSize: "18px 18px",
          backgroundPosition: "0 0,9px 9px",
        }}
      />
      <div className="flex flex-1 flex-col gap-3 border-t border-white/10 p-4">
        <div>
          <p className="text-[13px] font-bold text-white">{variant.title}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/45">{variant.note}</p>
        </div>
        <div className="mt-auto grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => run("hd", () => downloadPng(variant, 1920))}
            disabled={busy !== null}
            className="rounded-none border border-white/15 px-2 py-2 text-[11px] font-bold text-white/80 transition hover:border-teal-400/60 hover:text-white disabled:opacity-40"
          >
            {busy === "hd" ? "…" : "HD"}
          </button>
          <button
            type="button"
            onClick={() => run("4k", () => downloadPng(variant, 3840))}
            disabled={busy !== null}
            className="rounded-none border border-teal-400/40 bg-teal-400/10 px-2 py-2 text-[11px] font-bold text-teal-200 transition hover:bg-teal-400/20 disabled:opacity-40"
          >
            {busy === "4k" ? "…" : "4K"}
          </button>
          <button
            type="button"
            onClick={() => run("svg", () => downloadSvg(variant))}
            disabled={busy !== null}
            className="rounded-none border border-white/15 px-2 py-2 text-[11px] font-bold text-white/80 transition hover:border-teal-400/60 hover:text-white disabled:opacity-40"
          >
            {busy === "svg" ? "…" : "SVG"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────── stranica ─────────── */
export default function BrandPage() {
  return (
    <main className="min-h-screen bg-[#060606] px-5 py-14 font-sans text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <a href="/" className="text-[12px] font-semibold text-white/45 transition hover:text-teal-300">
          ← Natrag na stranicu
        </a>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
          DevLab <span className="bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">logo</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
          Preuzmite logotip u punoj rezoluciji. Sve verzije imaju <strong className="font-semibold text-white/75">prozirnu pozadinu</strong> — PNG radi na svakoj podlozi.
          Šahovnica u pregledu označava prozirno.
        </p>

        <div className="mt-8 flex flex-wrap gap-2 text-[11px]">
          {["PNG · prozirna pozadina", "Full HD 1920 px", "4K 3840 px", "SVG · vektor"].map((t) => (
            <span key={t} className="rounded-none border border-white/12 bg-white/[0.03] px-2.5 py-1 font-semibold text-white/55">
              {t}
            </span>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VARIANTS.map((v) => (
            <VariantCard key={v.id} variant={v} />
          ))}
        </div>

        <div className="mt-10 grid gap-4 border-t border-white/10 pt-8 text-[12px] leading-relaxed text-white/45 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[12px] font-bold text-white/80">Boje brenda</p>
            <div className="flex flex-wrap gap-2">
              {[
                { hex: "#4DEAE0", name: "DevLab tirkizna" },
                { hex: "#060606", name: "Crna podloga" },
                { hex: "#0B0B0F", name: "Okvir ikone" },
                { hex: "#5EEAD4", name: "Gradijent — od" },
                { hex: "#67E8F9", name: "Gradijent — do" },
              ].map((c) => (
                <span key={c.hex} className="inline-flex items-center gap-1.5 rounded-none border border-white/12 px-2 py-1">
                  <span className="h-3 w-3 shrink-0 border border-white/20" style={{ background: c.hex }} />
                  <span className="font-mono text-[10px] text-white/60">{c.hex}</span>
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[12px] font-bold text-white/80">Pravila korištenja</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Ne mijenjajte boje, proporcije ni razmak između ikone i teksta.</li>
              <li>Ne stavljajte logo na šarene podloge — koristite tamnu ili bijelu verziju.</li>
              <li>Minimalna širina: 90 px (digitalno) ili 25 mm (štampa).</li>
              <li>Ostavite prazan prostor oko logotipa najmanje visine slova „D".</li>
            </ul>
          </div>
        </div>

        <p className="mt-8 text-[11px] text-white/25">
          Font: Manrope 800. Ikona: vektorska (beskonačno oštra u SVG-u).
        </p>
      </div>
    </main>
  );
}