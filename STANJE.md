# Dev Lab — TRENUTNO STANJE
> Prepisuje se na kraju svake sesije. Kratko i aktualno.
Zadnje ažurirano: 2026-11-16 (prelaz: uklonjeno zasjeckanje na skrolovanim stranicama)

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
| `.page-overlay` (stara) | 3 | `scale 1→0.4`, `rotateX 0→9°`, `opacity 1→0` |
| `.page-slide` (nova) | **4** | `translateX 100%→0` |

**Nova je IZNAD stare** — klizi preko nje zdesna. Stara se ispod smanjuje prema centru i vidi se lijevo dok je nova ne pokrije. (Korisnik je eksplicitno tražio da stara NE bude iznad nove.)

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

**Zasjeckanje na POČETKU prelaza (skrolovane stranice) — riješeno.**
Korisnik: "nesto zasjecka kada se desava animacija da stara stranica tone, i to samo na stranicama koje sam skrolao".

Uzrok: klon stare stranice se pravio u `useEffect` **poslije** React rendera, pa je prvi kadar pokazivao novu stranicu na staroj skrol poziciji, a zatim skok na vrh (izmjereno 81 ms `scrollY=5188` → 162 ms `scrollY=0`).

Rješenje — **4 mjerenjem dokazana popravke**:

1. **Klon se pravi sinhrono u kliku**, prije `navigate()` (`prikaziStaruStranicu()` u `pageSnapshot.ts`), overlay se ubaci u DOM odmah i skrol na vrh se desi **ispod njega**. Skok više nije vidljiv.
2. **`cloneNode` umjesto `innerHTML`** — nema ponovnog parsiranja ~250 kB.
3. **Klonu se NE skida klasa `.page-slide`** — na njoj visi naslijeđeni font. Kad se skine, klon dobije Manrope sa `<body>` umjesto Tailwind fonta aplikacije i sve se prelomi drugačije (sekcije ±62 px, sadržaj 34 px gore).
4. **Nasljedni stilovi se prepisuju sa omotača na overlay** (`fontFamily`, `color`, `-webkit-font-smoothing`…), ali **NE** `fontSize`/`lineHeight`/`letterSpacing` — kopiranje computed vrijednosti zaključa `line-height` na apsolutnih 24 px, pa sitan tekst (11.2 px) dobije pogrešnu visinu linije (+7 px po redu).

Izmjereno poslije: **pomak sadržaja 0 px na skrolu 0/1500/3000/6000**; piksel-diff klona vs original 2,8–7,0 (samo razlika u antialiasingu jer je klon u kompozitnom sloju). Skok skrola uvijek ispod overlay-a (`ov:DA ✓`). Najduži kadar 55–63 ms, 1–2 duga kadra, bez grešaka — desktop i mobilni.

Uz to: `filter: blur/brightness` **potpuno uklonjen** sa `.page-overlay` i `page-sink` (skupo je za klon visok 12 000+ px — kadrovi od 114 ms). Preostala su samo `transform` + `opacity`, plus `contain: layout paint style`.

Overlay se cisti na svim rutama + Back; nema gresaka u konzoli; reduced-motion preskace.

**Skrolovanje nema animaciju — nigdje.**

- Uklonjen globalni `scroll-behavior: smooth` sa `html` (animirao je i vracanje skrola pri Back/Forward: 0 → 1500 u 37 koraka / 770 ms).
- Gde animacija **treba**, u JS-u je eksplicitno `behavior: "smooth"`: dugme `Nazad na vrh`, `#anchori`, skrol na sekciju.
- Modul flag `dosaoIzHistorije` — na `popstate` se skrol **ne** vraca na vrh, browser vrati zapamtu poziciju u jednom skoku.

**Back/Forward — skrol vracamo SAMI, prije crtanja (fix 2026-11-16).**
Korisnik: "kada skrolam do odredjenog dijela sajta i predjem na drugi i vratim se, prvo se prikaze vrh pa odjednom trepne i skrola".

- `history.scrollRestoration = "manual"` — browserovo vracanje je KASNO (poslije React rendera) → vidi se vrh pa skok.
- Skrol se pamti **po history zapisu**: indeks zapisa u `history.state.idx`, pozicije u `sessionStorage` (`dvf-skrol-mapa`). Tako i **Forward** vraca tačnu poziciju (prije je vraćao 0).
- Vraćanje ide u **`useLayoutEffect`** (prije paint-a), ne `useEffect`.
- **Jedan** `popstate` slušalac na nivou modula — hook `useAppRoute()` se koristi na dva mjesta, pa se događaj obrađivao dvaput i drugi prolaz je pregazio upravo upisanu poziciju (sve je vraćalo istu vrijednost).

Izmjereno (desktop i mobilni):

```
skrol 3000 -> /o-nama (skrol 1200) -> /kontakt (skrol 600)
BACK #1 -> /o-nama   y=1200  ✓   (0 kadrova na vrhu)
BACK #2 -> /         y=3000  ✓   (0 kadrova na vrhu)
FWD  #1 -> /o-nama   y=1200  ✓
FWD  #2 -> /kontakt  y=600   ✓
novi link -> /usluge y=0     ✓
mob: 4000 -> link -> BACK vraca 4000 u prvom kadru  ✓
```

Izmjereno (mobilno i desktop isto):

```
link->/o-nama    prije=1200  2 promjene  kraj=0     instant
link->/projekti  prije=900   2 promjene  kraj=0     instant
link->/kontakt   prije=1600  2 promjene  kraj=0     instant
```

Dugme `Nazad na vrh` ostalo animirano (80 koraka / 1576 ms).

### 3. Nova ikona svuda
Stara 64x64 ikona (`logo-icon.png`) **obrisana**. Nova (`logo-icon-hd.png`, 512x512) zamijenjena na 8 mjesta:
`src/App.tsx` (navbar, footer, /logo), `src/lib/postLogo.ts` (base64 za objave), `src/MailSignaturePage.tsx`, `index.html` (favicon + JSON-LD), `api/send-mail.ts`.

### 4. p06 — "Pet usluga" → "Četiri usluge"
Lista ima 4 stavke (stranice, igrice, aplikacije, AI), a podnaslov je govorio "Pet". Popravljeno u `src/lib/posts1.ts`.

## Blokirano / otvoreno
- **NIJE Vercel — nego push.** 17.11. ustanovljeno: lokalni `main` je bio **29 commita ispred `origin/main`**, pa Vercel nije imao šta da deploya (zadnji push 14.11.). Zato je na domeni svaka stranica radila **puni reload sa preloaderom** — produkcija je bila stari build bez SPA interceptor-a.
  **Popravljeno:** `git push origin main` → deploy gotov za ~75 s.
  **Uvijek provjeri prije nego što kriviš Vercel:** `git rev-list --count origin/main..HEAD` mora biti `0`.
  Verifikacija da je produkcija nova: `curl -s https://devlab.cc.cd/ | grep -c 'page-overlay'` → `2`, i `curl -s -o /dev/null -w "%{http_code}" https://devlab.cc.cd/images/logo-icon-hd.png` → `200`.
- **Mail ne dolazi na Gmail** — DKIM 7/7 success, ali poruke se ne pojavljuju. Deprioritizovano.
- **Video reklama** — prompt spreman (v3, realno, restoran, 80 € / 300 €). Korisnik još nije generisao.

## Sljedeći korak
1. Riješi Vercel deploy (blokira sve nove fixeve).
2. Otvori `https://devlab.cc.cd/brend` i preuzmi 4K logo.
3. Google Business Profile — popuniti (free, verifikacija do 5 dana).