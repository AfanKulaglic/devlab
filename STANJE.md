# Dev Lab — TRENUTNO STANJE
> Prepisuje se na kraju svake sesije. Kratko i aktualno.
Zadnje ažurirano: 2026-11-16 (novi prelaz stranice: stara tone, nova slajd zdesna)

## Projekt
- React + Vite + TypeScript + Tailwind. Skoro sav kod u `src/App.tsx`, stilovi `src/index.css`.
- Brend: **DevLab** (jedna riječ), teal `#4DEAE0`. Valuta KM. Font **Manrope** (Google Fonts).
- Produkcija: `https://devlab.cc.cd` (zaštićeni identifikator — ne mijenjati).
- Kontakt: `info@devlab.cc.cd`, `+387 62 576 456`.
- Admin: `/admin`, login `afan` / `080513`.
- Dev server: `npm run dev` → http://localhost:5173/
- Build: `NODE_OPTIONS=--max-old-space-size=4096 npm run build` (~2,0 MB single-file, gzip ~919 kB).
- Verifikacija: `npx tsc --noEmit` mora dati exit 0.

## Gotovo (zadnja sesija)

### 1. /brend — preuzimanje logotipa u punoj rezoluciji
Korisnik: "napravi mi na stranici logo da mogu skinuti logo u PNG formatu full HD 4K, bez pozadine, sa ikonicom koja ima pozadinu i DevLab kako stoji u navbaru".

| fajl | šta radi |
|---|---|
| `src/lib/logoVector.ts` | putanja + ugradjena base64 kopija ikone (fallback) |
| `src/BrandPage.tsx` | NOVO — stranica sa 6 varijanti + download |
| `src/App.tsx` | ruta `/brend` → `BrandPage` |

- **6 varijanti**: puni logo (tamna / svijetla), samo ikona sa okvirom, samo tikvica, samo tekst (tamna / svijetla).
- **3 formata po kartici**: HD 1920 px, 4K 3840 px (tačna širina), SVG vektor.
- Sve se crta na **`<canvas>`** — SVG-kao-slika ne učitava web fontove, pa bi tekst pao na sistemski font. Canvas koristi Manrope iz stranice.
- Ikona je **korisnikov original 512×512 PNG** (`public/images/logo-icon-hd.png`), prozirna pozadina. Ne crta se vektorski — koristi se tacno ta slika.
- Prozirna pozadina potvrđena (uglovi `0,0,0,0`), margine 136 px na 3840 px.
- Pregled svijetlih varijanti ide na bijeloj podlozi (inače se crni "Dev" ne vidi).
- Stranica je `noindex` automatski (soft-404 guard: nije u `known` listi).

### 2. Prelaz stranice — dvoslojni (stara tone u centar, nova klizi zdesna)

`src/RouteCurtain.tsx` + `src/lib/pageSnapshot.ts` + CSS u `src/index.css`.

| sloj | z-index | animacija |
|---|---|---|
| crna podloga `html::before` | 2 | jama u koju stranica tone |
| `.page-overlay` (stara) | 3 | `scale 1→0.4`, `rotateX 0→9°`, `brightness 1→0.25`, `blur 0→9px` |
| `.page-slide` (nova) | 4 | `translateX 100%→0` |

**Dva uzroka zasto prije nije radilo (dokazana mjerenjem):**

1. `RouteCurtain` je u `useEffect` klonirao `.page-slide` — a to je **poslije** React rendera, pa je dom vec bila NOVA stranica (`overlaySadrzaj === slideSadrzaj`). Animacija tonjenja se zato nikad nije vidjela.
   **Fix:** `src/lib/pageSnapshot.ts` — `sacuvajStranicu()` se zove u interceptoru **prije** `navigate()`.
2. Mobilni meni je radio **puni reload** (zato preloader): `.menu-panel` ima `onClick={stopPropagation}`, a interceptor je bio u **bubble** fazi na `<document>` — `stopPropagation` ga je ubijao.
   **Fix:** `document.addEventListener("click", onClick, true)` — **capture** faza.
3. Uklonjen `onClick={closeMenu}` sa 5 linkova u mobilnom meniju; meni se zatvara kroz `useEffect([route])`.

**Trajanje po ekranu** (stara i nova uvijek isto): mobilno (<768) **1050 ms**, tablet (<1024) **1300 ms**, desktop **1600 ms**.

**Izmjereno** (margine simetricne → skuplja se u centar, stara != nova):

- mobilno: 280ms `L17 R17 T30 T30`, 620ms `L70 R70 T120 T120`, 950ms `L114 R114 T196 T196`
- `MOB Projekti` stara `DevLab · Digitalna agencija` / nova `PortfolioNaši projekti`
- `DESK O nama` stara `DevLab · Digitalna agencija` / nova `O namaTko smo mi`

Overlay se cisti na svim rutama + Back; nema gresaka u konzoli; reduced-motion preskace.

**Skrolovanje nema animaciju — nigdje.**

- Uklonjen globalni `scroll-behavior: smooth` sa `html` (animirao je i vracanje skrola pri Back/Forward: 0 → 1500 u 37 koraka / 770 ms).
- Gde animacija **treba**, u JS-u je eksplicitno `behavior: "smooth"`: dugme `Nazad na vrh`, `#anchori`, skrol na sekciju.
- Modul flag `dosaoIzHistorije` — na `popstate` se skrol **ne** vraca na vrh, browser vrati zapamtu poziciju u jednom skoku.

Izmjereno (mobilno i desktop isto):

```
link->/o-nama    prije=1200  2 promjene  kraj=0     instant
link->/projekti  prije=900   2 promjene  kraj=0     instant
link->/kontakt   prije=1600  2 promjene  kraj=0     instant
BACK #1                      2 promjene  kraj=1600  instant
BACK #2                      2 promjene  kraj=900   instant
BACK #3                      2 promjene  kraj=1200  instant
```

Dugme `Nazad na vrh` ostalo animirano (80 koraka / 1576 ms).

### 3. Nova ikona svuda
Stara 64x64 ikona (`logo-icon.png`) **obrisana**. Nova (`logo-icon-hd.png`, 512x512) zamijenjena na 8 mjesta:
`src/App.tsx` (navbar, footer, /logo), `src/lib/postLogo.ts` (base64 za objave), `src/MailSignaturePage.tsx`, `index.html` (favicon + JSON-LD), `api/send-mail.ts`.

### 4. p06 — "Pet usluga" → "Četiri usluge"
Lista ima 4 stavke (stranice, igrice, aplikacije, AI), a podnaslov je govorio "Pet". Popravljeno u `src/lib/posts1.ts`.

## Blokirano / otvoreno
- **Vercel ne deploya** — produkcija zaostaje ~11 commitova. Provjeri `vercel.com/dashboard` → Deployments.
  Verifikacija: `curl -s https://devlab.cc.cd/ | grep -c 'charAt(path.length'` mora dati `1`.
- **Mail ne dolazi na Gmail** — DKIM 7/7 success, ali poruke se ne pojavljuju. Deprioritizovano.
- **Video reklama** — prompt spreman (v3, realno, restoran, 80 € / 300 €). Korisnik još nije generisao.

## Sljedeći korak
1. Riješi Vercel deploy (blokira sve nove fixeve).
2. Otvori `https://devlab.cc.cd/brend` i preuzmi 4K logo.
3. Google Business Profile — popuniti (free, verifikacija do 5 dana).