import { useEffect, useRef, useState } from "react";

// Prelaz stranice — DVOSLOJNI:
//   • stara stranica se ZAMRZNE (clone u overlay sloju) i TONE u mjestu
//   • nova stranica istovremeno SLAJDUJE zdesna preko nje
// Bez biblioteka: HTML clone umjesto screenshot-a, pa je sve u DOM-u i CSS-u.
export default function RouteCurtain({ trigger }: { trigger: string }) {
  const [, setTick] = useState(0);
  const firstRef = useRef(true);
  const timersRef = useRef<number[]>([]);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [overlay, setOverlay] = useState<string | null>(null);

  useEffect(() => {
    const bezAnimacije = () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ocisti = () => {
      document.documentElement.classList.remove("page-leaving", "page-entering");
      setOverlay(null);
    };

    if (firstRef.current) {
      firstRef.current = false; // prvi mount pokriva Preloader
      return;
    }
    if (bezAnimacije()) return;

    const root = document.documentElement;
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];

    // ── 1) Zamrzni STARU stranicu u overlay sloj ──────────────────
    // Uzmi HTML trenutnog sadržaja prije nego React zamijeni rutu.
    const stara = document.querySelector(".page-slide");
    const stariHtml = stara ? stara.innerHTML : null;
    const stariScroll = window.scrollY;

    if (stariHtml) {
      setOverlay(stariHtml);
      // Overlay mora poceti na istoj scroll poziciji na kojoj je korisnik bio
      root.style.setProperty("--slide-offset", `${stariScroll}px`);
      // Odmah sakrij pravi sadržaj (overlay ga zamjenjuje 1:1)
      root.classList.add("page-leaving");
    }

    // ── 2) Sljedeći frame: pokreni OBE animacije istovremeno ─────
    // Stara (overlay) tone, nova (pravi sadržaj) klizi zdesna.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        root.classList.remove("page-leaving");
        root.classList.add("page-entering");
        setTick((n) => n + 1);
      });
    });

    // ── 3) Ocisti sve kad animacija zavrsi ──────────────────────
    // Trajanje zavisi od ekrana (vidi @media u index.css):
    //   mobilno (<768) 1050ms · tablet (<1024) 1300ms · desktop 1600ms
    const w = window.innerWidth;
    const trajanje = w < 768 ? 1050 : w < 1024 ? 1300 : 1600;
    const t2 = window.setTimeout(() => {
      root.classList.remove("page-entering");
      setOverlay(null);
      root.style.removeProperty("--slide-offset");
      window.scrollTo({ top: stariScroll, behavior: "instant" as ScrollBehavior });
    }, trajanje + 120);

    timersRef.current = [t2];

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      timersRef.current.forEach((id) => window.clearTimeout(id));
      ocisti();
    };
  }, [trigger]);

  if (!overlay) return null;

  // Overlay: klon stare stranice, fiksiran preko ekrana, tone u mjestu.
  return (
    <div
      ref={overlayRef}
      className="page-overlay"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: overlay }}
    />
  );
}
