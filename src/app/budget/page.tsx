'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import BudgetModal from '@/components/BudgetModal';
import { getCategoryById } from '@/lib/categories';
import { formatCurrency, getBudgetStatus, getMonthName } from '@/lib/utils';
import { Plus, Trash2, Edit, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface Budget {
  id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
  alertAt: number;
  spent: number;
  percentage: number;
}

export default function BudgetPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | undefined>();

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/budgets?month=${month}&year=${year}`);
      const data = await res.json();
      setBudgets(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este presupuesto?')) return;
    await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
    loadBudgets();
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const totalBudget = budgets.reduce((a, b) => a + b.amount, 0);
  const totalSpent = budgets.reduce((a, b) => a + b.spent, 0);
  const alerts = budgets.filter((b) => b.percentage >= b.alertAt);
  const overBudget = budgets.filter((b) => b.percentage >= 100);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Presupuesto</h1>
            <p className="text-slate-400 text-sm">Control de gastos por categoría</p>
          </div>
          <button
            onClick={() => { setEditBudget(undefined); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium rounded-lg transition-all"
          >
            <Plus size={16} /> Nuevo presupuesto
          </button>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between bg-[#1a1a2e] border border-[#2a2a45] rounded-xl px-4 py-3">
          <button onClick={prevMonth} className="text-slate-400 hover:text-white p-1">
            <ChevronLeft size={20} />
          </button>
          <span className="text-white font-semibold capitalize">{getMonthName(month, year)}</span>
          <button onClick={nextMonth} className="text-slate-400 hover:text-white p-1">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#1a1a2e] border border-[#2a2a45] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{formatCurrency(totalBudget)}</p>
            <p className="text-xs text-slate-500 mt-1">Presupuesto total</p>
          </div>
          <div className="bg-[#1a1a2e] border border-[#2a2a45] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{formatCurrency(totalSpent)}</p>
            <p className="text-xs text-slate-500 mt-1">Total gastado</p>
          </div>
          <div className="bg-[#1a1a2e] border border-[#2a2a45] rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${totalBudget - totalSpent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(Math.abs(totalBudget - totalSpent))}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {totalBudget - totalSpent >= 0 ? 'Disponible' : 'Excedido'}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {overBudget.map((b) => {
              const cat = getCategoryById(b.category);
              return (
                <div key={b.id} className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-300">
                    <strong>{cat.label}</strong> — Presupuesto excedido: {formatCurrency(b.spent)} de {formatCurrency(b.amount)} ({b.percentage.toFixed(0)}%)
                  </p>
                </div>
              );
            })}
            {alerts.filter((b) => b.percentage < 100).map((b) => {
              const cat = getCategoryById(b.category);
              return (
                <div key={b.id} className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                  <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />
                  <p className="text-sm text-amber-300">
                    <strong>{cat.label}</strong> — {b.percentage.toFixed(0)}% del presupuesto utilizado (alerta al {b.alertAt}%)
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Budget List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-[#1a1a2e] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-16 bg-[#1a1a2e] border border-[#2a2a45] rounded-xl">
            <p className="text-4xl mb-3">💰</p>
            <p className="text-white font-medium">Sin presupuestos configurados</p>
            <p className="text-slate-500 text-sm mt-1 mb-4">Agrega límites de gasto por categoría</p>
            <button
              onClick={() => { setEditBudget(undefined); setShowModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
            >
              <Plus size={15} /> Agregar presupuesto
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {budgets.map((b) => {
              const cat = getCategoryById(b.category);
              const { status, color, bgColor } = getBudgetStatus(b.spent, b.amount, b.alertAt);
              const pct = Math.min(b.percentage, 100);

              return (
                <div key={b.id} className="bg-[#1a1a2e] border border-[#2a2a45] rounded-xl p-4 group hover:border-[#3a3a60] transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: `${cat.color}20` }}
                      >
                        {cat.icon}
                      </div>
                      <div>
                        <p className="text-white font-medium">{cat.label}</p>
                        <p className="text-xs text-slate-500">Alerta al {b.alertAt}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${color}`}>
                          {formatCurrency(b.spent)}
                        </p>
                        <p className="text-xs text-slate-500">de {formatCurrency(b.amount)}</p>
                      </div>
                      {status === 'ok' ? (
                        <CheckCircle size={16} className="text-emerald-400" />
                      ) : (
                        <AlertTriangle size={16} className={status === 'exceeded' ? 'text-red-400' : 'text-amber-400'} />
                      )}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditBudget(b); setShowModal(true); }}
                          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#2a2a45] rounded-full h-2">
                    <div
                      className={`${bgColor} h-2 rounded-full transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-slate-500">
                      {formatCurrency(Math.max(0, b.amount - b.spent))} disponible
                    </p>
                    <p className={`text-xs font-medium ${color}`}>
                      {b.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <BudgetModal
          onClose={() => { setShowModal(false); setEditBudget(undefined); }}
          onSaved={loadBudgets}
          month={month}
          year={year}
          editBudget={editBudget}
        />
      )}
    </DashboardLayout>
  );
}
