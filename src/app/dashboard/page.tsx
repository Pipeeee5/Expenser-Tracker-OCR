'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import CategoryPieChart from '@/components/charts/CategoryPieChart';
import ExpenseBarChart from '@/components/charts/ExpenseBarChart';
import { getCategoryById } from '@/lib/categories';
import { formatCurrency, formatDate, getBudgetStatus, getMonthName, getCurrentMonthRange } from '@/lib/utils';
import { TrendingUp, TrendingDown, Receipt, AlertTriangle, Wallet, Plus } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  merchant?: string | null;
  date: string;
  currency: string;
}

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

interface ReportSummary {
  total: number;
  count: number;
  byCategory: Array<{ id: string; label: string; amount: number; color: string; percentage: number }>;
  byMonth: Array<{ month: string; amount: number }>;
}

export default function DashboardPage() {
  const { month, year } = getCurrentMonthRange();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [customCategories, setCustomCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const [expRes, budRes, repRes, catRes] = await Promise.all([
        fetch(`/api/expenses?month=${month}&year=${year}&limit=5`),
        fetch(`/api/budgets?month=${month}&year=${year}`),
        fetch(`/api/reports?startDate=${year}-${String(month).padStart(2,'0')}-01&endDate=${year}-${String(month).padStart(2,'0')}-31`),
        fetch('/api/categories'),
      ]);
      const [expData, budData, repData, catData] = await Promise.all([expRes.json(), budRes.json(), repRes.json(), catRes.json()]);
      setExpenses(Array.isArray(expData) ? expData : []);
      setBudgets(Array.isArray(budData) ? budData : []);
      setSummary(repData.summary || null);
      setCustomCategories(Array.isArray(catData) ? catData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [month, year]);

  const getCat = (id: string) => getCategoryById(id, customCategories);

  const totalSpent = summary?.total ?? 0;
  const totalBudget = budgets.reduce((a, b) => a + b.amount, 0);
  const budgetPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const alerts = budgets.filter((b) => b.percentage >= b.alertAt);

  const monthLabel = getMonthName(month, year);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted text-sm capitalize">{monthLabel}</p>
          </div>
          <Link
            href="/expenses"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium rounded-lg transition-all"
          >
            <Plus size={16} /> Nuevo gasto
          </Link>
        </div>

        {/* Budget Alerts */}
        {alerts.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-300 font-medium text-sm">
                  {alerts.length} {alerts.length === 1 ? 'categoría alcanzó' : 'categorías alcanzaron'} el límite de alerta
                </p>
                <p className="text-amber-400/70 text-xs mt-1">
                  {alerts.map((a) => getCategoryById(a.category).label).join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Gastos del mes',
              value: formatCurrency(totalSpent),
              icon: Receipt,
              color: 'from-purple-500/20 to-indigo-500/20',
              iconColor: 'text-purple-400',
              border: 'border-purple-500/20',
              sub: `${summary?.count ?? 0} transacciones`,
            },
            {
              label: 'Presupuesto total',
              value: formatCurrency(totalBudget),
              icon: Wallet,
              color: 'from-blue-500/20 to-cyan-500/20',
              iconColor: 'text-blue-400',
              border: 'border-blue-500/20',
              sub: `${budgetPct.toFixed(0)}% utilizado`,
            },
            {
              label: 'Disponible',
              value: formatCurrency(Math.max(0, totalBudget - totalSpent)),
              icon: TrendingUp,
              color: 'from-emerald-500/20 to-teal-500/20',
              iconColor: 'text-emerald-400',
              border: 'border-emerald-500/20',
              sub: totalBudget > 0 ? `${Math.max(0, 100 - budgetPct).toFixed(0)}% restante` : 'Sin presupuesto',
            },
            {
              label: 'Categorías activas',
              value: String(summary?.byCategory.length ?? 0),
              icon: TrendingDown,
              color: 'from-amber-500/20 to-orange-500/20',
              iconColor: 'text-amber-400',
              border: 'border-amber-500/20',
              sub: `${budgets.length} presupuestos`,
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`bg-gradient-to-br ${card.color} border ${card.border} rounded-xl p-4`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted">{card.label}</p>
                <card.icon size={16} className={card.iconColor} />
              </div>
              <p className="text-xl font-bold text-foreground">{loading ? '...' : card.value}</p>
              <p className="text-xs text-muted/70 mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Monthly trend */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-foreground font-semibold mb-1">Tendencia mensual</h2>
            <p className="text-xs text-muted/70 mb-4">Últimos meses</p>
            {summary?.byMonth && summary.byMonth.length > 0 ? (
              <ExpenseBarChart
                data={summary.byMonth.map((d) => ({
                  month: format(new Date(d.month + '-01'), 'MMM'),
                  amount: d.amount,
                }))}
              />
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted/70 text-sm">
                Sin datos aún
              </div>
            )}
          </div>

          {/* Category breakdown */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-foreground font-semibold mb-1">Por categoría</h2>
            <p className="text-xs text-muted/70 mb-4">{monthLabel}</p>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <CategoryPieChart data={summary?.byCategory ?? []} />
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {(summary?.byCategory ?? []).slice(0, 5).map((cat) => (
                  <div key={cat.id} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                    <span className="text-xs text-muted truncate flex-1">{cat.label}</span>
                    <span className="text-xs text-foreground font-medium">{cat.percentage.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Budget Progress */}
        {budgets.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-foreground font-semibold">Presupuestos</h2>
              <Link href="/budget" className="text-xs text-purple-400 hover:text-purple-300">Ver todos →</Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {budgets.slice(0, 4).map((b) => {
                const cat = getCat(b.category);
                const { bgColor } = getBudgetStatus(b.spent, b.amount, b.alertAt);
                return (
                  <div key={b.id} className="bg-surface rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span className="text-sm text-foreground font-medium">{cat.label}</span>
                      </div>
                      <span className="text-xs text-muted">
                        {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                      </span>
                    </div>
                    <div className="w-full bg-border rounded-full h-1.5">
                      <div
                        className={`${bgColor} h-1.5 rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(b.percentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted/70 mt-1 text-right">{b.percentage.toFixed(0)}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Expenses */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-foreground font-semibold">Gastos recientes</h2>
            <Link href="/expenses" className="text-xs text-purple-400 hover:text-purple-300">Ver todos →</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-surface rounded-lg animate-pulse" />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted/70 text-sm">No hay gastos registrados este mes</p>
              <Link href="/expenses" className="text-purple-400 text-sm mt-2 inline-block">
                Agregar primer gasto →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((e) => {
                const cat = getCat(e.category);
                return (
                  <div key={e.id} className="flex items-center gap-3 p-3 bg-surface rounded-lg hover:bg-hover-overlay transition-colors">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
                      style={{ background: `${cat.color}20` }}
                    >
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium truncate">{e.description}</p>
                      <p className="text-xs text-muted/70">{e.merchant ?? cat.label} · {formatDate(e.date)}</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground flex-shrink-0">
                      {formatCurrency(e.amount, e.currency)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
