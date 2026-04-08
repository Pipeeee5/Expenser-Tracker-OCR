import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const categories = await prisma.category.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const { label, icon, color, bgColor } = body;

    if (!label) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    // Usaremos userId + label para evitar choques
    const idStr = `${session.user.id}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`;

    const newCategory = await prisma.category.create({
      data: {
        userId: session.user.id,
        id: idStr || undefined, // si es vacio, usa cuid() default
        label,
        icon: icon || '🏷️',
        color: color || '#94a3b8',
        bgColor: bgColor || 'bg-slate-500/20',
        keywords: '',
      },
    });

    return NextResponse.json(newCategory);
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear categoría' }, { status: 500 });
  }
}
