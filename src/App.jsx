import { useState, useEffect, useRef } from 'react';
import {
  Home, Users, Tag, FileText, Settings as SettingsIcon,
  Plus, ChevronRight, ChevronDown, ChevronLeft, ArrowLeft,
  Hammer, Wrench, Layers, Zap,
  Square, Ruler, Clock, Package, MoreHorizontal, Box,
  Euro, X, Check, Trash2, Edit2, Phone, Mail, Globe,
  Building2, MapPin, Hash, CreditCard, Upload,
  Calendar, Heart, Download, Eye,
  ClipboardList, Wallet, FileSignature, Save, Sparkles,
  Droplet, Lightbulb, Paintbrush, Truck, Plug,
  Wind, Flame, Trees, Brush, Pickaxe, ShowerHead,
  Power, Cable, ToyBrick, Drill, PaintRoller,
} from 'lucide-react';

/* =========================================================================
   kvota.si — MVP for fast PDF offer creation
   All custom colors live in a <style> block (no Tailwind JIT dependency).
   Standard Tailwind utilities used only for layout / spacing / sizing.
   ========================================================================= */

// --------------------------------------------------------------------------
// Storage keys & defaults
// --------------------------------------------------------------------------
const KEYS = {
  offers: 'kvota:offers',
  customers: 'kvota:customers',
  settings: 'kvota:settings',
  templates: 'kvota:templates',
  industries: 'kvota:industries',
  counter: 'kvota:counter',
};

const VAT_RATE = 0.22;

// Available icons users can pick when creating a custom industry.
// Keys must match the `name` prop accepted by <ParamIcon />.
const INDUSTRY_ICONS = ['hammer', 'wrench', 'layers', 'zap', 'square', 'ruler', 'package', 'box', 'clock', 'more'];

// Curated accent palette for industries (warm/professional, on-brand)
const INDUSTRY_COLORS = [
  '#B8895A', // brand gold (parket)
  '#5A8AB8', // blue (vodovod)
  '#8A8A8A', // graphite (knauf)
  '#C9A227', // mustard (elektro)
  '#7BA05B', // sage
  '#A65A5A', // terracotta
  '#5A6FB8', // indigo
  '#9C7245', // dark gold
];

const DEFAULT_INDUSTRIES = {
  parket:  { id: 'parket',  name: 'Parketarska dela',     short: 'Parket',  icon: 'hammer', accent: '#B8895A', desc: 'Polaganje, brušenje, letvice', builtin: true },
  vodovod: { id: 'vodovod', name: 'Vodovodarska dela',    short: 'Vodovod', icon: 'wrench', accent: '#5A8AB8', desc: 'Cevi, pipe, sanitarna oprema', builtin: true },
  knauf:   { id: 'knauf',   name: 'Inštalacije knaufa',   short: 'Knauf',   icon: 'layers', accent: '#8A8A8A', desc: 'Plošče, izolacija, kitanje',    builtin: true },
  elektro: { id: 'elektro', name: 'Elektro inštalacije',  short: 'Elektro', icon: 'zap',    accent: '#C9A227', desc: 'Cevi, vtičnice, omarice',       builtin: true },
};

// INDUSTRIES is a live mirror of the React `industries` state, kept at module
// scope so non-React code (the PDF renderer, helpers) can resolve industry
// data without prop-drilling. The App component re-syncs this on every state change.
let INDUSTRIES = { ...DEFAULT_INDUSTRIES };
function syncIndustries(next) {
  // Mutate in place so existing references stay live
  Object.keys(INDUSTRIES).forEach((k) => { delete INDUSTRIES[k]; });
  Object.assign(INDUSTRIES, next);
}

const DEFAULT_TEMPLATES = {
  parket: [
    { id: 'pa1', label: 'Polaganje parketa',     desc: 'Montaža večslojnega parketa', unit: 'm²',  price: 18 },
    { id: 'pa2', label: 'Priprava podlage',      desc: 'Niveliranje in čiščenje',     unit: 'm²',  price: 6  },
    { id: 'pa3', label: 'Brušenje / izravnava',  desc: 'Brušenje podlage',            unit: 'm²',  price: 8  },
    { id: 'pa4', label: 'Lepilo za parket',      desc: 'Lepilo in nanos',             unit: 'kg',  price: 3  },
    { id: 'pa5', label: 'Letvice',               desc: 'Tekoči meter',                unit: 'tm',  price: 4  },
    { id: 'pa6', label: 'Montaža letvic',        desc: 'Pritrditev in obdelava',      unit: 'tm',  price: 3  },
    { id: 'pa7', label: 'Zaključni profili',     desc: 'Profili in prehodi',          unit: 'tm',  price: 8  },
    { id: 'pa8', label: 'Delo dodatno',          desc: 'Ura dela',                    unit: 'h',   price: 30 },
    { id: 'pa9', label: 'Dostava / prevoz',      desc: 'Pavšal',                      unit: 'kos', price: 30 },
  ],
  vodovod: [
    { id: 'vo1', label: 'Vodovodne cevi',           desc: 'Razvod',                  unit: 'tm',  price: 18 },
    { id: 'vo2', label: 'Odtočne cevi',             desc: 'Odtoki',                  unit: 'tm',  price: 16 },
    { id: 'vo3', label: 'Priklop sanitarne opreme', desc: 'Priklop',                 unit: 'kos', price: 45 },
    { id: 'vo4', label: 'Montaža pipe',             desc: 'Pipa',                    unit: 'kos', price: 35 },
    { id: 'vo5', label: 'Montaža WC školjke',       desc: 'Z tesnili',               unit: 'kos', price: 80 },
    { id: 'vo6', label: 'Montaža umivalnika',       desc: 'S sifonom',               unit: 'kos', price: 70 },
    { id: 'vo7', label: 'Material drobni',          desc: 'Spojni in tesnilni',      unit: 'kos', price: 50 },
    { id: 'vo8', label: 'Delo',                     desc: 'Ura dela',                unit: 'h',   price: 35 },
    { id: 'vo9', label: 'Dostava / prihod',         desc: 'Pavšal',                  unit: 'kos', price: 30 },
  ],
  knauf: [
    { id: 'kn1', label: 'Knauf plošče',          desc: 'Plošče in pritrditev',     unit: 'm²',  price: 16 },
    { id: 'kn2', label: 'Podkonstrukcija',       desc: 'CD/UD profili',            unit: 'm²',  price: 9  },
    { id: 'kn3', label: 'Izolacija',             desc: 'Mineralna volna',          unit: 'm²',  price: 8  },
    { id: 'kn4', label: 'Bandažiranje stikov',   desc: 'Trakovi in kit',           unit: 'm²',  price: 7  },
    { id: 'kn5', label: 'Kitanje',               desc: 'Fina obdelava',            unit: 'm²',  price: 6  },
    { id: 'kn6', label: 'Brušenje',              desc: 'Priprava za pleskanje',    unit: 'm²',  price: 4  },
    { id: 'kn7', label: 'Drobni material',       desc: 'Vijaki, trakovi',          unit: 'kos', price: 40 },
    { id: 'kn8', label: 'Delo dodatno',          desc: 'Ura dela',                 unit: 'h',   price: 30 },
    { id: 'kn9', label: 'Dostava / prevoz',      desc: 'Pavšal',                   unit: 'kos', price: 30 },
  ],
  elektro: [
    { id: 'el1',  label: 'Elektro cevi',         desc: 'Razvod',                   unit: 'tm',  price: 8   },
    { id: 'el2',  label: 'Vlečenje kablov',      desc: 'Po cevi',                  unit: 'tm',  price: 3   },
    { id: 'el3',  label: 'Montaža vtičnice',     desc: 'S povezavo',               unit: 'kos', price: 18  },
    { id: 'el4',  label: 'Montaža stikala',      desc: 'S povezavo',               unit: 'kos', price: 18  },
    { id: 'el5',  label: 'Montaža luči',         desc: 'Stropna / stenska',        unit: 'kos', price: 25  },
    { id: 'el6',  label: 'Elektro omarica',      desc: 'Razdelilna omarica',       unit: 'kos', price: 150 },
    { id: 'el7',  label: 'Meritve / testiranje', desc: 'Zapisnik',                 unit: 'kos', price: 80  },
    { id: 'el8',  label: 'Drobni material',      desc: 'Spojke, trakovi',          unit: 'kos', price: 50  },
    { id: 'el9',  label: 'Delo',                 desc: 'Ura dela',                 unit: 'h',   price: 35  },
    { id: 'el10', label: 'Dostava / prihod',     desc: 'Pavšal',                   unit: 'kos', price: 30  },
  ],
};

const DEFAULT_SETTINGS = {
  companyName: '', address: '', postalCode: '', city: '',
  taxNumber: '', registrationNumber: '', iban: '',
  phone: '', email: '', website: '', logo: null,
  notes: 'V ceno je vključeno kvalitetno delo in uporaba profesionalnega orodja.',
  paymentTerms: 'po dogovoru',
  deliveryTerms: 'po dogovoru',
};

// --------------------------------------------------------------------------
// Storage helpers — localStorage on real domain, window.storage in artifact preview
// --------------------------------------------------------------------------
const memCache = {};
const hasArtifactStorage = typeof window !== 'undefined' && !!window.storage;
const hasLocalStorage = (() => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    // Privacy mode in some browsers exposes localStorage but throws on write
    const k = '__kvota_test__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch { return false; }
})();

async function loadJSON(key, fallback) {
  try {
    // Prefer localStorage (production); fall back to artifact storage (preview); last resort: in-memory
    if (hasLocalStorage) {
      const v = window.localStorage.getItem(key);
      return v != null ? JSON.parse(v) : fallback;
    }
    if (hasArtifactStorage) {
      const r = await window.storage.get(key);
      if (r && r.value) return JSON.parse(r.value);
      return fallback;
    }
    return memCache[key] !== undefined ? memCache[key] : fallback;
  } catch { return fallback; }
}
async function saveJSON(key, value) {
  try {
    if (hasLocalStorage) {
      window.localStorage.setItem(key, JSON.stringify(value));
    } else if (hasArtifactStorage) {
      await window.storage.set(key, JSON.stringify(value));
    }
    memCache[key] = value;
  } catch { memCache[key] = value; }
}

// --------------------------------------------------------------------------
// Calculations & formatting
// --------------------------------------------------------------------------
const lineTotal = (it) => (it.included === false ? 0 : Math.max(0, (Number(it.qty) || 0) * (Number(it.price) || 0)));
const calcTotals = (items) => {
  const subtotal = items.reduce((s, it) => s + lineTotal(it), 0);
  const vat = subtotal * VAT_RATE;
  return { subtotal, vat, total: subtotal + vat };
};
const fmtEUR = (n) =>
  new Intl.NumberFormat('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0) + ' €';
const fmtDate = (d) => new Date(d).toLocaleDateString('sl-SI', { day: '2-digit', month: '2-digit', year: 'numeric' });
const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (iso, days) => { const d = new Date(iso); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };
const offerNumber = (counter, year = new Date().getFullYear()) => `KV-${year}-${String(counter).padStart(5, '0')}`;
const safeFilename = (num, name) =>
  `${num}_${(name || 'ponudba').replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 40)}.pdf`;

// --------------------------------------------------------------------------
// PDF generation — built-in, NO external dependencies, NO network required.
// Generates real .pdf files from scratch using the PDF 1.4 spec.
// --------------------------------------------------------------------------

// CP1252 (WinAnsiEncoding) byte map for chars > 0x7F.
// Slovenian š/Š/ž/Ž are in CP1252 natively. č/Č/ć/Ć are not — transliterated to c/C.
const WIN_ANSI = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87,
  'ˆ': 0x88, '‰': 0x89, 'Š': 0x8A, '‹': 0x8B, 'Œ': 0x8C, 'Ž': 0x8E,
  '\u2018': 0x91, '\u2019': 0x92, '\u201C': 0x93, '\u201D': 0x94, '•': 0x95,
  '–': 0x96, '—': 0x97, '˜': 0x98, '™': 0x99, 'š': 0x9A, '›': 0x9B,
  'œ': 0x9C, 'ž': 0x9E, 'Ÿ': 0x9F,
};
// Direct mapping for Latin-1 supplement (0xA0–0xFF) which matches Unicode codepoints
for (let i = 0xA0; i <= 0xFF; i++) {
  const ch = String.fromCharCode(i);
  if (WIN_ANSI[ch] === undefined) WIN_ANSI[ch] = i;
}

// Transliteration for chars not in CP1252 (Eastern European Latin)
const TRANSLIT = {
  'č': 'c', 'Č': 'C', 'ć': 'c', 'Ć': 'C',
  'đ': 'd', 'Đ': 'D',
  'ł': 'l', 'Ł': 'L', 'ń': 'n', 'Ń': 'N',
  'ą': 'a', 'Ą': 'A', 'ę': 'e', 'Ę': 'E',
  'ř': 'r', 'Ř': 'R', 'ť': 't', 'Ť': 'T',
  '\u00a0': ' ',
};

// Encode a JS string into a PDF text-string body. Uses octal escapes for >0x7F bytes.
function encodePdfString(s) {
  let out = '';
  for (const c of String(s ?? '')) {
    const code = c.charCodeAt(0);
    if (c === '\\') out += '\\\\';
    else if (c === '(') out += '\\(';
    else if (c === ')') out += '\\)';
    else if (code >= 0x20 && code <= 0x7E) out += c; // printable ASCII
    else if (TRANSLIT[c] !== undefined) out += TRANSLIT[c];
    else if (WIN_ANSI[c] !== undefined) out += '\\' + WIN_ANSI[c].toString(8).padStart(3, '0');
    else out += '?';
  }
  return out;
}

// Helvetica character widths (per em) — used for layout (right-alignment, wrapping)
const HELV_W = {
  ' ': 0.278, '!': 0.278, '"': 0.355, '#': 0.556, '$': 0.556, '%': 0.889, '&': 0.667,
  "'": 0.191, '(': 0.333, ')': 0.333, '*': 0.389, '+': 0.584, ',': 0.278, '-': 0.333,
  '.': 0.278, '/': 0.278, '0': 0.556, '1': 0.556, '2': 0.556, '3': 0.556, '4': 0.556,
  '5': 0.556, '6': 0.556, '7': 0.556, '8': 0.556, '9': 0.556, ':': 0.278, ';': 0.278,
  '<': 0.584, '=': 0.584, '>': 0.584, '?': 0.556, '@': 1.015, 'A': 0.667, 'B': 0.667,
  'C': 0.722, 'D': 0.722, 'E': 0.667, 'F': 0.611, 'G': 0.778, 'H': 0.722, 'I': 0.278,
  'J': 0.5, 'K': 0.667, 'L': 0.556, 'M': 0.833, 'N': 0.722, 'O': 0.778, 'P': 0.667,
  'Q': 0.778, 'R': 0.722, 'S': 0.667, 'T': 0.611, 'U': 0.722, 'V': 0.667, 'W': 0.944,
  'X': 0.667, 'Y': 0.667, 'Z': 0.611, '[': 0.278, '\\': 0.278, ']': 0.278, '^': 0.469,
  '_': 0.556, '`': 0.333, 'a': 0.556, 'b': 0.556, 'c': 0.5, 'd': 0.556, 'e': 0.556,
  'f': 0.278, 'g': 0.556, 'h': 0.556, 'i': 0.222, 'j': 0.222, 'k': 0.5, 'l': 0.222,
  'm': 0.833, 'n': 0.556, 'o': 0.556, 'p': 0.556, 'q': 0.556, 'r': 0.333, 's': 0.5,
  't': 0.278, 'u': 0.556, 'v': 0.5, 'w': 0.722, 'x': 0.5, 'y': 0.5, 'z': 0.5,
  '{': 0.334, '|': 0.26, '}': 0.334, '~': 0.584, '€': 0.556, '°': 0.4,
};
function helvWidth(str, size = 11, bold = false) {
  let w = 0;
  for (const c of String(str ?? '')) {
    const ch = TRANSLIT[c] !== undefined ? TRANSLIT[c] : c;
    w += (HELV_W[ch] != null ? HELV_W[ch] : 0.5) * size;
  }
  return w * (bold ? 1.045 : 1);
}

