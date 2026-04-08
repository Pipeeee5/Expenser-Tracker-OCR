/**
 * Local OCR fallback using Tesseract.js — no API, no limits, always works.
 * Accuracy is lower than Gemini but reliably extracts totals, dates and items.
 */
import { createWorker } from 'tesseract.js';
import { autoDetectCategory } from './categories';
import type { OcrResult } from './gemini';

const TESSERACT_TIMEOUT_MS = 45_000;

// ── Public entry point ────────────────────────────────────────────────────

export async function runLocalOCR(imageBuffer: Buffer): Promise<OcrResult> {
  const rawText = await extractTextWithTimeout(imageBuffer);
  return parseReceiptText(rawText);
}

// ── Tesseract extraction ──────────────────────────────────────────────────

async function extractText(buffer: Buffer): Promise<string> {
  // Use only 'eng' first — faster because 'spa' requires an extra 20 MB download.
  // Most receipt text is recognized fine with English + numbers.
  const worker = await createWorker('eng', 1, { logger: () => {} });
  try {
    const { data } = await worker.recognize(buffer);
    return data.text ?? '';
  } finally {
    await worker.terminate().catch(() => {});
  }
}

async function extractTextWithTimeout(buffer: Buffer): Promise<string> {
  let handle: ReturnType<typeof setTimeout>;
  const timeout = new Promise<string>((resolve) => {
    handle = setTimeout(() => {
      console.warn('[Tesseract] Timeout — returning empty string');
      resolve('');
    }, TESSERACT_TIMEOUT_MS);
  });
  try {
    return await Promise.race([extractText(buffer), timeout]);
  } finally {
    clearTimeout(handle!);
  }
}

// ── Receipt parser ────────────────────────────────────────────────────────

function parseReceiptText(rawText: string): OcrResult {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const currency = detectCurrency(rawText);
  const merchant = extractMerchant(lines);
  const date = extractDate(rawText);
  const { total, subtotal, tax } = extractAmounts(rawText);
  const items = extractItems(lines, total);
  const category = autoDetectCategory(`${merchant} ${rawText.slice(0, 400)}`);
  const description = buildDescription(merchant, items, category);

  return {
    rawText,
    merchant,
    date,
    total,
    subtotal: subtotal ?? undefined,
    tax: tax ?? undefined,
    currency,
    description,
    items,
    category,
    confidence: rawText.length > 80 ? 0.6 : 0.3,
    modelUsed: 'local-ocr',
  };
}

// ── Merchant ──────────────────────────────────────────────────────────────

