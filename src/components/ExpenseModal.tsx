'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { CATEGORIES, Category } from '@/lib/categories';
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
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setCustomCategories(data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (ocrData) {
      // Validate date format (YYYY-MM-DD), fallback to today if invalid
      const isValidDate = ocrData.date && /^\\d{4}-\\d{2}-\\d{2}$/.test(ocrData.date);
      const safeDate = isValidDate ? ocrData.date : format(new Date(), 'yyyy-MM-dd');

      // Ensure amount is a clean string representing a valid float
      let cleanAmount = '';
      if (ocrData.total) {
        const numAmount = typeof ocrData.total === 'string' 
          ? parseFloat(ocrData.total) 
          : ocrData.total;
        cleanAmount = isNaN(numAmount) ? '' : String(numAmount);
      }

      setForm({
        amount: cleanAmount,
        category: ocrData.category ?? 'other',
        description: ocrData.description ?? ocrData.items?.[0]?.description ?? 'Compra',
        merchant: ocrData.merchant ?? '',
        date: safeDate,
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

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newCatName.trim() }),
      });
      if (!res.ok) throw new Error('Error creating category');
      const data = await res.json();
      setCustomCategories([...customCategories, data]);
      setForm({ ...form, category: data.id });
      setNewCatName('');
      setShowNewCat(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingCat(false);
    }
  };

  const allCategories = [...CATEGORIES.slice(0, -1), ...customCategories, CATEGORIES[CATEGORIES.length - 1]];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-foreground font-semibold text-lg">
            {editExpense ? 'Editar Gasto' : 'Nuevo Gasto'}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* OCR Image Preview */}
          {ocrImageUrl && (
            <img
              src={ocrImageUrl}
              alt="Receipt"
              className="w-full h-32 object-contain bg-surface rounded-xl border border-border"
            />
          )}

          {/* Amount + Currency */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-muted mb-1">Monto *</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-input-bg border border-border focus:border-purple-500 rounded-lg px-3 py-2 text-foreground text-sm outline-none"
                placeholder="0.00"
              />
            </div>
            <div className="w-24">
              <label className="block text-xs text-muted mb-1">Moneda</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full bg-input-bg border border-border focus:border-purple-500 rounded-lg px-3 py-2 text-foreground text-sm outline-none"
              >
                <option value="CLP">CLP $</option>
                <option value="USD">USD $</option>
                <option value="EUR">EUR €</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-muted mb-1">Descripción *</label>
            <input
              type="text"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-input-bg border border-border focus:border-purple-500 rounded-lg px-3 py-2 text-foreground text-sm outline-none"
              placeholder="Ej: Comida en restaurante"
            />
          </div>

          {/* Merchant */}
          <div>
            <label className="block text-xs text-muted mb-1">Comercio</label>
            <input
              type="text"
              value={form.merchant}
              onChange={(e) => setForm({ ...form, merchant: e.target.value })}
              className="w-full bg-input-bg border border-border focus:border-purple-500 rounded-lg px-3 py-2 text-foreground text-sm outline-none"
              placeholder="Ej: OXXO, Walmart"
            />
          </div>

          {/* Category */}
          <div>
            <div className="flex justify-between items-end mb-1">
              <label className="block text-xs text-muted">Categoría *</label>
              <button 
                type="button" 
                onClick={() => setShowNewCat(!showNewCat)} 
                className="text-xs text-primary hover:text-primary-light transition-colors"
              >
                {showNewCat ? 'Cerrar' : '+ Nueva Categoría'}
              </button>
            </div>
            
            {showNewCat && (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Nombre de la nueva categoría..."
                  className="flex-1 bg-input-bg border border-border focus:border-purple-500 rounded-lg px-3 py-1.5 text-foreground text-sm outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateCategory())}
                />
                <button
                  type="button"
                  disabled={creatingCat || !newCatName.trim()}
                  onClick={handleCreateCategory}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
                >
                  {creatingCat ? '...' : 'Añadir'}
                </button>
              </div>
            )}

            <div className="grid grid-cols-5 gap-1.5 h-32 overflow-y-auto pr-1 custom-scrollbar">
              {allCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat.id })}
                  title={cat.label}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-all ${
                    form.category === cat.id
                      ? 'bg-purple-600/30 border border-purple-500/60 text-foreground'
                      : 'bg-surface border border-border text-muted hover:border-muted/50'
                  }`}
                >
                  <span className="text-lg leading-none">{cat.icon}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-primary mt-2">
              {allCategories.find((c) => c.id === form.category)?.label}
            </p>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs text-muted mb-1">Fecha *</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full bg-input-bg border border-border focus:border-purple-500 rounded-lg px-3 py-2 text-foreground text-sm outline-none"
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
              className="flex-1 px-4 py-2.5 bg-hover-overlay hover:bg-hover-overlay/80 text-foreground rounded-xl text-sm font-medium transition-colors"
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