// MiniPDF — page builder with structured ops. Each op is an object that
// can be serialized to PDF byte streams (toBytes) OR rendered to a canvas
// (renderToCanvas). This keeps a single source of truth for the offer layout.
function MiniPDF() { this.pages = []; this._cur = null; }
MiniPDF.prototype.page = function (w = 595, h = 842) {
  this._cur = { w, h, ops: [] };
  this.pages.push(this._cur);
  return this;
};
MiniPDF.prototype._pdfColor = function (c) {
  const hex = (c || '#000000').replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
};
MiniPDF.prototype.text = function (str, x, y, opts = {}) {
  this._cur.ops.push({ kind: 'text', str, x, y, opts: { ...opts } });
  return this;
};
MiniPDF.prototype.textRight = function (str, rightX, y, opts = {}) {
  const w = helvWidth(str, opts.size || 11, opts.bold);
  return this.text(str, rightX - w, y, opts);
};
MiniPDF.prototype.rect = function (x, y, w, h, opts = {}) {
  this._cur.ops.push({ kind: 'rect', x, y, w, h, opts: { ...opts } });
  return this;
};
MiniPDF.prototype.line = function (x1, y1, x2, y2, opts = {}) {
  this._cur.ops.push({ kind: 'line', x1, y1, x2, y2, opts: { ...opts } });
  return this;
};

