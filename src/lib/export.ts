import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCategoryById } from './categories';
import { formatCurrency } from './utils';

export interface ExportExpense {
  id: string;
  amount: number;
  category: string;
  description: string;
  merchant?: string | null;
  date: string | Date;
  currency: string;
}

export function exportToCSV(expenses: ExportExpense[], filename?: string): void {
  const headers = ['Fecha', 'Descripción', 'Comercio', 'Categoría', 'Monto', 'Moneda'];

  const rows = expenses.map((e) => {
    const cat = getCategoryById(e.category);
    const date = typeof e.date === 'string' ? new Date(e.date) : e.date;
    return [
      format(date, 'dd/MM/yyyy'),
      `"${e.description.replace(/"/g, '""')}"`,
      `"${(e.merchant ?? '').replace(/"/g, '""')}"`,
      cat.label,
      e.amount.toFixed(2),
      e.currency,
    ];
  });

  const total = expenses.reduce((acc, e) => acc + e.amount, 0);

  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.join(',')),
    '',
    `Total,,,, ${total.toFixed(2)},`,
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ?? `gastos_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportToPDF(
  expenses: ExportExpense[],
  title = 'Reporte de Gastos',
  filename?: string
): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ExpenserTracker', 14, 18);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 30);

  doc.setTextColor(180, 180, 180);
  doc.setFontSize(10);
  doc.text(`Generado el ${format(new Date(), "dd 'de' MMMM yyyy", { locale: es })}`, pageWidth - 14, 30, { align: 'right' });

  // Summary
  const total = expenses.reduce((acc, e) => acc + e.amount, 0);
  const byCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
  });

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen', 14, 56);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de gastos: ${expenses.length} transacciones`, 14, 66);
  doc.text(`Monto total: ${formatCurrency(total, expenses[0]?.currency ?? 'MXN')}`, 14, 74);

  // Category breakdown
  let yPos = 90;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Por Categoría', 14, yPos);
  yPos += 8;

  Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .forEach(([cat, amount]) => {
      const category = getCategoryById(cat);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${category.icon} ${category.label}:`, 20, yPos);
      doc.text(formatCurrency(amount, expenses[0]?.currency ?? 'MXN'), pageWidth - 14, yPos, { align: 'right' });
      yPos += 7;
    });

  // Expense table
  autoTable(doc, {
    startY: yPos + 10,
    head: [['Fecha', 'Descripción', 'Comercio', 'Categoría', 'Monto']],
    body: expenses.map((e) => {
      const cat = getCategoryById(e.category);
      const date = typeof e.date === 'string' ? new Date(e.date) : e.date;
      return [
        format(date, 'dd/MM/yyyy'),
        e.description,
        e.merchant ?? '-',
        `${cat.icon} ${cat.label}`,
        formatCurrency(e.amount, e.currency),
      ];
    }),
    foot: [['', '', '', 'TOTAL', formatCurrency(total, expenses[0]?.currency ?? 'MXN')]],
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [245, 245, 255], textColor: [50, 50, 50], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 255] },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: { 4: { halign: 'right' } },
  });

  doc.save(filename ?? `reporte_gastos_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
