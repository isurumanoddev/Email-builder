import { NextResponse } from 'next/server';
import { z } from 'zod';
import { importFromFigma } from '@/lib/figma/importFromFigma';

export const dynamic = 'force-dynamic';

const figmaImportSchema = z.object({
  figmaUrl: z.string().url(),
  mobileFigmaUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = figmaImportSchema.parse(body);
    const result = await importFromFigma(parsed);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Figma import error:', error);
    const message = error instanceof Error ? error.message : 'Figma import failed';
    const status = message.includes('FIGMA_ACCESS_TOKEN') ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
