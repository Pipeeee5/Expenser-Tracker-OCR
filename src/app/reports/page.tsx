'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import CategoryPieChart from '@/components/charts/CategoryPieChart';
import ExpenseBarChart from '@/components/charts/ExpenseBarChart';
import { getCategoryById, CATEGORIES } from '@/lib/categories';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportToCSV, exportToPDF } from '@/lib/export';
import { Download, FileText, Filter, Loader2 } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  merchant?: string | null;
  date: string;
  currency: string;
}

interface ReportSummary {
  total: number;
  count: number;
  average: number;
  byCategory: Array<{ id: string; label: string; amount: number; color: string; percentage: number; count: number }>;
  byMonth: Array<{ month: string; amount: number }>;
}

export default function ReportsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  const defaultStart = format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd');
  const defaultEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [customCategories, setCustomCategories] = useState<any[]>([]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      const [res, catRes] = await Promise.all([
        fetch(`/api/reports?${params}`),
        fetch('/api/categories')
      ]);
      const data = await res.json();
      const catData = await catRes.json();
      setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
      setSummary(data.summary || null);
      setCustomCategories(Array.isArray(catData) ? catData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, categoryFilter]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExportCSV = async () => {
    setExporting('csv');
    try {
      exportToCSV(expenses, `reporte_gastos_${startDate}_${endDate}.csv`);
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    setExporting('pdf');
    try {
      await exportToPDF(
        expenses,
        `Reporte de Gastos — ${startDate} al ${endDate}`,
        `reporte_gastos_${startDate}_${endDate}.pdf`
      );
    } finally {
      setExporting(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reportes Fiscales</h1>
            <p className="text-muted text-sm">Exporta tus gastos para declaración de impuestos</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              disabled={exporting !== null || expenses.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-sm font-medium rounded-lg transition-all disabled:opacity-50"
            >
              {exporting === 'csv' ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              CSV
            </button>
            <button
              onClick={handleExportPDF}
              disabled={exporting !== null || expenses.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-sm font-medium rounded-lg transition-all disabled:opacity-50"
            >
              {exporting === 'pdf' ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
              PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted" />
            <span className="text-xs text-muted">Filtros:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted/80">Desde:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-surface border border-border rounded-lg px-2 py-1 text-xs text-muted/80 outline-none focus:border-purple-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted/80">Hasta:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-surface border border-border rounded-lg px-2 py-1 text-xs text-muted/80 outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-surface border border-border rounded-lg px-2 py-1 text-xs text-muted/80 outline-none focus:border-purple-500"
            >
              <option value="all">Todas las categorías</option>
              {[...CATEGORIES.slice(0, -1), ...customCategories, CATEGORIES[CATEGORIES.length - 1]].map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{formatCurrency(summary?.total ?? 0)}</p>
            <p className="text-xs text-muted/70 mt-1">Total gastado</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{summary?.count ?? 0}</p>
            <p className="text-xs text-muted/70 mt-1">Transacciones</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{formatCurrency(summary?.average ?? 0)}</p>
            <p className="text-xs text-muted/70 mt-1">Promedio por gasto</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-foreground font-semibold mb-4">Gastos por mes</h2>
            {summary?.byMonth && summary.byMonth.length > 0 ? (
              <ExpenseBarChart
                data={summary.byMonth.map((d) => ({
                  month: format(new Date(d.month + '-01'), 'MMM yyyy'),
                  amount: d.amount,
                }))}
              />
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted/70 text-sm">Sin datos</div>
            )}
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-foreground font-semibold mb-4">Distribución por categoría</h2>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <CategoryPieChart data={summary?.byCategory ?? []} />
              </div>
              <div className="flex-1 space-y-1.5 min-w-0">
                {(summary?.byCategory ?? []).map((cat) => (
                  <div key={cat.id} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                    <span className="text-xs text-muted flex-1 truncate">{cat.label}</span>
                    <span className="text-xs text-foreground">{formatCurrency(cat.amount)}</span>
                    <span className="text-xs text-muted/70 w-10 text-right">{cat.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown Table */}
        {summary && summary.byCategory.length > 0 && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-foreground font-semibold">Resumen por categoría</h2>
            </div>
            <div className="divide-y divide-border/50">
              {summary.byCategory.map((cat) => {
                const catInfo = getCategoryById(cat.id, customCategories);
                return (
                  <div key={cat.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="text-xl">{catInfo.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-foreground font-medium">{cat.label}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted/70">{cat.count} gastos</span>
                          <span className="text-sm font-semibold text-foreground">{formatCurrency(cat.amount)}</span>
                          <span className="text-xs text-muted w-12 text-right">{cat.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-border rounded-full h-1">
                        <div
                          className="h-1 rounded-full"
                          style={{ width: `${cat.percentage}%`, background: cat.color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center px-5 py-3 bg-surface border-t border-border">
              <span className="text-sm text-muted">Total</span>
              <span className="text-base font-bold text-foreground">{formatCurrency(summary.total)}</span>
            </div>
          </div>
        )}

        {/* Expense Detail Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-foreground font-semibold">Detalle de gastos</h2>
            <span className="text-xs text-muted/70">{expenses.length} registros</span>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-surface rounded animate-pulse" />)}
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12 text-muted/70">Sin gastos en el período seleccionado</div>
          ) : (
            <>
              <div className="hidden sm:grid grid-cols-[1fr_2fr_1fr_1fr_1fr] gap-4 px-5 py-2 text-xs text-muted/70 bg-surface">
                <span>Fecha</span>
                <span>Descripción</span>
                <span>Categoría</span>
                <span>Comercio</span>
                <span className="text-right">Monto</span>
              </div>
              <div className="divide-y divide-border/30 max-h-96 overflow-y-auto">
                {expenses.map((e) => {
                  const cat = getCategoryById(e.category, customCategories);
                  return (
                    <div key={e.id} className="hidden sm:grid grid-cols-[1fr_2fr_1fr_1fr_1fr] gap-4 px-5 py-2.5 hover:bg-hover-overlay text-sm transition-colors">
                      <span className="text-muted/80 text-xs">{formatDate(e.date)}</span>
                      <span className="text-foreground truncate">{e.description}</span>
                      <span className="text-xs" style={{ color: cat.color }}>{cat.icon} {cat.label}</span>
                      <span className="text-muted/80 truncate text-xs">{e.merchant ?? '-'}</span>
                      <span className="text-foreground font-medium text-right">{formatCurrency(e.amount, e.currency)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end px-5 py-3 border-t border-border bg-surface">
                <span className="text-base font-bold text-foreground">{formatCurrency(summary?.total ?? 0)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
