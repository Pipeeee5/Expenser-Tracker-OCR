import { GoogleGenerativeAI } from '@google/generative-ai';
import { runLocalOCR } from './ocr-local';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Free-tier priority chain — ordered by requests/day:
 *  gemini-2.0-flash-lite  → 1,500 RPD
 *  gemini-1.5-flash-8b    → 1,500 RPD
 *  gemini-2.0-flash       →   200 RPD
 */
const MODEL_CHAIN = ['gemini-2.0-flash-lite', 'gemini-1.5-flash-8b', 'gemini-2.0-flash'];

// Hard timeout per Gemini call attempt (ms)
const GEMINI_TIMEOUT_MS = 20_000;

export interface OcrResult {
  merchant: string;
  date: string;
  total: number;
  subtotal?: number;
  tax?: number;
  currency: string;
  description: string;
  items: Array<{ description: string; amount: number; quantity?: number }>;
  category: string;
  rawText: string;
  confidence: number;
  modelUsed?: string;
}

const PROMPT = `Analiza esta imagen y responde ÚNICAMENTE con JSON válido.
Instrucciones críticas:
1. "total": El monto final pagado. DEBE ser un número real. Si la moneda es CLP, ignora puntos de miles (ej: "20.000" -> 20000). Si es USD o EUR usa punto decimal.
2. "currency": SOLO puede ser "CLP", "USD" o "EUR". Deduce según el símbolo o país. Default: CLP.

Extrae:
- rawText: Todo el texto visible en el recibo (con \\n)
- merchant: Nombre del establecimiento
- date: Fecha YYYY-MM-DD
- total: Monto total como número exacto
- subtotal: número o null
- tax: IVA/impuesto como número o null
- currency: "CLP", "USD" o "EUR"
- description: Resumen descriptivo breve.
- items: [{description, amount, quantity}]
- category: food, transport, shopping, entertainment, health, housing, education, travel, business o other
- confidence: 0 a 1

Ejemplo:
{"rawText":"LIDER\\nLeche $2190\\nTOTAL $2.190","merchant":"Tienda","date":"2026-04-08","total":2190,"subtotal":null,"tax":null,"currency":"CLP","description":"Víveres","items":[{"description":"Leche","amount":2190,"quantity":1}],"category":"food","confidence":0.95}`;

// ── Helpers ───────────────────────────────────────────────────────────────

/** Race a promise against a hard timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let handle: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    handle = setTimeout(() => reject(new Error(`timeout_${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(handle)) as Promise<T>;
}

type GeminiErrorKind = 'overloaded' | 'quota' | 'not_found' | 'timeout' | 'other';

function classifyError(err: unknown): GeminiErrorKind {
  if (!(err instanceof Error)) return 'other';
  const m = err.message;
  if (m.startsWith('timeout_')) return 'timeout';
  if (m.includes('404') || m.toLowerCase().includes('not found')) return 'not_found';
  if (m.includes('503') || m.toLowerCase().includes('unavailable') || m.toLowerCase().includes('high demand')) return 'overloaded';
  if (m.includes('429') || m.toLowerCase().includes('quota') || m.toLowerCase().includes('too many')) return 'quota';
  return 'other';
}

// ── Single model call — ONE attempt, hard timeout ─────────────────────────

async function callModel(modelName: string, imageBase64: string, mimeType: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: modelName });

  const call = model.generateContent([
    { inlineData: { data: imageBase64, mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp' } },
    PROMPT,
  ]);

  const res = await withTimeout(call, GEMINI_TIMEOUT_MS);
  return res.response.text().trim();
}

// ── Public: chain → Tesseract fallback ───────────────────────────────────

export async function analyzeReceipt(
  imageBase64: string,
  mimeType: string,
  imageBuffer?: Buffer
): Promise<OcrResult> {
  // 1. Try each Gemini model — skip immediately on any error
  for (const modelName of MODEL_CHAIN) {
    try {
      console.log(`[OCR] Trying ${modelName}...`);
      const text = await callModel(modelName, imageBase64, mimeType);
      const json = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      const result = JSON.parse(json) as OcrResult;
      result.modelUsed = modelName;
      console.log(`[OCR] ✓ ${modelName} succeeded`);
      return result;
    } catch (err) {
      const kind = classifyError(err);
      console.warn(`[OCR] ${modelName} → ${kind}, skipping`);

      // Only skip to next model for retryable / availability errors
      const skipKinds: GeminiErrorKind[] = ['overloaded', 'quota', 'not_found', 'timeout'];
      if (!skipKinds.includes(kind)) {
        // Hard failure (invalid API key, bad image format) — go to local OCR
        console.warn('[OCR] Non-retryable error, going to local OCR');
        break;
      }
      // Otherwise: loop continues to next model
    }
  }

  // 2. Local Tesseract — no API, no limits
  if (imageBuffer) {
    console.log('[OCR] Falling back to Tesseract local OCR...');
    try {
      const result = await runLocalOCR(imageBuffer);
      console.log('[OCR] ✓ Local OCR succeeded');
      return result;
    } catch (localErr) {
      console.error('[OCR] Local OCR failed:', localErr);
    }
  }

  // 3. Ultimate fallback — empty scaffold so the user can fill it manually
  console.warn('[OCR] All methods exhausted, returning empty scaffold');
  return {
    rawText: 'No se pudo leer el texto de la imagen.',
    merchant: '',
    date: new Date().toISOString().slice(0, 10),
    total: 0,
    currency: 'CLP',
    description: '',
    items: [],
    category: 'other',
    confidence: 0,
    modelUsed: 'manual',
  };
}
