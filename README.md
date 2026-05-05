# kvota.si

Mobile-first webapp za hitro ustvarjanje profesionalnih PDF ponudb za male izvajalce.

## 🚀 Deploy na GitHub Pages — koraki

### 1. Ustvari nov GitHub repozitorij

Pojdi na [github.com/new](https://github.com/new) in ustvari nov repo (npr. `kvota-si`). **Pusti ga prazen** (brez README, .gitignore ali license — sicer bo prišlo do konflikta).

### 2. Naloži kodo

V terminalu, v mapi tega projekta:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/kvota-si.git
git push -u origin main
```

(Zamenjaj `USERNAME` s svojim GitHub uporabniškim imenom.)

### 3. Popravi `base` v `vite.config.js`

Odpri `vite.config.js` in poskrbi, da je `base` enako kot ime tvojega repozitorija:

```js
base: '/kvota-si/',  // če je repo github.com/USERNAME/kvota-si
```

Če uporabljaš lasten domain (npr. `kvota.si`), nastavi na `'/'`.

### 4. Vklopi GitHub Pages

Na GitHub-u, v repu pojdi v:

**Settings → Pages → Build and deployment → Source: GitHub Actions**

(Ne klasično "Deploy from a branch", ampak novejšo opcijo "GitHub Actions".)

### 5. Push in počakaj

Vsak push na `main` bo samodejno zgradil aplikacijo in jo objavil. Po ~1 minuti bo na voljo na:

```
https://USERNAME.github.io/kvota-si/
```

Status build-a vidiš pod zavihkom **Actions** v repu.

### 6. (Neobvezno) Lasten domain

Če imaš domain `kvota.si`:

1. V `Settings → Pages → Custom domain` vpiši `kvota.si` in shrani
2. V `vite.config.js` spremeni `base: '/'`
3. Pri svojem DNS ponudniku dodaj `CNAME` zapis za `kvota.si`, ki kaže na `USERNAME.github.io`
4. GitHub bo samodejno priskrbel HTTPS certifikat (lahko traja 1–24 ur)

---

## 💻 Lokalni razvoj

```bash
npm install
npm run dev
```

Aplikacija teče na [localhost:5173](http://localhost:5173).

## 🔨 Produkcijski build (lokalno preverjanje)

```bash
npm run build
npm run preview
```

## 📦 Tehnologije

- **Vite + React 18** — hitra build pipeline
- **Tailwind CSS** — design tokens
- **lucide-react** — ikone
- **MiniPDF** (vgrajen) — PDF generiranje brez zunanjih knjižnic
- **window.localStorage** — vsi podatki ostanejo na napravi uporabnika

## 🎯 Funkcionalnost

- 4 privzete panoge + neomejeno lastnih
- Mobile-first UX
- Pametno auto-detection ikon postavk
- Sledenje statusu ponudb (osnutek / poslano / plačano)
- Pravi PDF download (na pravi domeni delujejo Web Share API in `<a download>` brez težav)
- Brez zunanjih API-jev, brez backend-a, brez login-a

## ⚠️ Pomembno

- Vsi podatki (ponudbe, stranke, nastavitve) se hranijo v `localStorage` brskalnika. **Brisanje brskalnikovih podatkov pomeni izgubo ponudb.** Za pravo aplikacijo razmisli o sinhronizaciji s cloud bazo (Supabase, Firebase).
- Knjižnica MiniPDF transliterira `č` → `c`, `š` → `s` itd. v PDF-jih (Helvetica Type1 font ne podpira teh znakov). Za polno Unicode podporo bi bilo treba vgraditi TrueType font (Inter, Roboto), kar je 200–500 KB dodatno.

## 📝 Licenca

MIT — uporabljaj prosto.
