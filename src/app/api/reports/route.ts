import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCategoryById } from '@/lib/categories';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');

    const where: Record<string, unknown> = {};

    if (startDate && endDate) {
      where.date = { gte: new Date(startDate), lte: new Date(endDate) };
    }
    if (category && category !== 'all') {
      where.category = category;
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const total = expenses.reduce((acc, e) => acc + e.amount, 0);

    const byCategory: Record<string, { amount: number; count: number; label: string; color: string }> = {};
    expenses.forEach((e) => {
      const cat = getCategoryById(e.category);
      if (!byCategory[e.category]) {
        byCategory[e.category] = { amount: 0, count: 0, label: cat.label, color: cat.color };
      }
      byCategory[e.category].amount += e.amount;
      byCategory[e.category].count += 1;
    });

    // Monthly trend
    const byMonth: Record<string, number> = {};
    expenses.forEach((e) => {
      const key = `${new Date(e.date).getFullYear()}-${String(new Date(e.date).getMonth() + 1).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] ?? 0) + e.amount;
    });

    return NextResponse.json({
      expenses,
      summary: {
        total,
        count: expenses.length,
        average: expenses.length > 0 ? total / expenses.length : 0,
        byCategory: Object.entries(byCategory)
          .map(([id, data]) => ({ id, ...data, percentage: (data.amount / total) * 100 }))
          .sort((a, b) => b.amount - a.amount),
        byMonth: Object.entries(byMonth)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, amount]) => ({ month, amount })),
      },
    });
  } catch (error) {
    console.error('GET /api/reports error:', error);
    return NextResponse.json({ error: 'Error al generar reporte' }, { status: 500 });
  }
}
