import { NextRequest, NextResponse } from 'next/server';
import { analyzeReceipt } from '@/lib/gemini';
import { uploadReceiptToCloudinary } from '@/lib/cloudinary';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó imagen' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no soportado. Use JPG, PNG o WEBP.' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 10MB.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');

    // Upload to Cloudinary
    const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
    const filename = `receipt_${Date.now()}`;

    let imageUrl: string;

    const cloudinaryConfigured =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name_here' &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_KEY !== 'your_cloudinary_api_key_here';

    if (cloudinaryConfigured) {
      imageUrl = await uploadReceiptToCloudinary(buffer, filename);
    } else {
      // Fallback: save locally if Cloudinary not configured
      const { default: fs } = await import('fs/promises');
      const { default: path } = await import('path');
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      const localFilename = `${filename}.${ext}`;
      await fs.writeFile(path.join(uploadsDir, localFilename), buffer);
      imageUrl = `/uploads/${localFilename}`;
    }

    // Analyze — Gemini first, then local OCR fallback
    const ocrResult = await analyzeReceipt(base64, file.type, buffer);

    return NextResponse.json({
      success: true,
      imageUrl,
      data: ocrResult,
    });
  } catch (error) {
    console.error('OCR error:', error);

    // Use the clean message from gemini.ts — never leak raw API errors to the client
    const message =
      error instanceof Error
        ? error.message.split('\n')[0].slice(0, 300)
        : 'Error al procesar imagen';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
