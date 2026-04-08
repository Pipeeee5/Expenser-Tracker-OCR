import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const expense = await prisma.expense.findUnique({ where: { id, userId: session.user.id } });
    if (!expense) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(expense);
  } catch {
    return NextResponse.json({ error: 'Error al obtener gasto' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { amount, category, description, merchant, date, currency } = body;

    const expense = await prisma.expense.update({
      where: { id, userId: session.user.id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(category && { category }),
        ...(description && { description }),
        ...(merchant !== undefined && { merchant }),
        ...(date && { date: new Date(date) }),
        ...(currency && { currency }),
      },
    });

    return NextResponse.json(expense);
  } catch {
    return NextResponse.json({ error: 'Error al actualizar gasto' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    await prisma.expense.delete({ where: { id, userId: session.user.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar gasto' }, { status: 500 });
  }
}
