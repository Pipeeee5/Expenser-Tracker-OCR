'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import OCRScanner from '@/components/OCRScanner';
import ExpenseModal from '@/components/ExpenseModal';
import { getCategoryById, CATEGORIES } from '@/lib/categories';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { OcrResult } from '@/lib/gemini';
import { Plus, Scan, Trash2, Edit, Search, Filter, X } from 'lucide-react';
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

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const [y, m] = monthFilter.split('-');
      const params = new URLSearchParams({ year: y, month: m });
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      const res = await fetch(`/api/expenses?${params}`);
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
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
            <h1 className="text-2xl font-bold text-white">Gastos</h1>
            <p className="text-slate-400 text-sm">{filtered.length} transacciones · {formatCurrency(total)}</p>
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
        <OCRScanner onResult={handleOcrResult} />

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-[#1a1a2e] border border-[#2a2a45] rounded-lg px-3 py-2 flex-1 min-w-[180px]">
            <Search size={15} className="text-slate-500" />
            <input
              type="text"
              placeholder="Buscar gastos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-white placeholder-slate-500 flex-1 outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X size={14} className="text-slate-500" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 bg-[#1a1a2e] border border-[#2a2a45] rounded-lg px-3 py-2">
            <Filter size={14} className="text-slate-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-sm text-slate-300 outline-none"
            >
              <option value="all">Todas las categorías</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>

          <div className="bg-[#1a1a2e] border border-[#2a2a45] rounded-lg px-3 py-2">
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-transparent text-sm text-slate-300 outline-none"
            />
          </div>
        </div>

        {/* Expense List */}
        <div className="bg-[#1a1a2e] border border-[#2a2a45] rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-[#13131f] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🧾</p>
              <p className="text-white font-medium">Sin gastos encontrados</p>
              <p className="text-slate-500 text-sm mt-1 mb-6">
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
              <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2 text-xs text-slate-500 border-b border-[#2a2a45]">
                <span>Descripción</span>
                <span>Categoría</span>
                <span>Fecha</span>
                <span className="text-right">Monto</span>
                <span></span>
              </div>
              <div className="divide-y divide-[#2a2a45]/50">
                {filtered.map((e) => {
                  const cat = getCategoryById(e.category);
                  return (
                    <div
                      key={e.id}
                      className="flex items-center gap-3 sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:gap-4 px-4 py-3 hover:bg-white/2 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${cat.color}20` }}
                        >
                          {cat.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium truncate">{e.description}</p>
                          {e.merchant && <p className="text-xs text-slate-500 truncate">{e.merchant}</p>}
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
                      <span className="hidden sm:block text-xs text-slate-400">{formatDate(e.date)}</span>
                      <p className="text-sm font-semibold text-white sm:text-right ml-auto sm:ml-0">
                        {formatCurrency(e.amount, e.currency)}
                      </p>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(e)}
                          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Footer total */}
              <div className="flex justify-end items-center gap-4 px-4 py-3 border-t border-[#2a2a45] bg-[#13131f]">
                <span className="text-sm text-slate-400">Total:</span>
                <span className="text-base font-bold text-white">{formatCurrency(total)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <ExpenseModal
          onClose={handleModalClose}
          onSaved={loadExpenses}
          ocrData={ocrData}
          ocrImageUrl={ocrImageUrl}
          editExpense={editExpense}
        />
      )}
    </DashboardLayout>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a14]" />}>
      <ExpensesContent />
    </Suspense>
  );
}
