import { useEffect, useRef, useState } from "react";
import { uzmiStranicu } from "./lib/pageSnapshot";

// Prelaz stranice — DVOSLOJNI:
//   • stara stranica (snimljena PRIJE navigacije) TONE u mjestu
//   • nova stranica istovremeno SLAJDUJE zdesna preko nje
// Snimku pravi globalni interceptor klikova (App.tsx) prije navigate(),
// jer bi u useEffect-u DOM vec bio zamijenjen novom stranicom.
export default function RouteCurtain({ trigger }: { trigger: string }) {
  const [, setTick] = useState(0);
  const firstRef = useRef(true);
  const timersRef = useRef<number[]>([]);
  const rafRef = useRef<number[]>([]);
  const [overlay, setOverlay] = useState<string | null>(null);

  useEffect(() => {
    const bezAnimacije = () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ocisti = () => {
      document.documentElement.classList.remove("page-leaving", "page-entering");
      document.documentElement.style.removeProperty("--slide-offset");
    };

    if (firstRef.current) {
      firstRef.current = false; // prvi mount pokriva Preloader
      return;
    }
    if (bezAnimacije()) return;

    const root = document.documentElement;

    // Snimka stare stranice (uhvacena u interceptoru prije navigate()).
    const snimka = uzmiStranicu();

    // Ocisti prethodne tajmere/rafove
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    rafRef.current.forEach((id) => cancelAnimationFrame(id));
    rafRef.current = [];

    if (!snimka) {
      // Nema snimke (npr. Back dugme) — samo slide-in nove, bez tonjenja.
      root.style.setProperty("--slide-offset", "0px");
      root.classList.remove("page-leaving");
      root.classList.add("page-entering");
      setOverlay(null);
      const w0 = window.innerWidth;
      const d0 = w0 < 768 ? 1050 : w0 < 1024 ? 1300 : 1600;
      const c0 = window.setTimeout(() => {
        root.classList.remove("page-entering");
        root.style.removeProperty("--slide-offset");
      }, d0 + 120);
      timersRef.current = [c0];
      return;
    }

    // 1) Postavi zamrznuti klon stare stranice
    setOverlay(snimka.html);
    root.style.setProperty("--slide-offset", `${snimka.scroll}px`);

    // 2) Sljedeci frame pokreni OBE animacije zajedno
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        root.classList.add("page-entering");
        setTick((n) => n + 1);
      });
      rafRef.current.push(raf2);
    });
    rafRef.current.push(raf1);

    // 3) Ocisti kad animacija zavrsi (trajanje zavisi od ekrana)
    const w = window.innerWidth;
    const trajanje = w < 768 ? 1050 : w < 1024 ? 1300 : 1600;
    const t2 = window.setTimeout(() => {
      root.classList.remove("page-entering");
      root.style.removeProperty("--slide-offset");
      setOverlay(null);
    }, trajanje + 120);
    timersRef.current = [t2];

    return () => {
      rafRef.current.forEach((id) => cancelAnimationFrame(id));
      timersRef.current.forEach((id) => window.clearTimeout(id));
      ocisti();
    };
  }, [trigger]);

  if (!overlay) return null;

  return (
    <div
      className="page-overlay"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: overlay }}
    />
  );
}
