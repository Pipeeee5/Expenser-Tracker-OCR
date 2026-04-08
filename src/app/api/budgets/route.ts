import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const now = new Date();
    const m = month ? parseInt(month) : now.getMonth() + 1;
    const y = year ? parseInt(year) : now.getFullYear();

    const budgets = await prisma.budget.findMany({
      where: { month: m, year: y },
      orderBy: { category: 'asc' },
    });

    // Get current spending for each budget category
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const expensesByCategory = await prisma.expense.groupBy({
      by: ['category'],
      where: { date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    });

    const spendingMap: Record<string, number> = {};
    expensesByCategory.forEach((e) => {
      spendingMap[e.category] = e._sum.amount ?? 0;
    });

    const enrichedBudgets = budgets.map((b) => ({
      ...b,
      spent: spendingMap[b.category] ?? 0,
      percentage: ((spendingMap[b.category] ?? 0) / b.amount) * 100,
    }));

    return NextResponse.json(enrichedBudgets);
  } catch (error) {
    console.error('GET /api/budgets error:', error);
    return NextResponse.json({ error: 'Error al obtener presupuestos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, amount, month, year, alertAt, currency } = body;

    if (!category || !amount || !month || !year) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const budget = await prisma.budget.upsert({
      where: { category_month_year: { category, month: parseInt(month), year: parseInt(year) } },
      update: { amount: parseFloat(amount), alertAt: alertAt ?? 80 },
      create: {
        category,
        amount: parseFloat(amount),
        month: parseInt(month),
        year: parseInt(year),
        alertAt: alertAt ?? 80,
        currency: currency ?? 'MXN',
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error('POST /api/budgets error:', error);
    return NextResponse.json({ error: 'Error al crear presupuesto' }, { status: 500 });
  }
}
