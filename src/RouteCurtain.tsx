import { useLayoutEffect, useRef, useState } from "react";
import { imaStaruStranicu, ukloniStaruStranicu } from "./lib/pageSnapshot";

// Prelaz stranice — DVOSLOJNI:
//   • stara stranica (overlay, ubacen sinhrono u kliku) TONE u mjestu
//   • nova stranica istovremeno SLAJDUJE zdesna preko nje
//
// Overlay NIJE React element — `prikaziStaruStranicu()` ga ubaci u DOM prije
// navigate(). Zato skok skrola na vrh (koji React izazove pri renderu) ostaje
// sakriven ispod overlaya i ne vidi se kao zasjeckanje.
export default function RouteCurtain({ trigger }: { trigger: string }) {
  const [, setTick] = useState(0);
  const firstRef = useRef(true);
  const timersRef = useRef<number[]>([]);
  const rafRef = useRef<number[]>([]);

  useLayoutEffect(() => {
    const bezAnimacije = () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ocistiKlase = () => {
      const root = document.documentElement;
      root.classList.remove("page-leaving", "page-entering");
      root.style.removeProperty("--slide-offset");
    };

    if (firstRef.current) {
      firstRef.current = false; // prvi mount pokriva Preloader
      return;
    }
    if (bezAnimacije()) {
      ukloniStaruStranicu();
      return;
    }

    const root = document.documentElement;

    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    rafRef.current.forEach((id) => cancelAnimationFrame(id));
    rafRef.current = [];

    const w = window.innerWidth;
    const trajanje = w < 768 ? 1050 : w < 1024 ? 1300 : 1600;

    // Sljedeci frame pokreni OBE animacije zajedno.
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        root.classList.add("page-entering");
        setTick((n) => n + 1);
      });
      rafRef.current.push(raf2);
    });
    rafRef.current.push(raf1);

    const t2 = window.setTimeout(() => {
      root.classList.remove("page-entering");
      root.style.removeProperty("--slide-offset");
      ukloniStaruStranicu();
    }, trajanje + 120);
    timersRef.current = [t2];

    return () => {
      rafRef.current.forEach((id) => cancelAnimationFrame(id));
      timersRef.current.forEach((id) => window.clearTimeout(id));
      // NAMJERNO bez ukloniStaruStranicu(): overlay je ubacen sinhrono u kliku,
      // PRIJE ovog rendera. Da ga cleanup brise, overlay bi nestao odmah nakon
      // klika (postojao bi samo djelić kadra) i skok skrola bi se vidio.
      ocistiKlase();
    };
  }, [trigger]);

  // Ako zbog necega overlay ostane (npr. prekid), ocisti ga na unmount.
  useLayoutEffect(() => () => ukloniStaruStranicu(), []);

  return null;
}

/** Da li je prelaz u toku (koristi App da ne dira skrol). */
export function prelazJeAktivan(): boolean {
  return imaStaruStranicu();
}
