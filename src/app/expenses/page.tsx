'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import OCRScanner from '@/components/OCRScanner';
import ExpenseModal from '@/components/ExpenseModal';
import { getCategoryById, CATEGORIES } from '@/lib/categories';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { OcrResult } from '@/lib/gemini';
import { Plus, Scan, Trash2, Edit, Search, Filter, X, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  merchant?: string | null;
  date: string;
  currency: string;
  imageUrl?: string | null;
}

function ExpensesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [ocrData, setOcrData] = useState<OcrResult | undefined>();
  const [ocrImageUrl, setOcrImageUrl] = useState<string | undefined>();
  const [editExpense, setEditExpense] = useState<Expense | undefined>();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'));
  const [customCategories, setCustomCategories] = useState<any[]>([]);
  const [scannerKey, setScannerKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const [y, m] = monthFilter.split('-');
      const params = new URLSearchParams({ year: y, month: m });
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      const [res, catRes] = await Promise.all([
        fetch(`/api/expenses?${params}`),
        fetch('/api/categories')
      ]);
      const data = await res.json();
      const catData = await catRes.json();
      setExpenses(Array.isArray(data) ? data : []);
      setCustomCategories(Array.isArray(catData) ? catData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [monthFilter, categoryFilter]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleOcrResult = (result: OcrResult, imageUrl: string) => {
    setOcrData(result);
    setOcrImageUrl(imageUrl);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    loadExpenses();
  };

  const handleEdit = (expense: Expense) => {
    setEditExpense(expense);
    setOcrData(undefined);
    setOcrImageUrl(undefined);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditExpense(undefined);
    setOcrData(undefined);
    setOcrImageUrl(undefined);
  };

  const handleSaved = () => {
    loadExpenses();
    setScannerKey(prev => prev + 1);
    setToast('¡Gasto creado exitosamente!');
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = expenses.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.description.toLowerCase().includes(q) ||
      (e.merchant ?? '').toLowerCase().includes(q)
    );
  });

  const total = filtered.reduce((a, e) => a + e.amount, 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gastos</h1>
            <p className="text-muted text-sm">{filtered.length} transacciones · {formatCurrency(total)}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setEditExpense(undefined); setOcrData(undefined); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium rounded-lg transition-all"
            >
              <Plus size={16} /> Nuevo gasto
            </button>
          </div>
        </div>

        {/* OCR Scanner */}
        <OCRScanner key={scannerKey} onResult={handleOcrResult} />

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 flex-1 min-w-[180px]">
            <Search size={15} className="text-muted" />
            <input
              type="text"
              placeholder="Buscar gastos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-foreground placeholder-muted/70 flex-1 outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X size={14} className="text-muted" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
            <Filter size={14} className="text-muted" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-sm text-muted/80 outline-none"
            >
              <option value="all">Todas las categorías</option>
              {[...CATEGORIES.slice(0, -1), ...customCategories, CATEGORIES[CATEGORIES.length - 1]].map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>

          <div className="bg-card border border-border rounded-lg px-3 py-2">
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-transparent text-sm text-muted/80 outline-none"
            />
          </div>
        </div>

        {/* Expense List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-surface rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🧾</p>
              <p className="text-foreground font-medium">Sin gastos encontrados</p>
              <p className="text-muted/70 text-sm mt-1 mb-6">
                {search ? 'Intenta otra búsqueda' : 'Agrega tu primer gasto o escanea un recibo'}
              </p>
              {!search && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => { setEditExpense(undefined); setOcrData(undefined); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium rounded-lg transition-all"
                  >
                    <Plus size={16} /> Ingresar manual
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2 text-xs text-muted border-b border-border">
                <span>Descripción</span>
                <span>Categoría</span>
                <span>Fecha</span>
                <span className="text-right">Monto</span>
                <span></span>
              </div>
              <div className="divide-y divide-border/50">
                {filtered.map((e) => {
                  const cat = getCategoryById(e.category, customCategories);
                  return (
                    <div
                      key={e.id}
                      className="flex items-center gap-3 sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:gap-4 px-4 py-3 hover:bg-hover-overlay transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${cat.color}20` }}
                        >
                          {cat.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-foreground font-medium truncate">{e.description}</p>
                            {e.imageUrl && (
                              <button
                                onClick={() => setViewingImage(e.imageUrl!)}
                                className="flex-shrink-0 text-primary hover:text-primary-light transition-colors"
                                title="Ver boleta adjunta"
                              >
                                <ImageIcon size={14} />
                              </button>
                            )}
                          </div>
                          {e.merchant && <p className="text-xs text-muted/70 truncate">{e.merchant}</p>}
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <span
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                          style={{ background: `${cat.color}20`, color: cat.color }}
                        >
                          {cat.label}
                        </span>
                      </div>
                      <span className="hidden sm:block text-xs text-muted/80">{formatDate(e.date)}</span>
                      <p className="text-sm font-semibold text-foreground sm:text-right ml-auto sm:ml-0">
                        {formatCurrency(e.amount, e.currency)}
                      </p>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(e)}
                          className="p-1.5 rounded text-muted hover:text-foreground hover:bg-hover-overlay"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="p-1.5 rounded text-muted hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Footer total */}
              <div className="flex justify-end items-center gap-4 px-4 py-3 border-t border-border bg-surface">
                <span className="text-sm text-muted">Total:</span>
                <span className="text-base font-bold text-foreground">{formatCurrency(total)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <ExpenseModal
          onClose={handleModalClose}
          onSaved={handleSaved}
          ocrData={ocrData}
          ocrImageUrl={ocrImageUrl}
          editExpense={editExpense}
        />
      )}

      {/* Image Modal */}
      {viewingImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setViewingImage(null)} />
          <div className="relative max-w-3xl w-full max-h-[85vh] flex flex-col bg-card border border-border rounded-2xl shadow-2xl animate-fade-in overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-border bg-surface">
              <h3 className="text-foreground font-semibold">Boleta Adjunta</h3>
              <button onClick={() => setViewingImage(null)} className="text-muted hover:text-foreground p-1"><X size={18}/></button>
            </div>
            <div className="p-4 overflow-auto flex justify-center items-center bg-background min-h-[300px]">
              <img src={viewingImage} alt="Recibo" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl shadow-lg backdrop-blur-md">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ExpensesContent />
    </Suspense>
  );
}
