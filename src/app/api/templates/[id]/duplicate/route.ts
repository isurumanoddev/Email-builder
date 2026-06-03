import { NextRequest, NextResponse } from 'next/server';
import { duplicateTemplate } from '@/lib/templates/fileStorage';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const duplicate = await duplicateTemplate(id);

  if (!duplicate) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return NextResponse.json({ template: duplicate }, { status: 201 });
}
