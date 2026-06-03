import { NextRequest, NextResponse } from 'next/server';
import { emailTemplateDocumentSchema } from '@/lib/schema/validators';
import {
  deleteTemplate,
  getTemplate,
  updateTemplate,
} from '@/lib/templates/fileStorage';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const template = await getTemplate(id);

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return NextResponse.json({ template });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const existing = await getTemplate(id);

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const merged = emailTemplateDocumentSchema.parse({
      ...existing,
      ...body,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    });

    const updated = await updateTemplate(id, merged);
    return NextResponse.json({ template: updated });
  } catch (error) {
    console.error('Error updating template:', error);
    const message = error instanceof Error ? error.message : 'Failed to update template';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const deleted = await deleteTemplate(id);

  if (!deleted) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
