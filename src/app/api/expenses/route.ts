import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { autoDetectCategory } from '@/lib/categories';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit');

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      where.date = {
        gte: new Date(y, m - 1, 1),
        lte: new Date(y, m, 0, 23, 59, 59),
      };
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      ...(limit ? { take: parseInt(limit) } : {}),
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('GET /api/expenses error:', error);
    return NextResponse.json({ error: 'Error al obtener gastos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, category, description, merchant, date, imageUrl, rawOcrData, currency } = body;

    if (!amount || !description || !date) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const detectedCategory = category ?? autoDetectCategory(`${merchant ?? ''} ${description}`);

    const expense = await prisma.expense.create({
      data: {
        userId: session.user.id,
        amount: parseFloat(amount),
        category: detectedCategory,
        description,
        merchant: merchant ?? null,
        date: new Date(date),
        imageUrl: imageUrl ?? null,
        rawOcrData: rawOcrData ? JSON.stringify(rawOcrData) : null,
        currency: currency ?? 'MXN',
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('POST /api/expenses error:', error);
    return NextResponse.json({ error: 'Error al crear gasto' }, { status: 500 });
  }
}
