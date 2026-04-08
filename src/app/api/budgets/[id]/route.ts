import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { amount, alertAt } = body;

    const budget = await prisma.budget.update({
      where: { id, userId: session.user.id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(alertAt !== undefined && { alertAt }),
      },
    });

    return NextResponse.json(budget);
  } catch {
    return NextResponse.json({ error: 'Error al actualizar presupuesto' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    await prisma.budget.delete({ where: { id, userId: session.user.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar presupuesto' }, { status: 500 });
  }
}
