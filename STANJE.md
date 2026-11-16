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

### 2. Prelaz stranice — dvoslojni (1,05 s)

`src/RouteCurtain.tsx` (**novi fajl**) + CSS u `src/index.css`.

Na navigaciju se **klonira stara stranica** u `.page-overlay` (HTML clone, bez biblioteka) i pokrenu se **obje animacije u istom frame-u**:

| sloj | z-index | animacija |
|---|---|---|
| `.page-overlay` (stara) | 3 | tone: `scale 1→0.86`, `translateY 4%`, `blur 0→7px` |
| `.page-slide` (nova) | 4 | klizi: `translateX 100%→0` |

- Nova je **iznad** stare → vidi se kako klizi preko nje dok stara tone
- `--slide-offset` čuva scroll poziciju klona
- Provjereno mjerenjem oba sloja: 250ms `op=0.96/x=399`, 450ms `op=0.88/x=101`, 950ms `op=0.09/x=0`
- Overlay se čisti bez ostatka; Back dugme radi; reduced-motion preskače

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