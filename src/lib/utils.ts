import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatCurrency(amount: number, currency = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy', { locale: es });
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM/yyyy');
}

export function getCurrentMonthRange() {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

export function getMonthName(month: number, year: number): string {
  const date = new Date(year, month - 1, 1);
  return format(date, 'MMMM yyyy', { locale: es });
}

export function clsx(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getBudgetStatus(spent: number, budget: number, alertAt = 80) {
  const percentage = (spent / budget) * 100;
  if (percentage >= 100) return { status: 'exceeded', color: 'text-red-400', bgColor: 'bg-red-500' };
  if (percentage >= alertAt) return { status: 'warning', color: 'text-amber-400', bgColor: 'bg-amber-500' };
  return { status: 'ok', color: 'text-emerald-400', bgColor: 'bg-emerald-500' };
}
