// Snimka stare stranice PRIJE nego React zamijeni rutu.
// Bez ovoga RouteCurtain klonira NOVU stranicu (useEffect radi poslije rendera),
// pa se animacija tonjenja nikad ne vidi — overlay i nova stranica su identicni.

export type PageSnapshot = {
  html: string;
  scroll: number;
};

let pending: PageSnapshot | null = null;

/** Pozovi ODMAH prije navigate() — u istom event handleru. */
export function sacuvajStranicu(): void {
  if (typeof document === "undefined") return;
  const el = document.querySelector(".page-slide");
  if (!el) {
    pending = null;
    return;
  }
  pending = {
    html: el.innerHTML,
    scroll: typeof window !== "undefined" ? window.scrollY : 0,
  };
}

/** Uzmi snimku (i obrisi je). Vraca null ako je nema. */
export function uzmiStranicu(): PageSnapshot | null {
  const s = pending;
  pending = null;
  return s;
}
