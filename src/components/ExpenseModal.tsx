'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { CATEGORIES } from '@/lib/categories';
import type { OcrResult } from '@/lib/gemini';
import { format } from 'date-fns';

interface ExpenseModalProps {
  onClose: () => void;
  onSaved: () => void;
  ocrData?: OcrResult;
  ocrImageUrl?: string;
  editExpense?: {
    id: string;
    amount: number;
    category: string;
    description: string;
    merchant?: string | null;
    date: string;
    currency: string;
  };
}

export default function ExpenseModal({ onClose, onSaved, ocrData, ocrImageUrl, editExpense }: ExpenseModalProps) {
  const [form, setForm] = useState({
    amount: '',
    category: 'other',
    description: '',
    merchant: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    currency: 'CLP',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ocrData) {
      setForm({
        amount: String(ocrData.total ?? ''),
        category: ocrData.category ?? 'other',
        description: ocrData.description ?? ocrData.items?.[0]?.description ?? 'Compra',
        merchant: ocrData.merchant ?? '',
        date: ocrData.date ?? format(new Date(), 'yyyy-MM-dd'),
        currency: ocrData.currency ?? 'CLP',
      });
    } else if (editExpense) {
      setForm({
        amount: String(editExpense.amount),
        category: editExpense.category,
        description: editExpense.description,
        merchant: editExpense.merchant ?? '',
        date: format(new Date(editExpense.date), 'yyyy-MM-dd'),
        currency: editExpense.currency,
      });
    }
  }, [ocrData, editExpense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        imageUrl: ocrImageUrl ?? null,
        rawOcrData: ocrData ?? null,
      };

      const url = editExpense ? `/api/expenses/${editExpense.id}` : '/api/expenses';
      const method = editExpense ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Error al guardar');
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar gasto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1a1a2e] border border-[#2a2a45] rounded-2xl shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a45]">
          <h2 className="text-white font-semibold text-lg">
            {editExpense ? 'Editar Gasto' : 'Nuevo Gasto'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* OCR Image Preview */}
          {ocrImageUrl && (
            <img
              src={ocrImageUrl}
              alt="Receipt"
              className="w-full h-32 object-contain bg-[#13131f] rounded-xl border border-[#2a2a45]"
            />
          )}

          {/* Amount + Currency */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1">Monto *</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-[#13131f] border border-[#2a2a45] focus:border-purple-500 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="0.00"
              />
            </div>
            <div className="w-24">
              <label className="block text-xs text-slate-400 mb-1">Moneda</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full bg-[#13131f] border border-[#2a2a45] focus:border-purple-500 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="CLP">CLP $</option>
                <option value="MXN">MXN $</option>
                <option value="USD">USD $</option>
                <option value="EUR">EUR €</option>
                <option value="COP">COP $</option>
                <option value="ARS">ARS $</option>
                <option value="PEN">PEN S/</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Descripción *</label>
            <input
              type="text"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-[#13131f] border border-[#2a2a45] focus:border-purple-500 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="Ej: Comida en restaurante"
            />
          </div>

          {/* Merchant */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Comercio</label>
            <input
              type="text"
              value={form.merchant}
              onChange={(e) => setForm({ ...form, merchant: e.target.value })}
              className="w-full bg-[#13131f] border border-[#2a2a45] focus:border-purple-500 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="Ej: OXXO, Walmart"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Categoría *</label>
            <div className="grid grid-cols-5 gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat.id })}
                  title={cat.label}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-all ${
                    form.category === cat.id
                      ? 'bg-purple-600/30 border border-purple-500/60 text-white'
                      : 'bg-[#13131f] border border-[#2a2a45] text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <span className="text-lg leading-none">{cat.icon}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-purple-400 mt-1">
              {CATEGORIES.find((c) => c.id === form.category)?.label}
            </p>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Fecha *</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full bg-[#13131f] border border-[#2a2a45] focus:border-purple-500 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-all"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
