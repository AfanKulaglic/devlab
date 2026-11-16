// Vektorska rekonstrukcija DevLab tikvice (izvor: 64x64 PNG).
// Cilj: identican oblik, ali beskonačno ostar (za 4K download).
// Boja: #4DEAE0 (brand tirkizna).
const TEAL = "#4DEAE0";

export function flaskSvg(size = 64): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none">
  <g stroke="${TEAL}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">
    <!-- grlo: dvije vertikalne stijenke -->
    <path d="M27.5 17.5 V34" />
    <path d="M36.5 17.5 V34" />
    <!-- tijelo: konus koji se siri, zaobljeno dno -->
    <path d="M27.5 32 L14.5 55.5 Q13.2 58.5 16.6 58.5 H47.4 Q50.8 58.5 49.5 55.5 L36.5 32" />
  </g>
  <!-- gornji otvor (rim) -->
  <rect x="24.5" y="13.6" width="15" height="4.4" rx="1.6" fill="${TEAL}" />
  <!-- tečnost na dnu -->
  <path d="M19.6 49.5 H44.4 L48.2 55.2 Q49.4 58 46.2 58 H17.8 Q14.6 58 15.8 55.2 Z" fill="${TEAL}" />
  <!-- mjehurići -->
  <circle cx="27.5" cy="45.2" r="2.5" fill="${TEAL}" />
  <circle cx="36" cy="45.2" r="1.7" fill="${TEAL}" />
  <!-- kapljica iznad -->
  <path d="M34 4.2 Q35.9 7.6 35.9 9.2 A1.95 1.95 0 0 1 32.1 9.2 Q32.1 7.6 34 4.2 Z" fill="${TEAL}" />
</svg>`;
}