// Snimka stare stranice PRAVI SE PRIJE nego React zamijeni rutu, i to sinhrono
// u samom kliku. Overlay se ubacuje u DOM odmah, pa kad React poslije rendera
// (100-ak ms) resetuje skrol na vrh, korisnik to NE VIDI — overlay ga pokriva.
//
// Bez ovoga je prvi kadar prikazivao novu stranicu na staroj skrol poziciji,
// pa skok na vrh: to je bilo "zasjeckanje" na pocetku animacije.

let overlayEl: HTMLDivElement | null = null;

/** fontFamily -> font-family (za style.setProperty) */
function kebab(k: string): string {
  return k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()).replace(/^webkit-/, "-webkit-");
}

/** Ubaci zamrznutu kopiju stare stranice preko ekrana i resetuj skrol. */
export function prikaziStaruStranicu(): boolean {
  if (typeof document === "undefined") return false;

  const stranica = document.querySelector<HTMLElement>(".page-slide");
  if (!stranica) return false;

  const scroll = window.scrollY;

  // Ocisti eventualni zaostali overlay
  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
  }

  const div = document.createElement("div");
  div.className = "page-overlay";
  div.setAttribute("aria-hidden", "true");
  div.style.setProperty("--slide-offset", `${scroll}px`);

  // Overlay se kaci na <body>, a .page-slide zivi unutar React omotaca koji
  // nosi font i boju. Bez ovoga klon naslijedi Manrope sa body-ja umjesto
  // Tailwind fonta aplikacije, pa se sav tekst prelomi drugacije
  // (izmjereno: sekcije +-62px, sadrzaj 34px gore).
  //
  // NAMJERNO NE kopiramo fontSize / lineHeight / letterSpacing: njih overlay
  // naslijedi sa <html>/<body> kao relativne vrijednosti (npr. line-height
  // 1.5), pa se skaliraju sa fontom svakog elementa. Kopiranje computed
  // vrijednosti bi ih zakljucalo na apsolutnih 24px i sve sitno (11.2px)
  // bi dobilo pogresnu visinu linije (+7px po redu).
  const omotac = stranica.parentElement;
  if (omotac) {
    const cs = getComputedStyle(omotac);
    const nasljedno = [
      "fontFamily", "fontWeight", "fontStyle", "fontStretch",
      "fontVariant", "fontFeatureSettings", "fontVariationSettings",
      "textAlign", "textTransform", "textRendering", "color",
      "direction", "webkitFontSmoothing",
    ] as const;
    for (const k of nasljedno) {
      const v = cs[k as keyof CSSStyleDeclaration];
      if (typeof v === "string" && v) div.style.setProperty(kebab(k), v);
    }
  }

  // cloneNode je znatno brzi od innerHTML (nema ponovnog parsiranja ~250 kB).
  const klon = stranica.cloneNode(true) as HTMLElement;
  // Klasu .page-slide NAMJERNO zadrzavamo — na njoj visi nasljedno
  // font-family i cijeli set stilova. Kad se skine, klon dobije drugi font
  // i sve sekcije se pomjere (izmjereno 34px gore, sekcije +-62px).
  // Animaciju mu gasi CSS pravilo `.page-overlay .page-slide`.
  klon.removeAttribute("id");

  // `loading="lazy"` ne radi unutar translatiranog fixed klona — ucitavalo se
  // samo 7 od 49 slika, pa je klon izgledao drugacije od prave stranice
  // (to je bio vidljiv "trzaj" na pocetku). Prisili trenutno ucitavanje.
  klon.querySelectorAll("img").forEach((img) => {
    img.loading = "eager";
    img.decoding = "sync";
  });

  div.appendChild(klon);

  document.body.appendChild(div);
  overlayEl = div;

  // Skrol na vrh DOK je overlay preko svega — skok se ne vidi.
  if (scroll > 0) {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }

  return true;
}

export function ukloniStaruStranicu(): void {
  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
  }
}

export function imaStaruStranicu(): boolean {
  return overlayEl !== null;
}
