'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload, Scan, AlertCircle, Loader2, X, Image as ImageIcon,
  FileText, CheckCircle, ShoppingBag, Calendar, DollarSign,
  Tag, List, Save,
} from 'lucide-react';
import type { OcrResult } from '@/lib/gemini';
import { getCategoryById } from '@/lib/categories';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OCRScannerProps {
  onResult: (result: OcrResult, imageUrl: string) => void;
  onClose?: () => void;
}

type ScanStatus = 'idle' | 'scanning' | 'results' | 'error';

export default function OCRScanner({ onResult, onClose }: OCRScannerProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<OcrResult | null>(null);
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStatus('idle');
    setError(null);
    setScanResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleScan = async () => {
    if (!file) return;
    setStatus('scanning');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/ocr', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Error al procesar imagen');

      setScanResult(data.data as OcrResult);
      setSavedImageUrl(data.imageUrl as string);
      setStatus('results');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleReset = () => {
    setPreview(null);
    setFile(null);
    setStatus('idle');
    setError(null);
    setScanResult(null);
    setSavedImageUrl(null);
  };

  const handleSaveExpense = () => {
    if (scanResult && savedImageUrl) {
      onResult(scanResult, savedImageUrl);
    }
  };

  const cat = scanResult ? getCategoryById(scanResult.category) : null;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-600/20 rounded-xl flex items-center justify-center">
            <Scan size={17} className="text-primary" />
          </div>
          <div>
            <h3 className="text-foreground font-semibold text-sm">Escáner OCR</h3>
            <p className="text-xs text-muted/70">Gemini 2.5 Flash</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === 'results' && (
            <button
              onClick={handleReset}
              className="text-xs text-muted hover:text-foreground px-2 py-1 rounded hover:bg-hover-overlay"
            >
              Nuevo escaneo
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="text-muted hover:text-foreground p-1">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* === RESULTS VIEW (split layout) === */}
      {status === 'results' && scanResult ? (
        <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">

          {/* LEFT: Raw OCR Text */}
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={15} className="text-muted" />
              <h4 className="text-sm font-semibold text-foreground">Texto detectado</h4>
              <div className="ml-auto flex items-center gap-1.5">
                {/* Method badge */}
                {scanResult.modelUsed === 'local-ocr' && (
                  <span title="Sin IA — procesado con Tesseract local (sin límites)"
                    className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    OCR Local ⚡
                  </span>
                )}
                {scanResult.modelUsed === 'manual' && (
                  <span className="text-xs bg-slate-500/20 text-slate-400 border border-slate-500/30 px-2 py-0.5 rounded-full">
                    Sin datos — completar manualmente
                  </span>
                )}
                {scanResult.modelUsed && !['local-ocr','manual'].includes(scanResult.modelUsed) && (
                  <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">
                    {scanResult.modelUsed} ✦
                  </span>
                )}
                {/* Confidence */}
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  scanResult.confidence >= 0.8
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : scanResult.confidence >= 0.5
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}>
                  {Math.round(scanResult.confidence * 100)}% precisión
                </span>
              </div>
            </div>

            {/* Receipt image thumbnail */}
            {preview && (
              <img
                src={preview}
                alt="Receipt"
                className="w-full max-h-40 object-contain bg-surface rounded-xl border border-border"
              />
            )}

            {/* Raw text block */}
            <div className="bg-background border border-border rounded-xl p-4 max-h-72 overflow-y-auto w-full custom-scrollbar">
              <pre className="font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                {scanResult.rawText || 'No se pudo extraer texto adicional'}
              </pre>
            </div>
          </div>

          {/* RIGHT: Structured Extracted Data */}
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={15} className="text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Datos extraídos</h4>
            </div>

            {/* Merchant & Description */}
            <div className="bg-surface rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <ShoppingBag size={15} className="text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted/70 mb-0.5">Comercio</p>
                  <p className="text-sm text-foreground font-medium">{scanResult.merchant || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Tag size={15} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted/70 mb-0.5">Descripción</p>
                  <p className="text-sm text-foreground">{scanResult.description || '—'}</p>
                </div>
              </div>
            </div>

            {/* Date, Total, Category */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-surface rounded-xl p-3 text-center">
                <Calendar size={14} className="text-amber-400 mx-auto mb-1" />
                <p className="text-xs text-muted/70">Fecha</p>
                <p className="text-xs text-foreground font-medium mt-0.5">
                  {scanResult.date
                    ? format(new Date(scanResult.date), 'dd MMM', { locale: es })
                    : '—'}
                </p>
              </div>
              <div className="bg-surface rounded-xl p-3 text-center">
                <DollarSign size={14} className="text-emerald-400 mx-auto mb-1" />
                <p className="text-xs text-muted/70">Total</p>
                <p className="text-xs text-foreground font-medium mt-0.5">
                  {formatCurrency(scanResult.total, scanResult.currency)}
                </p>
              </div>
              <div className="bg-surface rounded-xl p-3 text-center">
                <span className="text-xl block mb-1">{cat?.icon}</span>
                <p className="text-xs text-muted/70">Categoría</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: cat?.color }}>
                  {cat?.label}
                </p>
              </div>
            </div>

            {/* Tax breakdown */}
            {(scanResult.subtotal || scanResult.tax) && (
              <div className="bg-surface rounded-xl px-4 py-3 space-y-1.5">
                {scanResult.subtotal != null && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted/70">Subtotal</span>
                    <span className="text-foreground">{formatCurrency(scanResult.subtotal, scanResult.currency)}</span>
                  </div>
                )}
                {scanResult.tax != null && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted/70">IVA / Impuesto</span>
                    <span className="text-foreground">{formatCurrency(scanResult.tax, scanResult.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs border-t border-border pt-1.5 mt-1">
                  <span className="text-foreground font-semibold">Total</span>
                  <span className="text-foreground font-semibold">{formatCurrency(scanResult.total, scanResult.currency)}</span>
                </div>
              </div>
            )}

            {/* Items list */}
            {scanResult.items && scanResult.items.length > 0 && (
              <div className="bg-surface rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
                  <List size={13} className="text-muted" />
                  <span className="text-xs text-muted/70 font-medium">Productos ({scanResult.items.length})</span>
                </div>
                <div className="max-h-36 overflow-y-auto custom-scrollbar divide-y divide-border/50">
                  {scanResult.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.quantity && item.quantity > 1 && (
                          <span className="text-xs text-primary bg-purple-500/10 px-1.5 rounded flex-shrink-0">
                            x{item.quantity}
                          </span>
                        )}
                        <span className="text-xs text-foreground truncate">{item.description}</span>
                      </div>
                      <span className="text-xs text-foreground font-medium flex-shrink-0 ml-2">
                        {formatCurrency(item.amount, scanResult.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save button */}
            <button
              onClick={handleSaveExpense}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl transition-all text-sm"
            >
              <Save size={15} />
              Guardar como gasto
            </button>
          </div>
        </div>
      ) : (
        /* === UPLOAD / SCANNING VIEW === */
        <div className="p-5 space-y-4">
          {/* Drop Zone */}
          {!preview ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragActive
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-border hover:border-purple-500/50 hover:bg-hover-overlay/50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-surface rounded-full flex items-center justify-center">
                  <Upload size={24} className="text-primary" />
                </div>
                <div>
                  <p className="text-foreground font-medium">
                    {isDragActive ? 'Suelta la imagen aquí' : 'Arrastra o haz clic para subir'}
                  </p>
                  <p className="text-xs text-muted/70 mt-1">JPG, PNG, WEBP — máximo 10MB</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <img
                src={preview}
                alt="Receipt preview"
                className="w-full max-h-64 object-contain rounded-xl bg-surface border border-border"
              />
              <button
                onClick={handleReset}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-red-500/80 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={14} className="text-white" />
              </button>
              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full">
                <ImageIcon size={11} className="text-slate-300" />
                <span className="text-xs text-slate-300 max-w-[160px] truncate">{file?.name}</span>
              </div>
            </div>
          )}

          {/* Error message */}
          {status === 'error' && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Scan Button */}
          <button
            onClick={handleScan}
            disabled={!file || status === 'scanning'}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-150 text-sm"
          >
            {status === 'scanning' ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Analizando con Gemini...
              </>
            ) : (
              <>
                <Scan size={15} />
                Escanear con Gemini 2.5 Flash
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
