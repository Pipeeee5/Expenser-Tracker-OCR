'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { CATEGORIES, Category } from '@/lib/categories';
import { getMonthName } from '@/lib/utils';

interface BudgetModalProps {
  onClose: () => void;
  onSaved: () => void;
  month: number;
  year: number;
  editBudget?: {
    id: string;
    category: string;
    amount: number;
    alertAt: number;
  };
}

export default function BudgetModal({ onClose, onSaved, month, year, editBudget }: BudgetModalProps) {
  const [form, setForm] = useState({
    category: editBudget?.category ?? 'food',
    amount: editBudget ? String(editBudget.amount) : '',
    alertAt: editBudget ? String(editBudget.alertAt) : '80',
    currency: 'CLP',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setCustomCategories(data);
    }).catch(console.error);
  }, []);

  const allCategories = [...CATEGORIES.slice(0, -1), ...customCategories, CATEGORIES[CATEGORIES.length - 1]];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editBudget ? `/api/budgets/${editBudget.id}` : '/api/budgets';
      const method = editBudget ? 'PUT' : 'POST';
      const payload = editBudget
        ? { amount: parseFloat(form.amount), alertAt: parseFloat(form.alertAt) }
        : { category: form.category, amount: parseFloat(form.amount), alertAt: parseFloat(form.alertAt), month, year };

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
      setError(err instanceof Error ? err.message : 'Error al guardar presupuesto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-foreground font-semibold text-lg">
              {editBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
            </h2>
            <p className="text-xs text-muted/70">{getMonthName(month, year)}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category */}
          {!editBudget && (
            <div>
              <label className="block text-xs text-muted mb-2">Categoría *</label>
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
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs text-muted mb-1">Monto límite *</label>
            <input
              type="number"
              step="0.01"
              required
              min="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full bg-input-bg border border-border focus:border-purple-500 rounded-lg px-3 py-2 text-foreground text-sm outline-none"
              placeholder="0.00"
            />
          </div>

          {/* Alert threshold */}
          <div>
            <label className="block text-xs text-muted mb-1">
              Alertar al {form.alertAt}% del límite
            </label>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={form.alertAt}
              onChange={(e) => setForm({ ...form, alertAt: e.target.value })}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-muted/70 mt-1">
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
          )}

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