function extractMerchant(lines: string[]): string {
  // The store name is usually in the first few lines.
  // Skip lines that are only digits, symbols, or very short.
  for (const line of lines.slice(0, 6)) {
    if (line.length >= 3 && !/^[\d\s\-_.:/\\|*#@$%]+$/.test(line)) {
      return line.replace(/[*|#_=]+/g, '').trim();
    }
  }
  return 'Comercio';
}

// ── Date ─────────────────────────────────────────────────────────────────

function extractDate(text: string): string {
  const today = new Date().toISOString().slice(0, 10);

  const patterns: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
    // YYYY-MM-DD
    [/(\d{4})[-\/](\d{2})[-\/](\d{2})/, (m) => `${m[1]}-${m[2]}-${m[3]}`],
    // DD/MM/YYYY or DD-MM-YYYY
    [/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/, (m) => `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`],
    // DD/MM/YY
    [/(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})(?!\d)/, (m) => {
      const y = parseInt(m[3]) > 50 ? `19${m[3]}` : `20${m[3]}`;
      return `${y}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
    }],
  ];

  for (const [regex, format] of patterns) {
    const match = text.match(regex);
    if (match) {
      try {
        const d = format(match);
        // Basic sanity check
        if (new Date(d).getFullYear() >= 2000) return d;
      } catch { /* continue */ }
    }
  }

  return today;
}

// ── Amount parsing ────────────────────────────────────────────────────────

/**
 * Handles both Chilean format (5.557 with period as thousands separator)
 * and US/international format (5,557.00).
 */
function parseAmount(raw: string): number {
  const s = raw.trim().replace(/[$\s]/g, '');
  if (!s) return 0;

  // Chilean: digits with periods every 3 digits (e.g. 1.234 or 1.234.567)
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    return parseInt(s.replace(/\./g, ''), 10);
  }

  // Standard decimal (1234.56 or 1,234.56)
  const n = parseFloat(s.replace(/[^\d.]/g, ''));
  return isNaN(n) ? 0 : n;
}

function extractAmounts(text: string): {
  total: number;
  subtotal: number | null;
  tax: number | null;
} {
  const totalPat = [
    /(?:total\s+a\s+pagar|total\s+factura|gran\s+total)[^\d]*([\d.,]+)/i,
    /\btotal\b[^\d]*([\d.,]+)/i,
  ];
  const subtotalPat = /(?:subtotal|sub[-\s]?total|total\s+neto|neto)[^\d]*([\d.,]+)/i;
  const taxPat = /(?:iva|igv|tax|impuesto)(?:\s+\d+\s*%?)?[^\d]*([\d.,]+)/i;

  let total = 0;
  for (const p of totalPat) {
    const m = text.match(p);
    if (m) { total = parseAmount(m[1]); break; }
  }

  const subtotalMatch = text.match(subtotalPat);
  const subtotal = subtotalMatch ? parseAmount(subtotalMatch[1]) : null;

  const taxMatch = text.match(taxPat);
  const tax = taxMatch ? parseAmount(taxMatch[1]) : null;

  // Fallback: largest dollar amount in the text
  if (total === 0) {
    const all = [...text.matchAll(/\$\s*([\d.,]+)/g)].map((m) => parseAmount(m[1]));
    if (all.length) total = Math.max(...all);
  }

  return { total, subtotal, tax };
}

// ── Items ─────────────────────────────────────────────────────────────────

function extractItems(
  lines: string[],
  totalAmount: number
): OcrResult['items'] {
  const items: OcrResult['items'] = [];

  // Lines like: "Leche 1L x2   $2.190"  or  "Pan molde    1.490"
  const itemRe = /^(.{3,45?}?)\s+(?:x\s*(\d+)\s+)?[$]?\s*([\d.,]+)\s*$/;
  const skipRe = /^(total|subtotal|neto|iva|igv|tax|fecha|rut|folio|boleta|factura|gracias|vuelto|cambio|efectivo|tarjeta|visa|master)/i;

  for (const line of lines) {
    if (skipRe.test(line)) continue;
    const m = line.match(itemRe);
    if (!m) continue;

    const amount = parseAmount(m[3]);
    // Sanity: item must cost less than total and more than 0
    if (amount <= 0 || (totalAmount > 0 && amount > totalAmount)) continue;

    items.push({
      description: m[1].trim().replace(/[*|#_]+/g, '').trim(),
      amount,
      quantity: m[2] ? parseInt(m[2]) : 1,
    });
  }

  return items.slice(0, 20);
}

// ── Description ───────────────────────────────────────────────────────────

function buildDescription(
  merchant: string,
  items: OcrResult['items'],
  category: string
): string {
  const labels: Record<string, string> = {
    food: 'Supermercado/Alimentación',
    transport: 'Transporte',
    shopping: 'Compras',
    entertainment: 'Entretenimiento',
    health: 'Salud/Farmacia',
    housing: 'Hogar/Servicios',
    education: 'Educación',
    travel: 'Viajes',
    business: 'Negocio',
    other: 'Compra',
  };

  const base = labels[category] ?? 'Compra';

  if (items.length > 0) {
    const sample = items
      .slice(0, 3)
      .map((i) => i.description)
      .join(', ');
    const extra = items.length > 3 ? ` y ${items.length - 3} productos más` : '';
    return `${base} en ${merchant} — ${sample}${extra}`;
  }

  return `${base} en ${merchant}`;
}

// ── Currency ──────────────────────────────────────────────────────────────

function detectCurrency(text: string): string {
  if (/\bUSD\b|\bUS\$|\bdollar/i.test(text)) return 'USD';
  if (/\bEUR\b|€/i.test(text)) return 'EUR';
  if (/\bMXN\b|\bpeso\s+mexicano/i.test(text)) return 'MXN';
  if (/\bCOP\b/i.test(text)) return 'COP';
  if (/\bPEN\b|\bsoles?\b/i.test(text)) return 'PEN';
  if (/\bARS\b/i.test(text)) return 'ARS';
  // Chilean markers
  if (/\bRUT\b|\bboleta\b|\bfactura\b|\bIVA\s+19/i.test(text)) return 'CLP';
  return 'CLP';
}
