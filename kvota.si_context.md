# kvota.si — Kontekst projekta

## Kaj je

**kvota.si** je mobile-first spletna aplikacija za hitro ustvarjanje profesionalnih PDF ponudb, namenjena malim slovenskim izvajalcem (parketarjem, vodovodarjem, knaufarjem, elektrikarjem in drugim obrtnikom). Cilj: omogočiti uporabniku, da ustvari ponudbo z logotipom, podatki stranke, postavkami, izračunom DDV in podpisom v **manj kot eni minuti**.

**Tagline:** "Ponudbe, ki prepričajo."  
**Domain:** kvota.si  
**Repozitorij:** github.com/vidsinko/kvota.si  
**Live:** vidsinko.github.io/kvota.si (preko GitHub Pages)

## Tehnološka osnova

- **Vite 6 + React 18** (JSX, ne TypeScript — namerno odločeno za enostavnost)
- **Tailwind CSS** + ročno definirane CSS spremenljivke za znamko
- **lucide-react** za ikone
- **Brez backend-a** — vsi podatki v `localStorage` (s `window.storage` fallback za artifact preview)
- **Brez zunanjih PDF knjižnic** — vgrajen lasten **MiniPDF** generator (~150 vrstic), ki emitira PDF 1.4 byte format direktno
- **Slovenski UI**, EUR valuta, 22% DDV privzeto

## Arhitektura

Cela aplikacija je v **enem samem `src/App.jsx`** (~2700 vrstic). Razlogi:
- Lažja namestitev v artifact okolju za hitro prototipiranje
- Vsi state-i in komponente so na vidiku
- Prenos v polno SaaS verzijo bo enostaven kasneje

### Glavne komponente

App                          — glavni state holder, routing med tab-i in flow-i
├── HomeScreen               — dashboard z razdelki po statusu (Osnutki / Poslane / Plačane)
├── IndustrySelector         — Korak 1: izbira panoge
├── ClientForm               — Korak 2: podatki o stranki
├── ParametersForm           — Korak 3: postavke z živim izračunom
├── PDFPreview               — predogled + Web Share API + download
├── CustomersScreen          — CRUD strank
├── PriceListScreen          — CRUD panog + cenikov po panogah
├── IndustryEditor           — urejevalnik panoge (ime, ikona, barva)
├── TemplatesScreen          — uporaba prejšnjih ponudb kot izhodišče
├── SettingsScreen           — podatki podjetja, logo, privzeti pogoji
├── BottomNav                — 5-tab spodnja navigacija
├── PdfBody                  — HTML predogled, ki se zrcali z MiniPDF izhodom
├── MiniPDF (class)          — PDF generator s strukturiranimi ops + canvas renderer
└── renderOfferPDF()         — orchestrator, ki postavi celotno ponudbo

## Ključne odločitve dizajna

### Vizualni jezik
- Beige/gold paleta: `#B8895A` (primary), `#9C7245` (dark), `#F5EDE0` (tints), `#FAF7F2` (background)
- **Plus Jakarta Sans** za UI, **Caveat** za podpis
- **Mobile-first** — `max-width: 440px`, vse CTA-ji veliki in dosegljivi s palcem
- **Brez Tailwind arbitrary values** — vsi custom colori v inline stylih ali CSS class-ih, ker JIT compiler ni vedno na voljo
- Rounded cards (16-24px), soft shadows, gold gradient za primary CTA

### Industrije so prilagodljive
4 privzete (parket, vodovod, knauf, elektro) + neomejeno lastnih. Uporabnik izbere ikono iz 10 možnosti, barvo iz 8 odtenkov, ime in opis. Privzete imajo `builtin: true` flag — ne dajo se izbrisati, le preimenovati.

### Auto-detection ikon postavk
Funkcija `paramIconFor(label, unit)` ima ~27 ključnih besed v slovenščini (z normalizacijo diakritičnih znakov), ki samodejno izbere ustrezno ikono ko uporabnik tipka naziv postavke. Npr. "Pleskanje sten" → valj, "Montaža luči" → žarnica, "Brušenje parketa" → plasti.

### Sledenje statusa ponudb
Trije statusi: `draft` (gold, privzeto) → `sent` (modra) → `paid` (zelena). En klik na status značko cikla med njimi, ali odpre dropdown za neposredno izbiro. Časovni žigi `sentAt` in `paidAt` se hranijo. HomeScreen razdeli ponudbe v 3 sekcije.

### PDF generacija — namerno brez knjižnic
**Razlog:** GitHub Pages nima zunanjih dependencies, in `cdnjs.cloudflare.com` je včasih blokiran (npr. v artifact iframe-u).  
**Rešitev:** lasten `MiniPDF` razred, ki:
- Hrani `ops` kot strukturirane objekte (`{kind: 'text', x, y, ...}`)
- Pretvori v PDF byte stream prek `toBytes()`
- ALI v Canvas 2D rendering prek `renderToCanvas()` (za iOS PNG fallback)

**Helvetica WinAnsi encoding** za besedilo. Slovenske diakritike (`č`, `ć`, `đ`) se transliterirajo v ASCII (`c`, `c`, `d`), ker Helvetica Type1 jih ne podpira. Za polno Unicode podporo bi bilo treba vgraditi TrueType font (200-500 KB).

### Mobilni download — kompleksen problem
Web Share API (`navigator.share`) je primarni način za mobilce. Na desktopu klasičen `<a download>` na blob URL.

V artifact iframe-u na iOS-u **nič** ne deluje (Apple-ovo varnostno politiko). Na pravi domeni (GitHub Pages) deluje vse normalno.

## Funkcionalnost — celoten seznam

1. **Dashboard** s statistikami (število ponudb, poslane, plačano)
2. **3-koračno ustvarjanje ponudbe** (panoga → stranka → postavke)
3. **Živi izračun** ob tipkanju količin/cen
4. **Lastne postavke** (poleg privzetih iz cenika)
5. **Vključi/izključi** posamezne postavke v ponudbi
6. **PDF predogled** + prenos prave PDF datoteke
7. **Sledenje statusa** ponudbe (osnutek / poslano / plačano) s časovnimi žigi
8. **CRUD strank** (z avto-shranjevanjem ob ustvarjanju ponudbe)
9. **CRUD panog** s polnim ceniknom za vsako (lastne ikone in barve)
10. **Urejevalnik cenika** za vsako panogo (postavke, opisi, enote, cene)
11. **Predloge** — ponovna uporaba prejšnjih ponudb kot izhodišče
12. **Nastavitve** — podjetje (ime, davčna, IBAN, kontakt, logo)
13. **Avtomatsko številčenje** ponudb v formatu `KV-YYYY-00001`

## Datotečna struktura