// --- PDF byte renderer ---
MiniPDF.prototype._opToPdf = function (op, pageH) {
  if (op.kind === 'text') {
    const { str, x, y, opts } = op;
    const size = opts.size || 11;
    const fontKey = opts.bold ? 'F2' : 'F1';
    const encoded = encodePdfString(str);
    const pdfY = pageH - y - size * 0.78;
    return `${this._pdfColor(opts.color)} rg BT /${fontKey} ${size} Tf ${x.toFixed(2)} ${pdfY.toFixed(2)} Td (${encoded}) Tj ET`;
  }
  if (op.kind === 'rect') {
    const { x, y, w, h, opts } = op;
    const pdfY = pageH - y - h;
    let cmd = '';
    if (opts.fill)   cmd += `${this._pdfColor(opts.fill)} rg `;
    if (opts.stroke) cmd += `${this._pdfColor(opts.stroke)} RG `;
    if (opts.lineWidth != null) cmd += `${opts.lineWidth} w `;
    cmd += `${x.toFixed(2)} ${pdfY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re `;
    if (opts.fill && opts.stroke) cmd += 'B';
    else if (opts.fill)           cmd += 'f';
    else                          cmd += 'S';
    return cmd;
  }
  if (op.kind === 'line') {
    const { x1, y1, x2, y2, opts } = op;
    let cmd = `${this._pdfColor(opts.color)} RG `;
    if (opts.width != null) cmd += `${opts.width} w `;
    cmd += `${x1.toFixed(2)} ${(pageH - y1).toFixed(2)} m ${x2.toFixed(2)} ${(pageH - y2).toFixed(2)} l S`;
    return cmd;
  }
  return '';
};
MiniPDF.prototype.toBytes = function () {
  const numPages = this.pages.length;
  if (numPages === 0) throw new Error('No pages');
  const fontF1 = 3 + numPages * 2;
  const fontF2 = fontF1 + 1;
  const objects = [];
  objects.push({ id: 1, body: '<< /Type /Catalog /Pages 2 0 R >>' });
  const pageIds = this.pages.map((_, i) => 3 + i * 2);
  objects.push({ id: 2, body: `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${numPages} >>` });
  this.pages.forEach((p, i) => {
    const pid = 3 + i * 2;
    const cid = pid + 1;
    objects.push({ id: pid, body: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${p.w} ${p.h}] /Resources << /Font << /F1 ${fontF1} 0 R /F2 ${fontF2} 0 R >> >> /Contents ${cid} 0 R >>` });
    const stream = p.ops.map((op) => this._opToPdf(op, p.h)).join('\n');
    objects.push({ id: cid, body: `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream` });
  });
  objects.push({ id: fontF1, body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>' });
  objects.push({ id: fontF2, body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>' });

  let pdf = '%PDF-1.4\n%\xFF\xFF\xFF\xFF\n';
  const offsets = {};
  for (const obj of objects) {
    offsets[obj.id] = pdf.length;
    pdf += `${obj.id} 0 obj\n${obj.body}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${fontF2 + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= fontF2; i++) {
    pdf += `${String(offsets[i] || 0).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${fontF2 + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xFF;
  return bytes;
};

// Render the first page to a canvas. Returns the canvas element.
// Uses a 2x scale for crisp text on retina displays. iOS Safari can save
// canvas-derived images via long-press → "Add to Photos" / "Save to Files".
MiniPDF.prototype.renderToCanvas = function (scale = 2) {
  const page = this.pages[0];
  if (!page) throw new Error('No pages');
  const canvas = document.createElement('canvas');
  canvas.width  = Math.round(page.w * scale);
  canvas.height = Math.round(page.h * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  // White background (PDF assumed to render on white paper)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, page.w, page.h);

  for (const op of page.ops) {
    if (op.kind === 'rect') {
      const { x, y, w, h, opts } = op;
      if (opts.fill) {
        ctx.fillStyle = opts.fill;
        ctx.fillRect(x, y, w, h);
      }
      if (opts.stroke) {
        ctx.lineWidth = opts.lineWidth || 1;
        ctx.strokeStyle = opts.stroke;
        ctx.strokeRect(x, y, w, h);
      }
    } else if (op.kind === 'line') {
      const { x1, y1, x2, y2, opts } = op;
      ctx.strokeStyle = opts.color || '#000';
      ctx.lineWidth = opts.width || 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    } else if (op.kind === 'text') {
      const { str, x, y, opts } = op;
      const size = opts.size || 11;
      const weight = opts.bold ? 'bold' : 'normal';
      // Helvetica is universally available on iOS & macOS; Arial is the standard fallback elsewhere
      ctx.font = `${weight} ${size}px Helvetica, Arial, sans-serif`;
      ctx.fillStyle = opts.color || '#000';
      ctx.textBaseline = 'alphabetic';
      // Apply same transliteration the PDF uses, so canvas matches the PDF output
      let display = '';
      for (const c of String(str ?? '')) {
        display += TRANSLIT[c] !== undefined ? TRANSLIT[c] : c;
      }
      ctx.fillText(display, x, y + size * 0.78);
    }
  }
  return canvas;
};
MiniPDF.prototype.toPngDataUrl = function (scale = 2) {
  return this.renderToCanvas(scale).toDataURL('image/png');
};
MiniPDF.prototype.toBlob = function () {
  return new Blob([this.toBytes()], { type: 'application/pdf' });
};

// Wrap text into lines that fit a width
function wrapText(str, maxWidth, fontSize, bold = false) {
  const paragraphs = String(str ?? '').split(/\n/);
  const lines = [];
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) { lines.push(''); continue; }
    let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (helvWidth(test, fontSize, bold) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  }
  return lines.length ? lines : [''];
}

// Render an offer to a real PDF Blob (matches the kvota.si visual identity)
function renderOfferPDF(offer, settings) {
  const ind = INDUSTRIES[offer.industry] || INDUSTRIES.parket;
  const items = (offer.items || []).filter((i) => i.included !== false && Number(i.qty) > 0);
  const totals = calcTotals(offer.items || []);

  // Theme
  const GOLD = '#B8895A', GOLD_DARK = '#9C7245', GOLD_LITE = '#D4A574';
  const INK = '#1A1A1A', INK2 = '#5C544A', INK3 = '#9A9088';
  const LINE_LIGHT = '#E8DFCB', LINE_FAINT = '#F0E8DA';
  const BEIGE = '#F8F1E4';

  const pdf = new MiniPDF();
  pdf.page(595, 842); // A4
  const PW = 595, M = 40;

  // ===== HEADER =====
  let y = 50;
  // Brand mark (three rectangles like the SVG logo)
  pdf.rect(M,      y,     6, 28, { fill: GOLD });
  pdf.rect(M + 9,  y + 6, 6, 22, { fill: GOLD_LITE });
  pdf.rect(M + 9,  y,     6, 5,  { fill: GOLD_DARK });
  // Brand text
  const kvotaW = helvWidth('kvota', 22, true);
  pdf.text('kvota', M + 24, y + 2, { size: 22, bold: true, color: INK });
  pdf.text('.si',   M + 24 + kvotaW, y + 2, { size: 22, bold: true, color: GOLD });
  pdf.text('PONUDBE, KI PREPRICAJO.', M + 24, y + 28, { size: 7, color: INK3 });

  // Right block — PONUDBA + meta
  pdf.textRight('PONUDBA', PW - M, y, { size: 26, bold: true, color: GOLD });
  let metaY = y + 38;
  const meta = [
    ['Stevilka ponudbe:', String(offer.number || '')],
    ['Datum:', fmtDate(offer.issueDate)],
    ['Veljavnost ponudbe:', fmtDate(offer.validUntil)],
  ];
  meta.forEach(([label, value]) => {
    pdf.textRight(value, PW - M, metaY, { size: 10, bold: true, color: INK });
    const valW = helvWidth(value, 10, true);
    pdf.textRight(label, PW - M - valW - 16, metaY, { size: 10, color: INK2 });
    metaY += 14;
  });

  y = 118;
  pdf.line(M, y, PW - M, y, { color: LINE_LIGHT, width: 0.6 });

  // ===== PROVIDER / CLIENT =====
  y += 22;
  const colW = (PW - M * 2 - 24) / 2;
  const leftX = M;
  const rightX = M + colW + 24;

  pdf.text('PONUDNIK', leftX, y, { size: 8, bold: true, color: GOLD });
  pdf.text('STRANKA', rightX, y, { size: 8, bold: true, color: GOLD });
  y += 14;

  pdf.text(settings.companyName || 'Ime podjetja d.o.o.', leftX, y, { size: 12, bold: true, color: INK });
  pdf.text(offer.client?.name || '-', rightX, y, { size: 12, bold: true, color: INK });
  y += 16;

  const provLines = [
    settings.address,
    [settings.postalCode, settings.city].filter(Boolean).join(' '),
    settings.taxNumber && `Davcna st.: ${settings.taxNumber}`,
    settings.registrationNumber && `Maticna st.: ${settings.registrationNumber}`,
    settings.iban && `IBAN: ${settings.iban}`,
    settings.phone && `Telefon: ${settings.phone}`,
    settings.email && `E-mail: ${settings.email}`,
  ].filter(Boolean);
  const c = offer.client || {};
  const cliLines = [
    c.address,
    [c.postal, c.city].filter(Boolean).join(' '),
    c.taxNumber && `Davcna st.: ${c.taxNumber}`,
    c.email && `E-mail: ${c.email}`,
    c.phone && `Telefon: ${c.phone}`,
  ].filter(Boolean);
  let pY = y, cY = y;
  provLines.forEach((line) => { pdf.text(line, leftX, pY, { size: 10, color: INK2 }); pY += 13; });
  cliLines.forEach((line) => { pdf.text(line, rightX, cY, { size: 10, color: INK2 }); cY += 13; });
  y = Math.max(pY, cY) + 12;
  pdf.line(M, y, PW - M, y, { color: LINE_LIGHT, width: 0.6 });

  // ===== SUBJECT =====
  y += 22;
  pdf.text('PREDMET PONUDBE: ' + (ind.name || '').toUpperCase(), M, y, { size: 10, bold: true, color: GOLD });

  // ===== ITEMS TABLE =====
  y += 22;
  const tableW = PW - M * 2;
  const cQtyR   = M + tableW - 230; // right edge of qty col
  const cUnitR  = M + tableW - 170;
  const cPriceR = M + tableW - 95;
  const cTotalR = M + tableW - 10;

  // Header
  pdf.rect(M, y, tableW, 22, { fill: BEIGE });
  pdf.text('#',    M + 10, y + 7, { size: 8, bold: true, color: GOLD_DARK });
  pdf.text('OPIS', M + 32, y + 7, { size: 8, bold: true, color: GOLD_DARK });
  pdf.textRight('KOLICINA', cQtyR,   y + 7, { size: 8, bold: true, color: GOLD_DARK });
  pdf.textRight('ENOTA',    cUnitR,  y + 7, { size: 8, bold: true, color: GOLD_DARK });
  pdf.textRight('CENA',     cPriceR, y + 7, { size: 8, bold: true, color: GOLD_DARK });
  pdf.textRight('ZNESEK',   cTotalR, y + 7, { size: 8, bold: true, color: GOLD_DARK });
  y += 22;

  if (items.length === 0) {
    pdf.text('Ni postavk z vneseno kolicino.', M + 12, y + 12, { size: 10, color: INK3 });
    y += 30;
  } else {
    items.forEach((it, idx) => {
      const rowH = it.desc ? 28 : 22;
      if (idx > 0) pdf.line(M, y, PW - M, y, { color: LINE_FAINT, width: 0.4 });
      pdf.text(String(idx + 1), M + 10, y + 8, { size: 10, color: INK3 });
      pdf.text(it.label, M + 32, y + 6, { size: 10.5, bold: true, color: INK });
      if (it.desc) pdf.text(it.desc, M + 32, y + 18, { size: 8.5, color: INK3 });
      pdf.textRight(String(it.qty), cQtyR, y + 6, { size: 10, color: INK });
      pdf.textRight(it.unit, cUnitR, y + 6, { size: 10, color: INK2 });
      pdf.textRight(fmtEUR(it.price), cPriceR, y + 6, { size: 10, color: INK });
      pdf.textRight(fmtEUR(lineTotal(it)), cTotalR, y + 6, { size: 10, bold: true, color: INK });
      y += rowH;
    });
  }
  pdf.line(M, y, PW - M, y, { color: LINE_FAINT, width: 0.6 });
  y += 4;

  // ===== NOTES + TOTALS =====
  y += 24;
  const totalsX = PW - M - 230;
  const totalsW = 230;
  const totalsBoxH = 92;
  pdf.rect(totalsX, y - 6, totalsW, totalsBoxH, { fill: BEIGE });
  let tY = y + 8;
  pdf.text('Skupaj brez DDV', totalsX + 14, tY, { size: 10, color: INK });
  pdf.textRight(fmtEUR(totals.subtotal), totalsX + totalsW - 14, tY, { size: 10, bold: true, color: INK });
  tY += 18;
  pdf.text('DDV (22%)', totalsX + 14, tY, { size: 10, color: INK });
  pdf.textRight(fmtEUR(totals.vat), totalsX + totalsW - 14, tY, { size: 10, color: INK });
  tY += 12;
  pdf.line(totalsX + 14, tY, totalsX + totalsW - 14, tY, { color: '#E0D2B5', width: 0.5 });
  tY += 16;
  pdf.text('SKUPAJ Z DDV', totalsX + 14, tY + 4, { size: 9, bold: true, color: GOLD_DARK });
  pdf.textRight(fmtEUR(totals.total), totalsX + totalsW - 14, tY, { size: 15, bold: true, color: GOLD_DARK });

  // Notes (left)
  pdf.text('OPOMBE', M, y, { size: 8, bold: true, color: GOLD });
  let nY = y + 14;
  const notesMaxW = totalsX - M - 16;
  const notesLines = wrapText(offer.notes || '-', notesMaxW, 10);
  notesLines.forEach((line) => { pdf.text(line, M, nY, { size: 10, color: INK2 }); nY += 13; });
  nY += 6;
  pdf.text(`Rok izvedbe: ${offer.deliveryTerms || 'po dogovoru'}.`, M, nY, { size: 10, color: INK2 });
  nY += 13;
  pdf.text(`Nacin placila: ${offer.paymentTerms || 'po dogovoru'}.`, M, nY, { size: 10, color: INK2 });

  y = Math.max(nY, y - 6 + totalsBoxH) + 30;

  // ===== SIGNATURE =====
  pdf.text('Hvala za zaupanje!', M, y, { size: 11, bold: true, color: INK });
  pdf.text('Veselimo se sodelovanja z vami.', M, y + 14, { size: 9, color: INK3 });

  pdf.textRight(settings.companyName || 'Ime podjetja', PW - M, y, { size: 10, bold: true, color: INK });
  pdf.textRight('Zig in podpis', PW - M, y + 14, { size: 9, color: INK3 });
  pdf.line(PW - M - 130, y + 36, PW - M, y + 36, { color: INK3, width: 0.4 });

  // ===== FOOTER (gold bar) =====
  const fY = 802;
  const fH = 28;
  pdf.rect(0, fY, PW, fH, { fill: GOLD });
  pdf.text('Tel: ' + (settings.phone || '-'), 32, fY + 10, { size: 9, color: '#FFFFFF' });
  const emailText = settings.email || '-';
  pdf.text(emailText, (PW - helvWidth(emailText, 9)) / 2, fY + 10, { size: 9, color: '#FFFFFF' });
  pdf.textRight(settings.website || 'kvota.si', PW - 32, fY + 10, { size: 9, color: '#FFFFFF' });

  return {
    blob: pdf.toBlob(),
    pdf: pdf, // Keep the MiniPDF instance for canvas rendering on demand
    pngDataUrl: () => pdf.toPngDataUrl(2),
  };
}

// --------------------------------------------------------------------------
// Param icon resolver
// --------------------------------------------------------------------------
// Auto-detect a fitting icon for an item based on its label and unit.
// Order matters: more specific keywords come first. Uses substring matches
// (no diacritics required — "drzalo" still matches "držalo").
const paramIconFor = (label, unit) => {
  const l = (label || '')
    .toLowerCase()
    // Strip Slovenian diacritics so "Brušenje" matches "brus"
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // ===== ELECTRICAL =====
  if (l.match(/\bluc|lucke|lucka|svetil|reflekt|lestenec|sijalk|halogen/)) return 'lightbulb';
  if (l.match(/\bvtic|stikal|prikljucek/)) return 'plug';
  if (l.match(/\bkabel|kablov|napelj|vodnik/)) return 'cable';
  if (l.match(/\bomarica|razdeli|elektro/)) return 'power';
  if (l.match(/\bmeritv|meritev|test/)) return 'zap';

  // ===== PLUMBING / HEATING =====
  if (l.match(/\bpipa|armatura|baterija/)) return 'droplet';
  if (l.match(/\btus|prha|kad|wc|skoljka|sanitar|umivaln|bide/)) return 'shower';
  if (l.match(/\bcev|odtok|kanaliz|sifon|priklop sani|vodovod/)) return 'droplet';
  if (l.match(/\bgrelnik|kotel|pec|kamin|peci|bojler|grelo|ogrev/)) return 'flame';
  if (l.match(/\bprezrac|ventilac|klima|odzracev|naprezrac/)) return 'wind';

  // ===== PAINTING / FINISHING =====
  if (l.match(/\bplesk|pleskan|barvanj|barv/)) return 'paintroller';
  if (l.match(/\bvalj|valjcek/)) return 'paintroller';
  if (l.match(/\bcopic|cetk|brush|premaz|lakir|impregn/)) return 'paintbrush';

  // ===== DEMOLITION / EARTHWORK =====
  if (l.match(/\brusen|odstrani|demont|izkop|kopanj|zem(elj|lja)/)) return 'pickaxe';
  if (l.match(/\bvrtanje|vrtin|vrt/)) return 'drill';

  // ===== MASONRY / TILING / CONCRETE =====
  if (l.match(/\bzid|opek|cigl|blok|porobeton|ytong/)) return 'toybrick';
  if (l.match(/\bbeton|estrih|cement|malta|fugiranj|fuge/)) return 'square';
  if (l.match(/\bploscic|tlakovan|tlak\b|granit|keramik|marmor|kamen/)) return 'square';

  // ===== KNAUF / DRYWALL =====
  if (l.match(/\bknauf|mavc|mavcn|plosca|podkonst|izolac/)) return 'layers';
  if (l.match(/\bband(az|aza|azi)|kit|kitan|brus|izrav/)) return 'layers';

  // ===== PARQUET / FLOORING / WOOD =====
  if (l.match(/\bparket|laminat|vinil|pvc/)) return 'square';
  if (l.match(/\bletv|profil|zakljuc|obrob/)) return 'ruler';
  if (l.match(/\bles|deska|trama|tram/)) return 'trees';
  if (l.match(/\blepil|lepl|sponk/)) return 'package';

  // ===== ROOFING / OUTDOOR =====
  if (l.match(/\bstreh|streh|krov|zleb|opasaj/)) return 'home';

  // ===== TOOLS / WORK / LOGISTICS =====
  if (l.match(/\bvij(ak|ake|aki)|sraf|matica/)) return 'hash';
  if (l.match(/\bdelo\b|ura\b|urna|delovna|montaz/)) return 'clock';
  if (l.match(/\bdostav|prevoz|prihod|transport|kilometr/)) return 'truck';
  if (l.match(/\borodj|hammer|kladiv|ploscic.*pripr/)) return 'hammer';
  if (l.match(/\bmaterial|drobni|potros/)) return 'package';

  // ===== UNIT-BASED FALLBACKS =====
  if (unit === 'kg') return 'package';
  if (unit === 'm²' || unit === 'm2') return 'square';
  if (unit === 'tm' || unit === 'm') return 'ruler';
  if (unit === 'h' || unit === 'ura' || unit === 'ure') return 'clock';
  if (unit === 'kos' || unit === 'kom' || unit === 'kpl') return 'box';
  if (unit === 'l' || unit === 'L') return 'droplet';

  return 'more';
};
function ParamIcon({ name, size = 18 }) {
  const M = {
    square: Square, ruler: Ruler, clock: Clock, package: Package, box: Box,
    more: MoreHorizontal, hammer: Hammer, wrench: Wrench, layers: Layers, zap: Zap,
    droplet: Droplet, lightbulb: Lightbulb, paintbrush: Paintbrush, truck: Truck,
    plug: Plug, wind: Wind, flame: Flame, trees: Trees, brush: Brush,
    pickaxe: Pickaxe, shower: ShowerHead, power: Power, cable: Cable,
    toybrick: ToyBrick, drill: Drill, paintroller: PaintRoller, hash: Hash,
    home: Home,
  };
  const C = M[name] || MoreHorizontal;
  return <C size={size} strokeWidth={1.8} />;
}

// --------------------------------------------------------------------------
// Spinner — small animated loader
// --------------------------------------------------------------------------
function Spinner({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// --------------------------------------------------------------------------
// Brand mark
// --------------------------------------------------------------------------
function BrandMark({ size = 28 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <rect x="2" y="4" width="6" height="24" rx="1" fill="#B8895A" />
      <rect x="10" y="10" width="6" height="18" rx="1" fill="#D4A574" />
      <rect x="10" y="4" width="6" height="4" rx="1" fill="#9C7245" />
    </svg>
  );
}
function BrandLogo() {
  return (
    <div className="flex items-center" style={{ gap: 10 }}>
      <BrandMark size={30} />
      <div className="leading-none">
        <div className="font-bold" style={{ fontSize: 24, letterSpacing: '-0.02em', color: '#1A1A1A' }}>
          kvota<span style={{ color: '#B8895A' }}>.si</span>
        </div>
        <div className="font-medium" style={{ fontSize: 9, letterSpacing: '0.18em', color: '#9A9088', marginTop: 4, textTransform: 'uppercase' }}>
          Ponudbe, ki prepričajo.
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// MAIN APP
// --------------------------------------------------------------------------
export default function App() {
  const [tab, setTab] = useState('ponudbe');
  const [flow, setFlow] = useState(null);
  const [activeOfferId, setActiveOfferId] = useState(null);

  const [offers, setOffers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [industries, setIndustries] = useState(DEFAULT_INDUSTRIES);
  const [counter, setCounter] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  useEffect(() => {
    (async () => {
      const [o, c, s, t, ind, n] = await Promise.all([
        loadJSON(KEYS.offers, []),
        loadJSON(KEYS.customers, []),
        loadJSON(KEYS.settings, DEFAULT_SETTINGS),
        loadJSON(KEYS.templates, DEFAULT_TEMPLATES),
        loadJSON(KEYS.industries, DEFAULT_INDUSTRIES),
        loadJSON(KEYS.counter, 1),
      ]);
      setOffers(o);
      setCustomers(c);
      setSettings({ ...DEFAULT_SETTINGS, ...s });
      setTemplates({ ...DEFAULT_TEMPLATES, ...t });
      // Always merge built-ins back in so they can't be permanently removed
      // from a stale storage state (e.g. older app version)
      const mergedIndustries = { ...DEFAULT_INDUSTRIES, ...ind };
      // Re-apply builtin flag based on DEFAULT_INDUSTRIES (user can edit but not delete)
      Object.keys(mergedIndustries).forEach((k) => {
        if (DEFAULT_INDUSTRIES[k]) mergedIndustries[k] = { ...mergedIndustries[k], builtin: true };
      });
      setIndustries(mergedIndustries);
      syncIndustries(mergedIndustries);
      setCounter(n);
      setLoaded(true);
    })();
  }, []);

  // Keep the module-level INDUSTRIES mirror in sync with React state
  useEffect(() => { syncIndustries(industries); }, [industries]);

  useEffect(() => { if (loaded) saveJSON(KEYS.offers, offers); }, [offers, loaded]);
  useEffect(() => { if (loaded) saveJSON(KEYS.customers, customers); }, [customers, loaded]);
  useEffect(() => { if (loaded) saveJSON(KEYS.settings, settings); }, [settings, loaded]);
  useEffect(() => { if (loaded) saveJSON(KEYS.templates, templates); }, [templates, loaded]);
  useEffect(() => { if (loaded) saveJSON(KEYS.industries, industries); }, [industries, loaded]);
  useEffect(() => { if (loaded) saveJSON(KEYS.counter, counter); }, [counter, loaded]);

  const startNewOffer = () => {
    setDraft({
      industry: null,
      client: { name: '', address: '', postal: '', city: '', email: '', phone: '', taxNumber: '' },
      items: [],
      notes: settings.notes || '',
      paymentTerms: settings.paymentTerms || 'po dogovoru',
      deliveryTerms: settings.deliveryTerms || 'po dogovoru',
      issueDate: todayISO(),
      validUntil: addDays(todayISO(), 30),
      number: offerNumber(counter),
    });
    setActiveOfferId(null);
    setFlow('industry');
    setTab('ponudbe');
  };

  const pickIndustry = (id) => {
    const tpl = templates[id] || DEFAULT_TEMPLATES[id] || [];
    const items = tpl.map((p) => ({ ...p, qty: 0, included: true }));
    setDraft((d) => ({ ...d, industry: id, items }));
    setFlow('client');
  };

  const updateClient = (patch) => setDraft((d) => ({ ...d, client: { ...d.client, ...patch } }));
  const updateItem = (id, patch) => setDraft((d) => ({ ...d, items: d.items.map((i) => i.id === id ? { ...i, ...patch } : i) }));

  const saveOffer = () => {
    const id = activeOfferId || `off-${Date.now()}`;
    const totals = calcTotals(draft.items);
    const existing = activeOfferId ? offers.find((o) => o.id === id) : null;
    const offer = {
      id, number: draft.number, industry: draft.industry, client: draft.client,
      items: draft.items, notes: draft.notes,
      paymentTerms: draft.paymentTerms, deliveryTerms: draft.deliveryTerms,
      issueDate: draft.issueDate, validUntil: draft.validUntil,
      ...totals,
      // Preserve status & timestamps on edit; default to 'draft' on create
      status: existing?.status || 'draft',
      sentAt: existing?.sentAt || null,
      paidAt: existing?.paidAt || null,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (activeOfferId) {
      setOffers((arr) => arr.map((o) => o.id === id ? offer : o));
    } else {
      setOffers((arr) => [offer, ...arr]);
      setCounter((n) => n + 1);
      if (draft.client.name) {
        const dup = customers.find((c) => c.name.toLowerCase() === draft.client.name.toLowerCase());
        if (!dup) setCustomers((arr) => [{ ...draft.client, id: `cu-${Date.now()}` }, ...arr]);
      }
    }
    return offer;
  };

  // Cycle through draft → sent → paid → draft. Records timestamp on each transition.
  const setOfferStatus = (id, status) => {
    setOffers((arr) =>
      arr.map((o) => {
        if (o.id !== id) return o;
        const now = new Date().toISOString();
        return {
          ...o,
          status,
          sentAt: status === 'sent' && !o.sentAt ? now : (status === 'draft' ? null : o.sentAt),
          paidAt: status === 'paid' ? (o.paidAt || now) : (status !== 'paid' ? null : o.paidAt),
          updatedAt: now,
        };
      })
    );
  };

  const openOfferAsPreview = (id) => {
    const o = offers.find((x) => x.id === id);
    if (!o) return;
    setDraft({ ...o });
    setActiveOfferId(id);
    setFlow('preview');
    setTab('ponudbe');
  };

  const editOffer = (id) => {
    const o = offers.find((x) => x.id === id);
    if (!o) return;
    setDraft({ ...o });
    setActiveOfferId(id);
    setFlow('parameters');
    setTab('ponudbe');
  };

  const deleteOffer = (id) => setOffers((arr) => arr.filter((o) => o.id !== id));

  const closeFlow = () => { setFlow(null); setDraft(null); setActiveOfferId(null); };

  if (!loaded) {
    return (
      <>
        <GlobalStyles />
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF7F2' }}>
          <BrandMark size={40} />
        </div>
      </>
    );
  }

  const totals = draft ? calcTotals(draft.items) : { subtotal: 0, vat: 0, total: 0 };

  return (
    <>
      <GlobalStyles />
      <div className="app-outer min-h-screen w-full font-app flex justify-center" style={{ background: '#FAF7F2', color: '#1A1A1A' }}>
        <div className={`app-shell w-full relative${flow === 'parameters' ? ' app-shell-split' : ''}`} style={{ maxWidth: 440, background: 'white', minHeight: '100vh', boxShadow: '0 0 60px -20px rgba(0,0,0,0.08)' }}>

          <SideNav tab={tab} setTab={(t) => { setTab(t); if (flow !== null) closeFlow(); }} settings={settings} />

          <div className="app-content-col">

          {flow === null && (
            <header className="app-header-home px-5 flex items-center justify-between sticky top-0 z-30" style={{ paddingTop: 20, paddingBottom: 16, background: 'white', borderBottom: '1px solid #F0E8DA' }}>
              <BrandLogo />
              <div className="rounded-full flex items-center justify-center font-semibold" style={{ width: 40, height: 40, background: '#F5EDE0', color: '#9C7245', fontSize: 13 }}>
                {((settings.companyName || '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()) || 'AM'}
              </div>
            </header>
          )}

          {flow !== null && flow !== 'preview' && (
            <header className="px-5 flex items-center justify-between sticky top-0 z-30" style={{ paddingTop: 20, paddingBottom: 16, background: 'white', borderBottom: '1px solid #F0E8DA' }}>
              <button
                onClick={() => {
                  if (flow === 'industry') closeFlow();
                  else if (flow === 'client') setFlow('industry');
                  else if (flow === 'parameters') {
                    if (activeOfferId) closeFlow();
                    else setFlow('client');
                  }
                }}
                className="rounded-full flex items-center justify-center btn-ghost"
                style={{ width: 40, height: 40 }}
                aria-label="Nazaj"
              >
                <ChevronLeft size={22} />
              </button>
              <div className="flex items-center" style={{ gap: 8 }}>
                <BrandMark size={22} />
                <span className="font-bold" style={{ fontSize: 18 }}>kvota<span style={{ color: '#B8895A' }}>.si</span></span>
              </div>
              <div style={{ width: 40 }} />
            </header>
          )}

          <div className={`app-content-body${flow === 'parameters' ? ' app-split-active' : ''}`}>
            <main className={flow === 'preview' ? '' : 'px-5 app-main-pad app-main-col'} style={{ paddingTop: flow === 'preview' ? 0 : 20, paddingBottom: flow === 'preview' ? 0 : 96 }}>
              {flow === null && tab === 'ponudbe'    && <HomeScreen offers={offers} settings={settings} onNew={startNewOffer} onPreview={openOfferAsPreview} onEdit={editOffer} onDelete={deleteOffer} onSetStatus={setOfferStatus} showToast={showToast} />}
              {flow === null && tab === 'stranke'    && <CustomersScreen customers={customers} setCustomers={setCustomers} />}
              {flow === null && tab === 'cenik'      && <PriceListScreen templates={templates} setTemplates={setTemplates} industries={industries} setIndustries={setIndustries} showToast={showToast} />}
              {flow === null && tab === 'predloge'   && <TemplatesScreen offers={offers} onOpen={openOfferAsPreview} />}
              {flow === null && tab === 'nastavitve' && <SettingsScreen settings={settings} setSettings={setSettings} showToast={showToast} />}

              {flow === 'industry'   && draft && <IndustrySelector onPick={pickIndustry} />}
              {flow === 'client'     && draft && <ClientForm client={draft.client} customers={customers} onChange={updateClient} onPickCustomer={(c) => setDraft((d) => ({ ...d, client: { ...d.client, ...c } }))} onContinue={() => setFlow('parameters')} />}
              {flow === 'parameters' && draft && (
                <ParametersForm
                  draft={draft}
                  setDraft={setDraft}
                  onUpdateItem={updateItem}
                  onAddItem={(item) => setDraft((d) => ({ ...d, items: [...d.items, item] }))}
                  onRemoveItem={(id) => setDraft((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }))}
                  totals={totals}
                  onGenerate={() => { saveOffer(); setFlow('preview'); }}
                />
              )}
              {flow === 'preview' && draft && (
                <PDFPreview
                  draft={draft}
                  settings={settings}
                  totals={totals}
                  onClose={() => { closeFlow(); }}
                  showToast={showToast}
                />
              )}
            </main>

            {flow === 'parameters' && draft && (
              <LivePDFPanel draft={draft} settings={settings} totals={totals} />
            )}
          </div>{/* app-content-body */}

          {flow !== 'preview' && (
            <BottomNav tab={tab} setTab={(t) => { setTab(t); if (flow !== null) closeFlow(); }} />
          )}

          {toast && (
            <div className="fixed left-1/2 px-4 py-2 rounded-full font-medium flex items-center gap-2 z-50 toast-pop" style={{ bottom: 100, transform: 'translateX(-50%)', background: '#1A1A1A', color: 'white', fontSize: 13 }}>
              <Check size={16} /> {toast}
            </div>
          )}

          </div>{/* app-content-col */}
        </div>
      </div>
    </>
  );
}

// --------------------------------------------------------------------------
// HOME / DASHBOARD
// --------------------------------------------------------------------------
// Status definitions — keep in one place so colors/labels stay in sync everywhere
const STATUS_META = {
  draft: { label: 'Osnutek', short: 'OSNUTEK',   color: '#9C7245', bg: '#F5EDE0', sectionTitle: 'Osnutki' },
  sent:  { label: 'Poslano', short: 'POSLANO',   color: '#1F5F8B', bg: '#E3F0FA', sectionTitle: 'Poslane' },
  paid:  { label: 'Plačano', short: 'PLACANO',   color: '#2E7D4F', bg: '#E1F2E7', sectionTitle: 'Plačane' },
};
const STATUS_ORDER = ['draft', 'sent', 'paid'];
const nextStatus = (s) => {
  const i = STATUS_ORDER.indexOf(s || 'draft');
  return STATUS_ORDER[(i + 1) % STATUS_ORDER.length];
};

function HomeScreen({ offers, settings, onNew, onPreview, onEdit, onDelete, onSetStatus, showToast }) {
  const totalValue = offers.reduce((s, o) => s + (o.total || 0), 0);
  const paidValue = offers.filter((o) => (o.status || 'draft') === 'paid').reduce((s, o) => s + (o.total || 0), 0);
  const sentCount = offers.filter((o) => (o.status || 'draft') === 'sent').length;

  // Group by status. Within each group, newest first.
  const grouped = STATUS_ORDER.reduce((acc, key) => {
    acc[key] = offers
      .filter((o) => (o.status || 'draft') === key)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    return acc;
  }, {});

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ marginTop: 4, marginBottom: 22 }}>
        <div className="font-bold" style={{ fontSize: 26, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          Pozdravljeni 👋
        </div>
        <p style={{ color: '#9A9088', fontSize: 13, marginTop: 4 }}>
          Hitra in profesionalna ponudba v manj kot minuti.
        </p>
      </div>

      <button
        onClick={onNew}
        className="w-full rounded-2xl flex items-center justify-between gold-cta"
        style={{ padding: '20px 20px' }}
      >
        <div className="text-left">
          <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.85 }}>Začni</div>
          <div className="font-bold" style={{ fontSize: 22, lineHeight: 1.15, marginTop: 2 }}>Nova ponudba</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>Izberi panogo in v minuti je gotovo</div>
        </div>
        <div className="rounded-full flex items-center justify-center" style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.18)' }}>
          <Plus size={26} />
        </div>
      </button>

      <div className="grid grid-cols-3 gap-2" style={{ marginTop: 14 }}>
        <StatCard label="Ponudb" value={offers.length} icon={<FileText size={13} />} />
        <StatCard
          label="Poslane"
          value={sentCount}
          icon={<Mail size={13} />}
        />
        <StatCard
          label="Plačano"
          value={offers.length === 0 ? '0 €' : new Intl.NumberFormat('sl-SI', { notation: 'compact', maximumFractionDigits: 1 }).format(paidValue) + ' €'}
          icon={<Check size={13} />}
        />
      </div>

      {offers.length === 0 ? (
        <div style={{ marginTop: 24 }}>
          <EmptyState icon={<Sparkles size={20} />} title="Še ni ponudb" hint="Klikni 'Nova ponudba' zgoraj. V manj kot minuti boš imel pravo PDF datoteko." />
        </div>
      ) : (
        <>
          {STATUS_ORDER.map((statusKey) => {
            const list = grouped[statusKey];
            if (list.length === 0) return null;
            const meta = STATUS_META[statusKey];
            const groupTotal = list.reduce((s, o) => s + (o.total || 0), 0);
            return (
              <section key={statusKey} style={{ marginTop: 26 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <span
                      className="rounded-full"
                      style={{
                        background: meta.bg,
                        color: meta.color,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        padding: '4px 10px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {meta.label}
                    </span>
                    <span className="font-semibold" style={{ fontSize: 13, color: '#5C544A' }}>
                      {list.length}
                    </span>
                  </div>
                  <span className="tabular-nums" style={{ fontSize: 12, color: '#9A9088' }}>
                    {fmtEUR(groupTotal)}
                  </span>
                </div>
                <div className="space-y-2">
                  {list.map((o) => (
                    <OfferRow
                      key={o.id}
                      offer={o}
                      settings={settings}
                      onPreview={() => onPreview(o.id)}
                      onEdit={() => onEdit(o.id)}
                      onDelete={() => onDelete(o.id)}
                      onCycleStatus={() => {
                        const ns = nextStatus(o.status || 'draft');
                        onSetStatus(o.id, ns);
                        showToast?.(`Status: ${STATUS_META[ns].label}`);
                      }}
                      onSetStatus={(s) => {
                        onSetStatus(o.id, s);
                        showToast?.(`Status: ${STATUS_META[s].label}`);
                      }}
                      showToast={showToast}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-xl" style={{ background: 'white', border: '1px solid #F0E8DA', padding: 12 }}>
      <div className="flex items-center gap-1.5 font-semibold" style={{ color: '#9A9088', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {icon} {label}
      </div>
      <div className="font-bold tabular-nums" style={{ fontSize: 17, marginTop: 6, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function OfferRow({ offer, settings, onPreview, onEdit, onDelete, onCycleStatus, onSetStatus, showToast }) {
  const ind = INDUSTRIES[offer.industry];
  const status = offer.status || 'draft';
  const meta = STATUS_META[status];
  const [pickerOpen, setPickerOpen] = useState(false);

  // Subtle visual de-emphasis for completed (paid) offers — they're done, no longer the focus
  const isComplete = status === 'paid';
  const cardStyle = {
    background: 'white',
    border: '1px solid #F0E8DA',
    padding: 12,
    gap: 8,
    opacity: isComplete ? 0.78 : 1,
    transition: 'opacity 0.2s ease, border-color 0.15s ease',
  };

  // Format the relevant timestamp for the row's metadata line
  const dateLine = (() => {
    if (status === 'paid' && offer.paidAt)  return `Plačano ${fmtDate(offer.paidAt)}`;
    if (status === 'sent' && offer.sentAt)  return `Poslano ${fmtDate(offer.sentAt)}`;
    return fmtDate(offer.createdAt);
  })();

  return (
    <div className="rounded-2xl row-card" style={cardStyle}>
      <div className="flex items-center" style={{ gap: 8 }}>
        <button
          onClick={onPreview}
          className="flex-1 flex items-center text-left min-w-0"
          style={{ gap: 12, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <div className="rounded-xl flex items-center justify-center flex-shrink-0" style={{ width: 42, height: 42, background: (ind?.accent || '#B8895A') + '18', color: ind?.accent || '#B8895A' }}>
            <ParamIcon name={ind?.icon || 'hammer'} size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold truncate" style={{ fontSize: 14, textDecoration: isComplete ? 'line-through' : 'none', textDecorationColor: '#C5BCAE', textDecorationThickness: '1px' }}>
              {offer.client?.name || 'Brez stranke'}
            </div>
            <div className="flex items-center gap-1.5" style={{ fontSize: 11, color: '#9A9088', marginTop: 2 }}>
              <span className="tabular-nums">{offer.number}</span>
              <span className="rounded-full" style={{ width: 3, height: 3, background: '#D5CDBE' }} />
              <span className="truncate">{dateLine}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-bold tabular-nums" style={{ fontSize: 14 }}>{fmtEUR(offer.total)}</div>
            <div style={{ fontSize: 10, color: '#9A9088', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ind?.short}</div>
          </div>
        </button>
        <div className="flex flex-col items-center" style={{ gap: 4 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onPreview(); }}
            aria-label="Predogled in prenos PDF"
            title="Predogled in prenos PDF"
            className="rounded-lg flex items-center justify-center"
            style={{ width: 32, height: 32, color: 'white', background: 'linear-gradient(135deg, #B8895A, #9C7245)', border: 'none', cursor: 'pointer' }}
          >
            <Download size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); if (confirm('Izbrišem ponudbo?')) onDelete(); }}
            aria-label="Izbriši"
            className="rounded-lg flex items-center justify-center btn-ghost"
            style={{ width: 32, height: 32, color: '#9A9088', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Status row — tap pill to cycle, tap "..." for direct picker */}
      <div className="flex items-center justify-between" style={{ marginTop: 10, gap: 8 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onCycleStatus?.(); }}
          className="rounded-full flex items-center"
          style={{
            background: meta.bg,
            color: meta.color,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.04em',
            padding: '5px 10px 5px 8px',
            border: 'none',
            cursor: 'pointer',
            gap: 6,
            transition: 'transform 0.1s ease',
          }}
          title="Klikni za naslednji status"
          aria-label={`Status: ${meta.label}. Klikni za spremembo.`}
        >
          <span
            className="rounded-full flex items-center justify-center"
            style={{ width: 16, height: 16, background: meta.color, color: 'white', flexShrink: 0 }}
          >
            {status === 'paid' ? <Check size={11} strokeWidth={3} /> : status === 'sent' ? <Mail size={9} strokeWidth={2.5} /> : <FileText size={9} strokeWidth={2.5} />}
          </span>
          {meta.label}
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setPickerOpen((v) => !v); }}
            className="rounded-lg flex items-center justify-center btn-ghost"
            style={{ width: 28, height: 28, color: '#9A9088', background: 'transparent', border: 'none', cursor: 'pointer' }}
            aria-label="Spremeni status"
            title="Spremeni status"
          >
            <MoreHorizontal size={16} />
          </button>
          {pickerOpen && (
            <>
              {/* Click-away catcher */}
              <div
                onClick={(e) => { e.stopPropagation(); setPickerOpen(false); }}
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
              />
              <div
                onClick={(e) => e.stopPropagation()}
                className="rounded-xl"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 32,
                  background: 'white',
                  border: '1px solid #F0E8DA',
                  boxShadow: '0 10px 30px -8px rgba(0,0,0,0.15)',
                  padding: 6,
                  zIndex: 41,
                  minWidth: 160,
                }}
              >
                <div style={{ fontSize: 10, color: '#9A9088', padding: '4px 10px 6px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                  Status
                </div>
                {STATUS_ORDER.map((s) => {
                  const m = STATUS_META[s];
                  const isCurrent = s === status;
                  return (
                    <button
                      key={s}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isCurrent) onSetStatus?.(s);
                        setPickerOpen(false);
                      }}
                      className="w-full rounded-lg flex items-center text-left btn-ghost"
                      style={{
                        gap: 10,
                        padding: '8px 10px',
                        background: isCurrent ? m.bg : 'transparent',
                        color: isCurrent ? m.color : '#1A1A1A',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: isCurrent ? 600 : 500,
                      }}
                    >
                      <span
                        className="rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ width: 18, height: 18, background: m.color, color: 'white' }}
                      >
                        {s === 'paid' ? <Check size={11} strokeWidth={3} /> : s === 'sent' ? <Mail size={10} strokeWidth={2.5} /> : <FileText size={10} strokeWidth={2.5} />}
                      </span>
                      <span style={{ flex: 1 }}>{m.label}</span>
                      {isCurrent && <Check size={14} style={{ color: m.color }} />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Step 1: Industry selector
// --------------------------------------------------------------------------
function IndustrySelector({ onPick }) {
  return (
    <div style={{ paddingBottom: 24 }}>
      <StepLabel>Korak 1 / 3</StepLabel>
      <Title>Izberi panogo</Title>
      <Subtitle>Vrsta dela določi privzete postavke v ponudbi.</Subtitle>

      <div className="space-y-3" style={{ marginTop: 8 }}>
        {Object.values(INDUSTRIES).map((ind) => (
          <button
            key={ind.id}
            onClick={() => onPick(ind.id)}
            className="w-full rounded-2xl flex items-center text-left btn-card"
            style={{ background: 'white', border: '1px solid #F0E8DA', padding: 14, gap: 12 }}
          >
            <div className="rounded-2xl flex items-center justify-center flex-shrink-0" style={{ width: 56, height: 56, background: ind.accent + '18', color: ind.accent }}>
              <ParamIcon name={ind.icon} size={26} />
            </div>
            <div className="flex-1">
              <div className="font-semibold" style={{ fontSize: 15 }}>{ind.name}</div>
              <div style={{ fontSize: 12, color: '#9A9088', marginTop: 2 }}>{ind.desc}</div>
            </div>
            <ChevronRight size={20} style={{ color: '#9A9088' }} />
          </button>
        ))}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Step 2: Client form
// --------------------------------------------------------------------------
function ClientForm({ client, customers, onChange, onPickCustomer, onContinue }) {
  const [showCust, setShowCust] = useState(false);
  const canContinue = (client.name || '').trim().length > 0;
  return (
    <div style={{ paddingBottom: 28 }}>
      <StepLabel>Korak 2 / 3</StepLabel>
      <Title>Podatki o stranki</Title>
      <Subtitle>Vnesi vsaj ime ali podjetje. Ostalo je zaželeno.</Subtitle>

      {customers.length > 0 && (
        <div style={{ marginTop: 16, marginBottom: 12 }}>
          <button
            onClick={() => setShowCust((v) => !v)}
            className="w-full rounded-xl flex items-center justify-between font-medium"
            style={{ background: '#F8F1E4', border: '1px solid #EDE2CD', color: '#9C7245', fontSize: 13, padding: '12px 16px', cursor: 'pointer' }}
          >
            <span className="flex items-center gap-2">
              <Users size={15} /> Izberi obstoječo stranko
            </span>
            <ChevronDown size={16} style={{ transform: showCust ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {showCust && (
            <div className="rounded-xl overflow-auto" style={{ background: 'white', border: '1px solid #F0E8DA', maxHeight: 220, marginTop: 8 }}>
              {customers.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => { onPickCustomer(c); setShowCust(false); }}
                  className="w-full text-left btn-list"
                  style={{ padding: '12px 16px', borderTop: i === 0 ? 'none' : '1px solid #F0E8DA', background: 'transparent', border: 'none', borderTopColor: i === 0 ? 'transparent' : '#F0E8DA', borderTopStyle: 'solid', borderTopWidth: i === 0 ? 0 : 1, cursor: 'pointer' }}
                >
                  <div className="font-medium" style={{ fontSize: 14 }}>{c.name}</div>
                  {c.address && <div style={{ fontSize: 12, color: '#9A9088' }}>{c.address}</div>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3" style={{ marginTop: customers.length > 0 ? 0 : 16 }}>
        <Field label="Ime stranke ali podjetja *" icon={<Building2 size={16} />} value={client.name} onChange={(v) => onChange({ name: v })} placeholder="npr. Janez Kovač" />
        <Field label="Naslov" icon={<MapPin size={16} />} value={client.address} onChange={(v) => onChange({ address: v })} placeholder="Cesta v Celje 12" />
        <div className="grid grid-cols-3 gap-2">
          <Field label="Pošta" value={client.postal} onChange={(v) => onChange({ postal: v })} placeholder="3000" />
          <div className="col-span-2"><Field label="Mesto" value={client.city} onChange={(v) => onChange({ city: v })} placeholder="Celje" /></div>
        </div>
        <Field label="Email" icon={<Mail size={16} />} type="email" value={client.email} onChange={(v) => onChange({ email: v })} placeholder="janez@example.si" />
        <Field label="Telefon" icon={<Phone size={16} />} type="tel" value={client.phone} onChange={(v) => onChange({ phone: v })} placeholder="041 123 456" />
        <Field label="Davčna številka (opcijsko)" icon={<Hash size={16} />} value={client.taxNumber} onChange={(v) => onChange({ taxNumber: v })} placeholder="SI12345678" />
      </div>

      <button
        onClick={onContinue}
        disabled={!canContinue}
        className={`w-full rounded-2xl flex items-center justify-center gap-2 font-semibold ${canContinue ? 'gold-cta' : 'btn-disabled'}`}
        style={{ marginTop: 24, padding: '16px 20px', fontSize: 15 }}
      >
        Naprej na postavke <ChevronRight size={18} />
      </button>
    </div>
  );
}

function Field({ label, icon, value, onChange, placeholder, type = 'text', step, inputMode }) {
  return (
    <label className="block">
      <div className="font-medium" style={{ fontSize: 12, color: '#5C544A', marginBottom: 6, marginLeft: 4 }}>{label}</div>
      <div className="relative">
        {icon && <span className="absolute" style={{ left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9A9088' }}>{icon}</span>}
        <input
          type={type}
          step={step}
          inputMode={inputMode}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl input-field"
          style={{ paddingLeft: icon ? 40 : 16, paddingRight: 16, paddingTop: 14, paddingBottom: 14, background: 'white', border: '1px solid #EDE2CD', fontSize: 15 }}
        />
      </div>
    </label>
  );
}

// --------------------------------------------------------------------------
// Step 3: Parameters with live calculation + Generate PDF
// --------------------------------------------------------------------------
function ParametersForm({ draft, setDraft, onUpdateItem, onAddItem, onRemoveItem, totals, onGenerate }) {
  const ind = INDUSTRIES[draft.industry];
  const [expandedId, setExpandedId] = useState(null);
  const [showOptions, setShowOptions] = useState(false);

  const addCustom = () => {
    const item = { id: `custom-${Date.now()}`, label: 'Nova postavka', desc: '', unit: 'kos', qty: 1, price: 0, included: true };
    onAddItem(item);
    setExpandedId(item.id);
  };

  return (
    <div style={{ paddingBottom: 28 }}>
      <StepLabel>Korak 3 / 3</StepLabel>
      <Title>Nova ponudba</Title>
      <p style={{ fontSize: 14, color: '#9A9088', marginTop: 2 }}>{ind?.name}</p>

      <SectionHeader icon={<Layers size={14} />} label="Osnovni parametri" />

      <div className="space-y-2">
        {draft.items.map((item) => (
          <ParameterRow
            key={item.id}
            item={item}
            expanded={expandedId === item.id}
            onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
            onChange={(patch) => onUpdateItem(item.id, patch)}
            onRemove={() => { onRemoveItem(item.id); setExpandedId(null); }}
          />
        ))}
      </div>

      <button
        onClick={addCustom}
        className="w-full rounded-2xl flex items-center justify-center gap-2 font-medium btn-dashed"
        style={{ marginTop: 12, padding: '12px 16px', fontSize: 13 }}
      >
        <Plus size={16} /> Dodaj svojo postavko
      </button>

      <SectionHeader icon={<Euro size={14} />} label="Skupaj" />
      <TotalsBox totals={totals} />

      <button
        onClick={() => setShowOptions((v) => !v)}
        className="w-full rounded-xl flex items-center justify-between font-medium"
        style={{ marginTop: 16, padding: '12px 16px', background: '#F8F1E4', border: '1px solid #EDE2CD', color: '#9C7245', fontSize: 13, cursor: 'pointer' }}
      >
        <span className="flex items-center gap-2"><FileSignature size={15} /> Datumi in opombe</span>
        <ChevronDown size={16} style={{ transform: showOptions ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {showOptions && (
        <div className="space-y-3" style={{ marginTop: 12 }}>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Datum izdaje" type="date" value={draft.issueDate} onChange={(v) => setDraft((d) => ({ ...d, issueDate: v }))} />
            <Field label="Velja do" type="date" value={draft.validUntil} onChange={(v) => setDraft((d) => ({ ...d, validUntil: v }))} />
          </div>
          <Field label="Plačilni rok" icon={<CreditCard size={16} />} value={draft.paymentTerms} onChange={(v) => setDraft((d) => ({ ...d, paymentTerms: v }))} />
          <label className="block">
            <div className="font-medium" style={{ fontSize: 12, color: '#5C544A', marginBottom: 6, marginLeft: 4 }}>Opombe</div>
            <textarea
              value={draft.notes}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              rows={3}
              className="w-full rounded-xl input-field"
              style={{ padding: '12px 16px', background: 'white', border: '1px solid #EDE2CD', fontSize: 14, resize: 'none' }}
              placeholder="Posebnosti, garancija, pogoji…"
            />
          </label>
        </div>
      )}

      {/* Primary CTA — inline, always visible at the bottom of content */}
      <button
        onClick={onGenerate}
        className="w-full rounded-2xl flex items-center justify-center gap-2 font-semibold gold-cta"
        style={{ marginTop: 24, padding: '18px 20px', fontSize: 16 }}
      >
        <FileText size={18} /> Generiraj PDF ponudbo
      </button>
      <p className="text-center" style={{ marginTop: 10, fontSize: 11, color: '#9A9088' }}>
        Po kliku boš videl predogled in lahko PDF preneseš na napravo.
      </p>
    </div>
  );
}

function StepLabel({ children }) {
  return <div className="font-semibold" style={{ fontSize: 11, letterSpacing: '0.18em', color: '#9A9088', textTransform: 'uppercase', marginTop: 2, marginBottom: 4 }}>{children}</div>;
}
function Title({ children }) {
  return <h1 className="font-bold" style={{ fontSize: 26, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{children}</h1>;
}
function Subtitle({ children }) {
  return <p style={{ color: '#9A9088', fontSize: 14, marginTop: 4, marginBottom: 8 }}>{children}</p>;
}
function SectionHeader({ icon, label }) {
  return (
    <div className="flex items-center" style={{ marginTop: 24, marginBottom: 12, gap: 10 }}>
      <div className="rounded-full flex items-center justify-center" style={{ width: 32, height: 32, background: '#F5EDE0', color: '#B8895A' }}>{icon}</div>
      <h2 className="font-semibold" style={{ fontSize: 16 }}>{label}</h2>
    </div>
  );
}

function ParameterRow({ item, expanded, onToggle, onChange, onRemove }) {
  const total = lineTotal(item);
  const iconName = paramIconFor(item.label, item.unit);
  const isCustom = item.id.startsWith('custom-');
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'white',
        border: expanded ? '1px solid #B8895A' : '1px solid #F0E8DA',
        boxShadow: expanded ? '0 8px 24px -12px rgba(184,137,90,0.35)' : 'none',
        opacity: item.included === false ? 0.5 : 1,
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <button onClick={onToggle} className="w-full flex items-center text-left" style={{ padding: 14, gap: 12, background: 'transparent', border: 'none', cursor: 'pointer' }}>
        <div className="rounded-xl flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 44, background: '#F5EDE0', color: '#B8895A' }}>
          <ParamIcon name={iconName} size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate" style={{ fontSize: 14 }}>{item.label}</div>
          <div style={{ fontSize: 11, color: '#9A9088', marginTop: 2 }}>{item.unit} · {fmtEUR(item.price)}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-bold tabular-nums" style={{ fontSize: 15 }}>{Number(item.qty) || 0}</div>
          {total > 0 && <div className="tabular-nums" style={{ fontSize: 10, color: '#9A9088' }}>{fmtEUR(total)}</div>}
        </div>
        <ChevronDown size={18} style={{ color: '#9A9088', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>

      {expanded && (
        <div className="space-y-3" style={{ padding: '4px 14px 14px', borderTop: '1px solid #F0E8DA', background: '#FCFAF5' }}>
          {isCustom && <Field label="Naziv postavke" value={item.label} onChange={(v) => onChange({ label: v })} />}
          <div className="grid grid-cols-2 gap-2">
            <Field label="Količina" type="number" inputMode="decimal" step="0.01" value={item.qty} onChange={(v) => onChange({ qty: v === '' ? 0 : Number(v) })} />
            <Field label="Cena / enoto (€)" type="number" inputMode="decimal" step="0.01" value={item.price} onChange={(v) => onChange({ price: v === '' ? 0 : Number(v) })} />
          </div>
          {isCustom && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Enota" value={item.unit} onChange={(v) => onChange({ unit: v })} />
              <button
                onClick={onRemove}
                className="rounded-xl flex items-center justify-center gap-1.5 font-medium"
                style={{ alignSelf: 'flex-end', padding: '14px 12px', border: '1px solid #fecaca', color: '#ef4444', fontSize: 13, background: 'white', cursor: 'pointer' }}
              >
                <Trash2 size={14} /> Odstrani
              </button>
            </div>
          )}
          <div className="flex items-center justify-between" style={{ paddingTop: 4 }}>
            <label className="flex items-center gap-2 cursor-pointer select-none" style={{ fontSize: 13 }}>
              <input
                type="checkbox"
                checked={item.included !== false}
                onChange={(e) => onChange({ included: e.target.checked })}
                style={{ accentColor: '#B8895A', width: 16, height: 16 }}
              />
              Vključi v ponudbo
            </label>
            <div className="font-bold tabular-nums" style={{ fontSize: 15, color: '#B8895A' }}>{fmtEUR(total)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function TotalsBox({ totals }) {
  return (
    <div className="rounded-2xl" style={{ background: 'linear-gradient(135deg, #F8F1E4, #F2E5CC)', border: '1px solid #EDE2CD', padding: 20 }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold" style={{ fontSize: 11, letterSpacing: '0.06em', color: '#9C7245', textTransform: 'uppercase' }}>Skupaj brez DDV</div>
          <div className="font-bold tabular-nums" style={{ fontSize: 28, letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1 }}>{fmtEUR(totals.subtotal)}</div>
        </div>
        <div className="text-right">
          <div className="font-semibold" style={{ fontSize: 10, letterSpacing: '0.06em', color: '#9A8B6E', textTransform: 'uppercase' }}>DDV (22%)</div>
          <div className="font-semibold tabular-nums" style={{ fontSize: 14, color: '#5C544A', marginTop: 4 }}>{fmtEUR(totals.vat)}</div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid #E0D2B5', margin: '14px 0' }} />
      <div className="flex items-end justify-between">
        <div className="font-semibold" style={{ fontSize: 12, letterSpacing: '0.06em', color: '#9C7245', textTransform: 'uppercase' }}>Skupaj z DDV</div>
        <div className="font-bold tabular-nums" style={{ fontSize: 26, letterSpacing: '-0.02em', lineHeight: 1, color: '#9C7245' }}>{fmtEUR(totals.total)}</div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// PDF preview + actual download
// --------------------------------------------------------------------------
function PDFPreview({ draft, settings, totals, onClose, showToast }) {
  const ind = INDUSTRIES[draft.industry];
  const items = draft.items.filter((i) => i.included !== false && Number(i.qty) > 0);
  const filename = safeFilename(draft.number, draft.client?.name);

  const [pdfBlob, setPdfBlob] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  // Generate the PDF on mount
  useEffect(() => {
    try {
      const result = renderOfferPDF(
        {
          number: draft.number, industry: draft.industry, client: draft.client,
          items: draft.items, notes: draft.notes,
          paymentTerms: draft.paymentTerms, deliveryTerms: draft.deliveryTerms,
          issueDate: draft.issueDate, validUntil: draft.validUntil,
        },
        settings
      );
      setPdfBlob(result.blob);
    } catch (e) {
      console.error('PDF generation error:', e);
      setErr(e?.message || 'Napaka pri generiranju ponudbe');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On real domain (not in iframe sandbox), Web Share API works on mobile
  // and <a download> works on desktop. Single clean handler.
  const handleSave = async () => {
    if (!pdfBlob) return;
    setBusy(true);
    try {
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });

      // Mobile: try Web Share API first (native share sheet on iOS/Android)
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        typeof navigator.share === 'function' &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({ files: [file], title: `Ponudba ${draft.number}` });
          showToast?.('PDF deljen ✓');
          return;
        } catch (e) {
          if (e?.name === 'AbortError') return;
          // fall through to direct download
        }
      }

      // Desktop / no share API: programmatic anchor download
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      showToast?.('PDF prenesen ✓');
    } catch (e) {
      console.error('Save failed:', e);
      showToast?.('Napaka pri shranjevanju');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ background: '#F4EFE6', minHeight: '100vh' }}>
      <div className="px-4 flex items-center justify-between sticky top-0 z-30" style={{ background: 'white', borderBottom: '1px solid #F0E8DA', paddingTop: 12, paddingBottom: 12 }}>
        <button
          onClick={onClose}
          className="rounded-full flex items-center justify-center btn-ghost"
          style={{ width: 40, height: 40, background: 'transparent', border: 'none', cursor: 'pointer' }}
          aria-label="Zapri"
        >
          <X size={20} />
        </button>
        <div className="font-semibold" style={{ fontSize: 14 }}>Ponudba</div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: '12px 12px 0' }}>
        {err ? (
          <div className="rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13, padding: 14 }}>
            <strong>Napaka:</strong> {err}
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={!pdfBlob || busy}
            className="w-full rounded-2xl flex items-center justify-center gap-2 font-bold gold-cta"
            style={{ padding: '18px 20px', fontSize: 16, opacity: !pdfBlob || busy ? 0.7 : 1, cursor: !pdfBlob ? 'wait' : 'pointer', border: 'none' }}
          >
            {!pdfBlob || busy ? <Spinner size={18} /> : <Download size={20} />}
            {!pdfBlob ? 'Pripravljam PDF...' : busy ? 'Shranjujem...' : 'Shrani PDF'}
          </button>
        )}
        <p className="text-center" style={{ fontSize: 11, color: '#9A9088', marginTop: 8 }}>
          {filename}
        </p>
      </div>

      <div style={{ padding: 12, overflowX: 'auto' }}>
        <div
          className="pdf-page"
          style={{
            background: 'white',
            width: 820,
            minWidth: 820,
            margin: '0 auto',
            boxShadow: '0 20px 60px -30px rgba(0,0,0,0.25)',
            borderRadius: 4,
          }}
        >
          <PdfBody draft={draft} settings={settings} totals={totals} ind={ind} items={items} />
        </div>
      </div>

      <p className="text-center" style={{ fontSize: 11, color: '#9A9088', padding: '0 16px 24px' }}>
        Ponudba {draft.number} · {fmtDate(draft.issueDate)}
      </p>
    </div>
  );
}

// PDF page body — used inside React preview
function PdfBody({ draft, settings, totals, ind, items }) {
  return (
    <>
      <div style={{ padding: '36px 40px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          {settings.logo ? (
            <img src={settings.logo} alt="" style={{ maxHeight: 56, maxWidth: 200, objectFit: 'contain' }} />
          ) : (
            <div className="flex items-center" style={{ gap: 8 }}>
              <BrandMark size={36} />
              <div>
                <div className="font-bold" style={{ fontSize: 24, letterSpacing: '-0.02em' }}>kvota<span style={{ color: '#B8895A' }}>.si</span></div>
                <div style={{ fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#9A9088', fontWeight: 500 }}>Ponudbe, ki prepričajo.</div>
              </div>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="font-bold" style={{ fontSize: 28, letterSpacing: '0.04em', color: '#B8895A' }}>PONUDBA</div>
          <div style={{ marginTop: 12, fontSize: 11, lineHeight: 1.7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 32 }}><span style={{ color: '#5C544A' }}>Številka ponudbe:</span><span className="font-semibold tabular-nums">{draft.number}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 32 }}><span style={{ color: '#5C544A' }}>Datum:</span><span className="font-semibold tabular-nums">{fmtDate(draft.issueDate)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 32 }}><span style={{ color: '#5C544A' }}>Veljavnost ponudbe:</span><span className="font-semibold tabular-nums">{fmtDate(draft.validUntil)}</span></div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #E8DFCB', margin: '0 40px' }} />

      <div style={{ padding: '24px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div>
          <div className="font-bold" style={{ fontSize: 10, letterSpacing: '0.2em', color: '#B8895A', textTransform: 'uppercase', marginBottom: 8 }}>Ponudnik</div>
          <div className="font-bold" style={{ fontSize: 13, marginBottom: 4 }}>{settings.companyName || 'Ime podjetja d.o.o.'}</div>
          <div style={{ fontSize: 11, color: '#3D3A35', lineHeight: 1.7 }}>
            {settings.address && <div>{settings.address}</div>}
            {(settings.postalCode || settings.city) && <div>{[settings.postalCode, settings.city].filter(Boolean).join(' ')}</div>}
            {settings.taxNumber && <div>Davčna št.: {settings.taxNumber}</div>}
            {settings.registrationNumber && <div>Matična št.: {settings.registrationNumber}</div>}
            {settings.iban && <div>IBAN: {settings.iban}</div>}
            {settings.phone && <div>Telefon: {settings.phone}</div>}
            {settings.email && <div>E-mail: {settings.email}</div>}
          </div>
        </div>
        <div>
          <div className="font-bold" style={{ fontSize: 10, letterSpacing: '0.2em', color: '#B8895A', textTransform: 'uppercase', marginBottom: 8 }}>Stranka</div>
          <div className="font-bold" style={{ fontSize: 13, marginBottom: 4 }}>{draft.client.name || '—'}</div>
          <div style={{ fontSize: 11, color: '#3D3A35', lineHeight: 1.7 }}>
            {draft.client.address && <div>{draft.client.address}</div>}
            {(draft.client.postal || draft.client.city) && <div>{[draft.client.postal, draft.client.city].filter(Boolean).join(' ')}</div>}
            {draft.client.taxNumber && <div>Davčna št.: {draft.client.taxNumber}</div>}
            {draft.client.email && <div>E-mail: {draft.client.email}</div>}
            {draft.client.phone && <div>Telefon: {draft.client.phone}</div>}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #E8DFCB', margin: '0 40px' }} />

      <div style={{ padding: '20px 40px 8px' }}>
        <div className="font-bold" style={{ fontSize: 11, letterSpacing: '0.2em', color: '#B8895A', textTransform: 'uppercase' }}>
          Predmet ponudbe: <span style={{ color: '#1A1A1A' }}>{(ind?.name || '').toUpperCase()}</span>
        </div>
      </div>

      <div style={{ padding: '12px 40px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 64px 56px 90px 96px', fontSize: 9, letterSpacing: '0.12em', color: '#9C7245', fontWeight: 700, background: '#F8F1E4', borderRadius: '6px 6px 0 0', padding: '10px 12px', textTransform: 'uppercase' }}>
          <div>#</div>
          <div>Opis</div>
          <div style={{ textAlign: 'right' }}>Količina</div>
          <div style={{ textAlign: 'right' }}>Enota</div>
          <div style={{ textAlign: 'right' }}>Cena</div>
          <div style={{ textAlign: 'right' }}>Znesek</div>
        </div>
        <div style={{ borderLeft: '1px solid #F0E8DA', borderRight: '1px solid #F0E8DA', borderBottom: '1px solid #F0E8DA', borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
          {items.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: 12, color: '#9A9088' }}>Ni postavk z vneseno količino.</div>
          ) : items.map((it, idx) => (
            <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 64px 56px 90px 96px', alignItems: 'center', padding: '13px 12px', fontSize: 11, borderTop: idx === 0 ? 'none' : '1px solid #F0E8DA' }}>
              <div className="tabular-nums" style={{ color: '#9A9088' }}>{idx + 1}</div>
              <div className="flex items-center" style={{ gap: 10, minWidth: 0 }}>
                <div className="rounded-md flex items-center justify-center flex-shrink-0" style={{ width: 26, height: 26, background: '#F5EDE0', color: '#B8895A' }}>
                  <ParamIcon name={paramIconFor(it.label, it.unit)} size={13} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="font-semibold truncate" style={{ fontSize: 12 }}>{it.label}</div>
                  {it.desc && <div className="truncate" style={{ fontSize: 10, color: '#9A9088' }}>{it.desc}</div>}
                </div>
              </div>
              <div className="tabular-nums" style={{ textAlign: 'right' }}>{Number(it.qty)}</div>
              <div style={{ textAlign: 'right', color: '#5C544A' }}>{it.unit}</div>
              <div className="tabular-nums" style={{ textAlign: 'right' }}>{fmtEUR(it.price)}</div>
              <div className="font-semibold tabular-nums" style={{ textAlign: 'right' }}>{fmtEUR(lineTotal(it))}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 40px 8px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        <div>
          <div className="flex items-start" style={{ gap: 12 }}>
            <div className="rounded-full flex items-center justify-center flex-shrink-0" style={{ width: 32, height: 32, background: '#F5EDE0', color: '#B8895A', marginTop: 2 }}>
              <ClipboardList size={14} />
            </div>
            <div>
              <div className="font-bold" style={{ fontSize: 10, letterSpacing: '0.2em', color: '#B8895A', textTransform: 'uppercase', marginBottom: 6 }}>Opombe</div>
              <div style={{ fontSize: 11, color: '#3D3A35', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{draft.notes || '—'}</div>
              <div style={{ fontSize: 11, color: '#3D3A35', marginTop: 12 }}>
                <div>Rok izvedbe: {draft.deliveryTerms || 'po dogovoru'}.</div>
                <div>Način plačila: {draft.paymentTerms || 'po dogovoru'}.</div>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-md" style={{ background: '#F8F1E4', padding: 16 }}>
          <div className="flex justify-between items-center" style={{ fontSize: 11, padding: '6px 0' }}><span>Skupaj brez DDV</span><span className="font-bold tabular-nums">{fmtEUR(totals.subtotal)}</span></div>
          <div className="flex justify-between items-center" style={{ fontSize: 11, padding: '6px 0' }}><span>DDV (22%)</span><span className="font-semibold tabular-nums">{fmtEUR(totals.vat)}</span></div>
          <div style={{ borderTop: '1px solid #E0D2B5', margin: '8px 0' }} />
          <div className="flex justify-between items-end" style={{ paddingTop: 6 }}>
            <span className="font-bold" style={{ fontSize: 11, letterSpacing: '0.12em', color: '#9C7245', textTransform: 'uppercase' }}>Skupaj z DDV</span>
            <span className="font-bold tabular-nums" style={{ fontSize: 20, color: '#9C7245', lineHeight: 1 }}>{fmtEUR(totals.total)}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '32px 40px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'flex-end' }}>
        <div className="flex items-center" style={{ gap: 12 }}>
          <div className="rounded-full flex items-center justify-center" style={{ width: 36, height: 36, background: '#F5EDE0', color: '#B8895A' }}>
            <Heart size={15} />
          </div>
          <div>
            <div className="font-semibold" style={{ fontSize: 12 }}>Hvala za zaupanje!</div>
            <div style={{ fontSize: 10, color: '#9A9088' }}>Veselimo se sodelovanja z vami.</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="font-semibold" style={{ fontSize: 11 }}>{settings.companyName || 'Ime podjetja'}</div>
          <div style={{ fontSize: 10, color: '#9A9088', marginBottom: 12 }}>Žig in podpis</div>
          <div className="font-signature" style={{ fontSize: 22, color: '#1A1A1A', marginRight: 8 }}>
            {(settings.companyName || 'kvota').split(' ')[0]}
          </div>
        </div>
      </div>

      <div style={{ background: '#B8895A', color: 'white', padding: '14px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 10, marginTop: 8 }}>
        <div className="flex items-center" style={{ gap: 8 }}><Phone size={12} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{settings.phone || '—'}</span></div>
        <div className="flex items-center justify-center" style={{ gap: 8 }}><Mail size={12} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{settings.email || '—'}</span></div>
        <div className="flex items-center justify-end" style={{ gap: 8 }}><Globe size={12} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{settings.website || 'kvota.si'}</span></div>
      </div>
    </>
  );
}

// --------------------------------------------------------------------------
// Customers
// --------------------------------------------------------------------------
function CustomersScreen({ customers, setCustomers }) {
  const [editing, setEditing] = useState(null);
  const save = (c) => {
    if (c.id) setCustomers((arr) => arr.map((x) => x.id === c.id ? c : x));
    else setCustomers((arr) => [{ ...c, id: `cu-${Date.now()}` }, ...arr]);
    setEditing(null);
  };
  const remove = (id) => setCustomers((arr) => arr.filter((x) => x.id !== id));

  if (editing) {
    return (
      <div style={{ paddingBottom: 28 }}>
        <button onClick={() => setEditing(null)} className="flex items-center gap-1" style={{ fontSize: 13, marginBottom: 12, color: '#9C7245', background: 'transparent', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={14} /> Nazaj
        </button>
        <Title>{editing.id ? 'Uredi stranko' : 'Nova stranka'}</Title>
        <div className="space-y-3" style={{ marginTop: 16 }}>
          <Field label="Ime *" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
          <Field label="Naslov" value={editing.address} onChange={(v) => setEditing({ ...editing, address: v })} />
          <div className="grid grid-cols-3 gap-2">
            <Field label="Pošta" value={editing.postal} onChange={(v) => setEditing({ ...editing, postal: v })} />
            <div className="col-span-2"><Field label="Mesto" value={editing.city} onChange={(v) => setEditing({ ...editing, city: v })} /></div>
          </div>
          <Field label="Email" value={editing.email} onChange={(v) => setEditing({ ...editing, email: v })} />
          <Field label="Telefon" value={editing.phone} onChange={(v) => setEditing({ ...editing, phone: v })} />
          <Field label="Davčna številka" value={editing.taxNumber} onChange={(v) => setEditing({ ...editing, taxNumber: v })} />
        </div>
        <button
          onClick={() => save(editing)}
          disabled={!(editing.name || '').trim()}
          className={`w-full rounded-2xl flex items-center justify-center gap-2 font-semibold ${(editing.name || '').trim() ? 'gold-cta' : 'btn-disabled'}`}
          style={{ marginTop: 24, padding: '16px 20px', fontSize: 15 }}
        >
          <Save size={16} /> Shrani stranko
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      <div className="flex items-end justify-between" style={{ marginBottom: 20 }}>
        <div>
          <Title>Stranke</Title>
          <Subtitle>Shranjeni stiki za hitre ponudbe</Subtitle>
        </div>
        <button
          onClick={() => setEditing({ name: '', address: '', email: '', phone: '', taxNumber: '', postal: '', city: '' })}
          className="rounded-xl flex items-center justify-center gold-cta"
          style={{ width: 44, height: 44 }}
        >
          <Plus size={20} />
        </button>
      </div>

      {customers.length === 0 ? (
        <EmptyState icon={<Users size={20} />} title="Brez strank" hint="Stranke se shranijo samodejno ob ustvarjanju ponudb." />
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <div key={c.id} className="rounded-2xl flex items-center" style={{ background: 'white', border: '1px solid #F0E8DA', padding: 14, gap: 12 }}>
              <div className="rounded-full flex items-center justify-center font-semibold" style={{ width: 42, height: 42, background: '#F5EDE0', color: '#9C7245', fontSize: 14 }}>
                {(c.name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate" style={{ fontSize: 14 }}>{c.name}</div>
                <div className="truncate" style={{ fontSize: 12, color: '#9A9088' }}>
                  {[c.address, c.email].filter(Boolean).join(' · ') || '—'}
                </div>
              </div>
              <button onClick={() => setEditing(c)} className="btn-ghost rounded-lg" style={{ padding: 8, color: '#9A9088', background: 'transparent', border: 'none', cursor: 'pointer' }}><Edit2 size={16} /></button>
              <button onClick={() => confirm('Izbrišem stranko?') && remove(c.id)} className="btn-ghost rounded-lg" style={{ padding: 8, color: '#9A9088', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Cenik (price templates)
// --------------------------------------------------------------------------
function PriceListScreen({ templates, setTemplates, industries, setIndustries, showToast }) {
  const [active, setActive] = useState(null);    // id of industry being edited (item list)
  const [editingInd, setEditingInd] = useState(null); // industry meta being created/edited

  // ----- Industry meta editor -----
  if (editingInd) {
    const isNew = !editingInd.id;
    return (
      <IndustryEditor
        editing={editingInd}
        isNew={isNew}
        onCancel={() => setEditingInd(null)}
        onSave={(payload) => {
          if (isNew) {
            const id = `c-${Date.now()}`;
            const nextInd = {
              id,
              name: payload.name.trim(),
              short: (payload.short || payload.name).trim().slice(0, 16),
              icon: payload.icon,
              accent: payload.accent,
              desc: (payload.desc || '').trim(),
              builtin: false,
            };
            setIndustries((m) => ({ ...m, [id]: nextInd }));
            // Seed empty template so item-list editor has something to render
            setTemplates((t) => ({ ...t, [id]: [] }));
            showToast?.('Panoga ustvarjena');
            setEditingInd(null);
            // Jump straight into the item list of the new industry
            setActive(id);
          } else {
            const updated = {
              ...industries[editingInd.id],
              name: payload.name.trim(),
              short: (payload.short || payload.name).trim().slice(0, 16),
              icon: payload.icon,
              accent: payload.accent,
              desc: (payload.desc || '').trim(),
            };
            setIndustries((m) => ({ ...m, [editingInd.id]: updated }));
            showToast?.('Panoga shranjena');
            setEditingInd(null);
          }
        }}
        onDelete={
          editingInd.id && !editingInd.builtin
            ? () => {
                if (!confirm(`Izbrišem panogo "${editingInd.name}" in njen cenik?`)) return;
                setIndustries((m) => {
                  const copy = { ...m };
                  delete copy[editingInd.id];
                  return copy;
                });
                setTemplates((t) => {
                  const copy = { ...t };
                  delete copy[editingInd.id];
                  return copy;
                });
                showToast?.('Panoga izbrisana');
                setEditingInd(null);
              }
            : null
        }
      />
    );
  }

  // ----- Item list editor for a single industry -----
  if (active) {
    const list = templates[active] || [];
    const ind = industries[active];
    if (!ind) {
      // Industry was deleted while editing — bail out
      setActive(null);
      return null;
    }
    const update = (id, patch) =>
      setTemplates((t) => ({
        ...t,
        [active]: (t[active] || []).map((it) => (it.id === id ? { ...it, ...patch } : it)),
      }));
    const remove = (id) =>
      setTemplates((t) => ({ ...t, [active]: (t[active] || []).filter((it) => it.id !== id) }));
    const addItem = () => {
      const id = `i-${Date.now()}`;
      const newItem = { id, label: 'Nova postavka', desc: '', unit: 'kos', price: 0 };
      setTemplates((t) => ({ ...t, [active]: [...(t[active] || []), newItem] }));
    };
    const reset = () => {
      if (!DEFAULT_TEMPLATES[active]) return;
      if (confirm('Povrnem privzete cene za to panogo?')) {
        setTemplates((t) => ({ ...t, [active]: DEFAULT_TEMPLATES[active] }));
        showToast('Cene povrnjene');
      }
    };
    const isCustom = !ind.builtin;
    return (
      <div style={{ paddingBottom: 28 }}>
        <button
          onClick={() => setActive(null)}
          className="flex items-center gap-1"
          style={{ fontSize: 13, marginBottom: 12, color: '#9C7245', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} /> Nazaj na cenik
        </button>
        <div className="flex items-start justify-between" style={{ marginBottom: 16, gap: 12 }}>
          <div className="flex items-center" style={{ gap: 12, minWidth: 0, flex: 1 }}>
            <div className="rounded-2xl flex items-center justify-center flex-shrink-0" style={{ width: 48, height: 48, background: ind.accent + '18', color: ind.accent }}>
              <ParamIcon name={ind.icon} size={22} />
            </div>
            <div className="min-w-0">
              <Title>{ind.name}</Title>
              <Subtitle>{list.length} postavk · privzete cene za hitrejše ponudbe</Subtitle>
            </div>
          </div>
          <button
            onClick={() => setEditingInd(ind)}
            className="rounded-lg flex items-center justify-center btn-ghost"
            style={{ width: 36, height: 36, color: '#9C7245', background: '#F5EDE0', border: 'none', cursor: 'pointer', flexShrink: 0 }}
            title={isCustom ? 'Uredi panogo' : 'Uredi videz panoge'}
            aria-label="Uredi panogo"
          >
            <Edit2 size={16} />
          </button>
        </div>

        {DEFAULT_TEMPLATES[active] && (
          <button
            onClick={reset}
            style={{ fontSize: 12, color: '#9C7245', textDecoration: 'underline', background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: 12 }}
          >
            Povrni privzete cene
          </button>
        )}

        <div className="space-y-2">
          {list.length === 0 && (
            <EmptyState
              icon={<Tag size={20} />}
              title="Prazen cenik"
              hint="Dodaj prvo postavko spodaj. Postavke se uporabijo, ko ustvariš ponudbo iz te panoge."
            />
          )}
          {list.map((it) => (
            <PriceItemRow key={it.id} item={it} onChange={(patch) => update(it.id, patch)} onRemove={() => remove(it.id)} />
          ))}
        </div>

        <button
          onClick={addItem}
          className="w-full rounded-2xl flex items-center justify-center gap-2 font-medium btn-dashed"
          style={{ marginTop: 12, padding: '12px 16px', fontSize: 13 }}
        >
          <Plus size={16} /> Dodaj postavko
        </button>
      </div>
    );
  }

  // ----- Industry list (with "Nova panoga") -----
  return (
    <div style={{ paddingBottom: 24 }}>
      <div className="flex items-end justify-between" style={{ marginBottom: 16 }}>
        <div>
          <Title>Cenik</Title>
          <Subtitle>Privzete cene po panogah</Subtitle>
        </div>
        <button
          onClick={() => setEditingInd({ name: '', short: '', icon: 'hammer', accent: INDUSTRY_COLORS[0], desc: '' })}
          className="rounded-xl flex items-center justify-center gold-cta"
          style={{ width: 44, height: 44 }}
          aria-label="Nova panoga"
          title="Nova panoga"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-3" style={{ marginTop: 8 }}>
        {Object.values(industries).map((ind) => {
          const items = templates[ind.id] || [];
          const avg = items.reduce((s, it) => s + (Number(it.price) || 0), 0) / Math.max(items.length, 1);
          return (
            <button
              key={ind.id}
              onClick={() => setActive(ind.id)}
              className="w-full rounded-2xl flex items-center text-left btn-card"
              style={{ background: 'white', border: '1px solid #F0E8DA', padding: 14, gap: 12 }}
            >
              <div className="rounded-xl flex items-center justify-center flex-shrink-0" style={{ width: 48, height: 48, background: ind.accent + '18', color: ind.accent }}>
                <ParamIcon name={ind.icon} size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center" style={{ gap: 6 }}>
                  <div className="font-semibold truncate" style={{ fontSize: 14 }}>{ind.name}</div>
                  {!ind.builtin && (
                    <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 6, background: '#F5EDE0', color: '#9C7245', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0 }}>
                      Lastna
                    </span>
                  )}
                </div>
                <div className="truncate" style={{ fontSize: 12, color: '#9A9088', marginTop: 2 }}>
                  {items.length === 0
                    ? 'Brez postavk — dodaj svoj cenik'
                    : `${items.length} postavk · povp. ${fmtEUR(avg)}`}
                </div>
              </div>
              <ChevronRight size={18} style={{ color: '#9A9088' }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Single editable row inside the per-industry price list
function PriceItemRow({ item, onChange, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'white',
        border: expanded ? '1px solid #B8895A' : '1px solid #F0E8DA',
        boxShadow: expanded ? '0 8px 24px -12px rgba(184,137,90,0.35)' : 'none',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center text-left"
        style={{ padding: 14, gap: 12, background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <div className="rounded-xl flex items-center justify-center flex-shrink-0" style={{ width: 40, height: 40, background: '#F5EDE0', color: '#B8895A' }}>
          <ParamIcon name={paramIconFor(item.label, item.unit)} size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate" style={{ fontSize: 14 }}>{item.label}</div>
          <div style={{ fontSize: 11, color: '#9A9088', marginTop: 2 }}>{item.unit}</div>
        </div>
        <div className="font-bold tabular-nums flex-shrink-0" style={{ fontSize: 14 }}>{fmtEUR(item.price)}</div>
        <ChevronDown size={16} style={{ color: '#9A9088', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>
      {expanded && (
        <div className="space-y-3" style={{ padding: '4px 14px 14px', borderTop: '1px solid #F0E8DA', background: '#FCFAF5' }}>
          <Field label="Naziv postavke" value={item.label} onChange={(v) => onChange({ label: v })} />
          <Field label="Opis (neobvezno)" value={item.desc} onChange={(v) => onChange({ desc: v })} placeholder="Dodatna pojasnila" />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Enota" value={item.unit} onChange={(v) => onChange({ unit: v })} placeholder="kos / m² / tm / h / kg" />
            <Field label="Cena (€)" type="number" inputMode="decimal" step="0.01" value={item.price} onChange={(v) => onChange({ price: v === '' ? 0 : Number(v) })} />
          </div>
          <button
            onClick={onRemove}
            className="w-full rounded-xl flex items-center justify-center gap-1.5 font-medium"
            style={{ padding: '12px 14px', border: '1px solid #fecaca', color: '#ef4444', fontSize: 13, background: 'white', cursor: 'pointer' }}
          >
            <Trash2 size={14} /> Odstrani postavko
          </button>
        </div>
      )}
    </div>
  );
}

// ----- Industry meta editor (icon + color picker, name, short, desc) -----
function IndustryEditor({ editing, isNew, onCancel, onSave, onDelete }) {
  const [name, setName] = useState(editing.name || '');
  const [shortName, setShortName] = useState(editing.short || '');
  const [desc, setDesc] = useState(editing.desc || '');
  const [icon, setIcon] = useState(editing.icon || 'hammer');
  const [accent, setAccent] = useState(editing.accent || INDUSTRY_COLORS[0]);
  const canSave = name.trim().length > 0;

  return (
    <div style={{ paddingBottom: 28 }}>
      <button
        onClick={onCancel}
        className="flex items-center gap-1"
        style={{ fontSize: 13, marginBottom: 12, color: '#9C7245', background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <ArrowLeft size={14} /> Prekliči
      </button>

      <Title>{isNew ? 'Nova panoga' : 'Uredi panogo'}</Title>
      <Subtitle>
        {isNew
          ? 'Ustvari panogo po meri — npr. slikopleskarstvo, krovstvo, tlakovanje.'
          : editing.builtin
          ? 'Lahko spremeniš ime, ikono in barvo.'
          : 'Spremeni vse podatke ali izbriši panogo.'}
      </Subtitle>

      {/* Live preview card */}
      <div className="rounded-2xl" style={{ background: 'white', border: '1px solid #F0E8DA', padding: 14, marginTop: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="rounded-2xl flex items-center justify-center flex-shrink-0" style={{ width: 56, height: 56, background: accent + '18', color: accent }}>
          <ParamIcon name={icon} size={26} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate" style={{ fontSize: 15 }}>{name || 'Ime panoge'}</div>
          <div className="truncate" style={{ fontSize: 12, color: '#9A9088', marginTop: 2 }}>{desc || 'Kratek opis (neobvezno)'}</div>
        </div>
      </div>

      <div className="space-y-3">
        <Field label="Ime panoge *" value={name} onChange={setName} placeholder="npr. Slikopleskarska dela" />
        <Field label="Kratko ime" value={shortName} onChange={setShortName} placeholder="npr. Pleskanje (max 16 znakov)" />
        <Field label="Kratek opis" value={desc} onChange={setDesc} placeholder="npr. Pleskanje, tapete, dekorativne tehnike" />
      </div>

      {/* Icon picker */}
      <div style={{ marginTop: 20 }}>
        <div className="font-medium" style={{ fontSize: 12, color: '#5C544A', marginBottom: 10, marginLeft: 4 }}>Ikona</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {INDUSTRY_ICONS.map((ic) => {
            const selected = ic === icon;
            return (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className="rounded-xl flex items-center justify-center"
                style={{
                  height: 52,
                  background: selected ? accent + '18' : 'white',
                  border: selected ? `2px solid ${accent}` : '1px solid #F0E8DA',
                  color: selected ? accent : '#5C544A',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease',
                }}
                aria-label={`Ikona ${ic}`}
              >
                <ParamIcon name={ic} size={22} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Color picker */}
      <div style={{ marginTop: 20 }}>
        <div className="font-medium" style={{ fontSize: 12, color: '#5C544A', marginBottom: 10, marginLeft: 4 }}>Barva</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }}>
          {INDUSTRY_COLORS.map((c) => {
            const selected = c === accent;
            return (
              <button
                key={c}
                onClick={() => setAccent(c)}
                className="rounded-full flex items-center justify-center"
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  background: c,
                  border: selected ? '3px solid white' : '1px solid rgba(0,0,0,0.06)',
                  boxShadow: selected ? `0 0 0 2px ${c}` : 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.1s ease',
                }}
                aria-label={`Barva ${c}`}
              >
                {selected && <Check size={14} color="white" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => onSave({ name, short: shortName, desc, icon, accent })}
        disabled={!canSave}
        className={`w-full rounded-2xl flex items-center justify-center gap-2 font-semibold ${canSave ? 'gold-cta' : 'btn-disabled'}`}
        style={{ marginTop: 24, padding: '16px 20px', fontSize: 15 }}
      >
        <Save size={16} /> {isNew ? 'Ustvari panogo' : 'Shrani panogo'}
      </button>

      {onDelete && (
        <button
          onClick={onDelete}
          className="w-full rounded-2xl flex items-center justify-center gap-2 font-medium"
          style={{ marginTop: 12, padding: '14px 20px', fontSize: 14, border: '1px solid #fecaca', color: '#ef4444', background: 'white', cursor: 'pointer' }}
        >
          <Trash2 size={15} /> Izbriši panogo
        </button>
      )}

      {!isNew && editing.builtin && (
        <p className="text-center" style={{ fontSize: 11, color: '#9A9088', marginTop: 12 }}>
          Privzetih panog se ne da izbrisati — lahko pa jih poljubno preimenuješ.
        </p>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Templates
// --------------------------------------------------------------------------
function TemplatesScreen({ offers, onOpen }) {
  return (
    <div style={{ paddingBottom: 24 }}>
      <Title>Predloge</Title>
      <Subtitle>Uporabi prejšnjo ponudbo kot izhodišče</Subtitle>
      {offers.length === 0 ? (
        <div style={{ marginTop: 16 }}>
          <EmptyState icon={<FileText size={20} />} title="Brez predlog" hint="Ko ustvariš ponudbo, postane na voljo kot predloga." />
        </div>
      ) : (
        <div className="space-y-2" style={{ marginTop: 16 }}>
          {offers.slice(0, 12).map((o) => {
            const ind = INDUSTRIES[o.industry];
            return (
              <button key={o.id} onClick={() => onOpen(o.id)} className="w-full rounded-2xl flex items-center text-left btn-card" style={{ background: 'white', border: '1px solid #F0E8DA', padding: 14, gap: 12 }}>
                <div className="rounded-xl flex items-center justify-center flex-shrink-0" style={{ width: 42, height: 42, background: (ind?.accent || '#B8895A') + '15', color: ind?.accent || '#B8895A' }}>
                  <ParamIcon name={ind?.icon || 'hammer'} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate" style={{ fontSize: 14 }}>{o.client?.name || 'Brez stranke'}</div>
                  <div style={{ fontSize: 11, color: '#9A9088' }}>{ind?.name} · {fmtEUR(o.total)}</div>
                </div>
                <ChevronRight size={16} style={{ color: '#9A9088' }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Settings
// --------------------------------------------------------------------------
function SettingsScreen({ settings, setSettings, showToast }) {
  const fileRef = useRef();
  const update = (patch) => setSettings((s) => ({ ...s, ...patch }));
  const onLogo = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { alert('Logo naj bo manjši od 2 MB'); return; }
    const r = new FileReader();
    r.onload = (ev) => update({ logo: ev.target.result });
    r.readAsDataURL(f);
  };
  return (
    <div style={{ paddingBottom: 28 }}>
      <Title>Nastavitve</Title>
      <Subtitle>Tvoji podatki se prikazujejo na vsaki ponudbi.</Subtitle>

      <div className="rounded-2xl" style={{ background: 'white', border: '1px solid #F0E8DA', padding: 14, marginTop: 16, marginBottom: 16 }}>
        <div className="font-medium" style={{ fontSize: 12, color: '#5C544A', marginBottom: 12 }}>Logotip</div>
        <div className="flex items-center" style={{ gap: 12 }}>
          <div className="rounded-2xl flex items-center justify-center overflow-hidden" style={{ width: 80, height: 80, background: '#FAF7F2', border: '1px dashed #E0D2B5' }}>
            {settings.logo
              ? <img src={settings.logo} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              : <Upload size={20} style={{ color: '#9A9088' }} />}
          </div>
          <div className="flex-1">
            <input ref={fileRef} type="file" accept="image/*" onChange={onLogo} style={{ display: 'none' }} />
            <button onClick={() => fileRef.current?.click()} className="w-full rounded-xl font-semibold" style={{ background: '#F5EDE0', color: '#9C7245', padding: '10px 14px', fontSize: 13, border: 'none', cursor: 'pointer' }}>
              {settings.logo ? 'Zamenjaj logo' : 'Naloži logo'}
            </button>
            {settings.logo && (
              <button onClick={() => update({ logo: null })} style={{ fontSize: 12, color: '#ef4444', marginTop: 8, background: 'transparent', border: 'none', cursor: 'pointer' }}>Odstrani logo</button>
            )}
          </div>
        </div>
      </div>

      <SectionHeader icon={<Building2 size={14} />} label="Podatki podjetja" />
      <div className="space-y-3">
        <Field label="Ime podjetja" icon={<Building2 size={16} />} value={settings.companyName} onChange={(v) => update({ companyName: v })} placeholder="Parketarstvo Novak d.o.o." />
        <Field label="Naslov" icon={<MapPin size={16} />} value={settings.address} onChange={(v) => update({ address: v })} placeholder="Cesta na Brdo 85" />
        <div className="grid grid-cols-3 gap-2">
          <Field label="Pošta" value={settings.postalCode} onChange={(v) => update({ postalCode: v })} placeholder="1000" />
          <div className="col-span-2"><Field label="Mesto" value={settings.city} onChange={(v) => update({ city: v })} placeholder="Ljubljana" /></div>
        </div>
        <Field label="Davčna številka" icon={<Hash size={16} />} value={settings.taxNumber} onChange={(v) => update({ taxNumber: v })} placeholder="SI12345678" />
        <Field label="Matična številka" icon={<Hash size={16} />} value={settings.registrationNumber} onChange={(v) => update({ registrationNumber: v })} placeholder="8765432000" />
        <Field label="IBAN" icon={<CreditCard size={16} />} value={settings.iban} onChange={(v) => update({ iban: v })} placeholder="SI56 0201 0025 8765 432" />
      </div>

      <SectionHeader icon={<Phone size={14} />} label="Kontakt" />
      <div className="space-y-3">
        <Field label="Telefon" icon={<Phone size={16} />} value={settings.phone} onChange={(v) => update({ phone: v })} placeholder="041 123 456" />
        <Field label="E-mail" icon={<Mail size={16} />} value={settings.email} onChange={(v) => update({ email: v })} placeholder="info@podjetje.si" />
        <Field label="Spletna stran" icon={<Globe size={16} />} value={settings.website} onChange={(v) => update({ website: v })} placeholder="www.podjetje.si" />
      </div>

      <SectionHeader icon={<FileSignature size={14} />} label="Privzeti pogoji" />
      <div className="space-y-3">
        <label className="block">
          <div className="font-medium" style={{ fontSize: 12, color: '#5C544A', marginBottom: 6, marginLeft: 4 }}>Privzete opombe na ponudbi</div>
          <textarea
            value={settings.notes} onChange={(e) => update({ notes: e.target.value })} rows={3}
            className="w-full rounded-xl input-field"
            style={{ padding: '12px 16px', background: 'white', border: '1px solid #EDE2CD', fontSize: 14, resize: 'none' }}
            placeholder="V ceno je vključeno..."
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Plačilni rok" value={settings.paymentTerms} onChange={(v) => update({ paymentTerms: v })} placeholder="po dogovoru" />
          <Field label="Rok izvedbe" value={settings.deliveryTerms} onChange={(v) => update({ deliveryTerms: v })} placeholder="po dogovoru" />
        </div>
      </div>

      <button
        onClick={() => showToast('Nastavitve shranjene')}
        className="w-full rounded-2xl flex items-center justify-center gap-2 font-semibold"
        style={{ marginTop: 24, padding: '14px 16px', background: '#F5EDE0', color: '#9C7245', fontSize: 14, border: 'none', cursor: 'pointer' }}
      >
        <Check size={16} /> Shranjeno samodejno
      </button>
    </div>
  );
}

// --------------------------------------------------------------------------
// Empty state
// --------------------------------------------------------------------------
function EmptyState({ icon, title, hint }) {
  return (
    <div className="text-center rounded-2xl" style={{ background: '#FAF7F2', border: '1px dashed #E8E0CE', padding: '32px 20px' }}>
      <div className="rounded-full flex items-center justify-center mx-auto" style={{ width: 48, height: 48, background: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', color: '#B8895A', marginBottom: 12 }}>
        {icon}
      </div>
      <div className="font-semibold" style={{ fontSize: 15 }}>{title}</div>
      <p style={{ fontSize: 13, color: '#9A9088', marginTop: 4, maxWidth: 260, marginLeft: 'auto', marginRight: 'auto' }}>{hint}</p>
    </div>
  );
}

// --------------------------------------------------------------------------
// Bottom nav
// --------------------------------------------------------------------------
function BottomNav({ tab, setTab }) {
  const items = [
    { id: 'ponudbe',    label: 'Ponudbe',    icon: Home },
    { id: 'stranke',    label: 'Stranke',    icon: Users },
    { id: 'cenik',      label: 'Cenik',      icon: Tag },
    { id: 'predloge',   label: 'Predloge',   icon: FileText },
    { id: 'nastavitve', label: 'Nastavitve', icon: SettingsIcon },
  ];
  return (
    <nav className="bottom-nav-mobile fixed left-0 right-0 z-40" style={{ bottom: 0 }}>
      <div className="mx-auto" style={{ maxWidth: 440, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderTop: '1px solid #F0E8DA', padding: '8px 8px 12px' }}>
        <div className="grid grid-cols-5 gap-1">
          {items.map((it) => {
            const Active = it.id === tab; const Icon = it.icon;
            return (
              <button
                key={it.id} onClick={() => setTab(it.id)}
                className="flex flex-col items-center rounded-xl"
                style={{ padding: '6px 4px', color: Active ? '#B8895A' : '#9A9088', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <Icon size={20} strokeWidth={Active ? 2.4 : 1.8} />
                <span style={{ fontSize: 10, fontWeight: Active ? 600 : 500 }}>{it.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// --------------------------------------------------------------------------
// Live PDF preview panel (desktop split view, ≥1024px)
// --------------------------------------------------------------------------
function LivePDFPanel({ draft, settings, totals }) {
  const ind = INDUSTRIES[draft.industry];
  const items = draft.items.filter((i) => i.included !== false && Number(i.qty) > 0);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.62);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.offsetWidth - 32;
      setScale(Math.max(0.42, Math.min(w / 620, 1)));
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <aside className="app-preview-panel">
      <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid #F0E8DA', background: 'white', flexShrink: 0 }}>
        <div className="flex items-center" style={{ gap: 8 }}>
          <Eye size={14} style={{ color: '#B8895A' }} />
          <span className="font-semibold" style={{ fontSize: 13, color: '#5C544A' }}>Predogled ponudbe</span>
          {items.length > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 11, background: '#F5EDE0', color: '#9C7245', padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>
              {fmtEUR(totals.total)}
            </span>
          )}
        </div>
      </div>
      <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center" style={{ height: '100%', gap: 12, color: '#9A9088', paddingTop: 60 }}>
            <FileText size={32} style={{ opacity: 0.3 }} />
            <p style={{ fontSize: 13, textAlign: 'center', maxWidth: 200 }}>Vpiši količine v postavke, da se predogled posodobi.</p>
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 2px 24px -4px rgba(0,0,0,0.12)',
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
            width: `${Math.round(100 / scale)}%`,
            marginBottom: `${-Math.round(620 * (1 - scale))}px`,
          }}>
            <PdfBody draft={draft} settings={settings} totals={totals} ind={ind} items={items} />
          </div>
        )}
      </div>
    </aside>
  );
}

// --------------------------------------------------------------------------
// Desktop sidebar nav
// --------------------------------------------------------------------------
function SideNav({ tab, setTab, settings }) {
  const items = [
    { id: 'ponudbe',    label: 'Ponudbe',    icon: Home },
    { id: 'stranke',    label: 'Stranke',    icon: Users },
    { id: 'cenik',      label: 'Cenik',      icon: Tag },
    { id: 'predloge',   label: 'Predloge',   icon: FileText },
    { id: 'nastavitve', label: 'Nastavitve', icon: SettingsIcon },
  ];
  const initials = ((settings.companyName || '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()) || 'AM';
  return (
    <aside className="app-sidebar">
      <div style={{ padding: '24px 16px 20px' }}>
        <BrandLogo />
      </div>
      <nav style={{ flex: 1, padding: '0 8px' }}>
        {items.map((it) => {
          const active = it.id === tab;
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              onClick={() => setTab(it.id)}
              className={`w-full rounded-xl flex items-center${active ? '' : ' btn-ghost'}`}
              style={{
                padding: '10px 12px',
                gap: 10,
                marginBottom: 2,
                color: active ? '#B8895A' : '#5C544A',
                background: active ? '#F5EDE0' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontWeight: active ? 600 : 500,
                fontSize: 14,
              }}
            >
              <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
              {it.label}
            </button>
          );
        })}
      </nav>
      <div className="flex items-center" style={{ gap: 10, padding: '12px 16px', borderTop: '1px solid #F0E8DA' }}>
        <div className="rounded-full flex items-center justify-center font-semibold flex-shrink-0" style={{ width: 36, height: 36, background: '#F5EDE0', color: '#9C7245', fontSize: 12 }}>
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="font-semibold" style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1A1A1A' }}>
            {settings.companyName || 'Moje podjetje'}
          </div>
          <div style={{ fontSize: 11, color: '#9A9088', marginTop: 1 }}>kvota.si</div>
        </div>
      </div>
    </aside>
  );
}

// --------------------------------------------------------------------------
// Global styles — design tokens, fonts, animations
// --------------------------------------------------------------------------
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Caveat:wght@400;700&display=swap');

      * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
      html, body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; margin: 0; padding: 0; }
      .font-app { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
      .font-signature { font-family: 'Caveat', cursive; }
      .tabular-nums { font-variant-numeric: tabular-nums; }

      /* Primary CTA (gold gradient) */
      .gold-cta {
        background: linear-gradient(135deg, #B8895A 0%, #9C7245 100%);
        color: white;
        border: none;
        box-shadow: 0 10px 30px -10px rgba(184,137,90,0.5);
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .gold-cta:hover { box-shadow: 0 14px 36px -10px rgba(184,137,90,0.6); }
      .gold-cta:active { transform: scale(0.99); }
      .gold-cta:disabled { cursor: not-allowed; opacity: 0.7; }

      .btn-disabled {
        background: #F0E8DA;
        color: #9A9088;
        cursor: not-allowed;
        border: none;
      }
      .btn-card { transition: border-color 0.15s ease, transform 0.15s ease; cursor: pointer; background: white; }
      .btn-card:hover { border-color: #E0D2B5 !important; }
      .btn-card:active { transform: scale(0.99); }

      .btn-ghost { transition: background-color 0.12s ease; }
      .btn-ghost:hover { background: #F5EDE0 !important; }

      .btn-list { transition: background-color 0.12s ease; }
      .btn-list:hover { background: #FAF7F2; }

      .btn-dashed {
        background: white;
        border: 1px dashed #E0D2B5;
        color: #9C7245;
        cursor: pointer;
        transition: background-color 0.15s ease;
      }
      .btn-dashed:hover { background: #FAF3E5; }

      .row-card { transition: border-color 0.15s ease; }
      .row-card:hover { border-color: #E0D2B5 !important; }

      .input-field {
        outline: none;
        font-family: inherit;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
        color: #1A1A1A;
      }
      .input-field:focus {
        border-color: #B8895A !important;
        box-shadow: 0 0 0 3px rgba(184,137,90,0.15);
      }
      .input-field::placeholder { color: #C5BCAE; }

      input[type="number"]::-webkit-outer-spin-button,
      input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      input[type="number"] { -moz-appearance: textfield; }

      @keyframes spin { to { transform: rotate(360deg); } }
      .spin { animation: spin 0.8s linear infinite; }

      @keyframes toastPop { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
      .toast-pop { animation: toastPop 0.25s ease-out; }

      /* ---- Desktop two-column layout (≥768px) ---- */
      .app-sidebar { display: none; }

      @media (min-width: 768px) {
        .app-shell {
          max-width: 800px !important;
          display: flex !important;
          flex-direction: row !important;
        }
        .app-sidebar {
          display: flex !important;
          flex-direction: column;
          width: 220px;
          flex-shrink: 0;
          border-right: 1px solid #F0E8DA;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }
        .app-content-col {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .app-header-home { display: none !important; }
        .bottom-nav-mobile { display: none !important; }
        .app-main-pad { padding-bottom: 48px !important; }
      }

      /* ---- Split view: ParametersForm + live PDF preview (≥1024px) ---- */
      .app-content-body { flex: 1; display: flex; flex-direction: column; min-height: 0; }
      .app-preview-panel { display: none; }

      @media (min-width: 1024px) {
        .app-shell-split { max-width: 1160px !important; }
        .app-split-active { flex-direction: row !important; }
        .app-split-active .app-main-col {
          width: 420px;
          flex-shrink: 0;
          overflow-y: auto;
          border-right: 1px solid #F0E8DA;
        }
        .app-preview-panel {
          display: flex !important;
          flex-direction: column;
          flex: 1;
          min-width: 0;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: hidden;
          background: #FAF7F2;
        }
      }
    `}</style>
  );
}
