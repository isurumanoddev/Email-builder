import { NextRequest, NextResponse } from 'next/server';
import { emailTemplateDocumentSchema } from '@/lib/schema/validators';
import { createEmptyTemplate } from '@/lib/templates/factory';
import {
  createTemplate,
  listTemplates,
} from '@/lib/templates/fileStorage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const templates = await listTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error listing templates:', error);
    return NextResponse.json({ error: 'Failed to list templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.useDefaults === true || !body.id) {
      const template = createEmptyTemplate(
        body.name ?? 'Untitled Template',
        body.category ?? 'newsletter'
      );

      if (body.description) {
        template.description = body.description;
      }

      if (Array.isArray(body.blocks)) {
        template.blocks = body.blocks;
      }

      const saved = await createTemplate(template);
      return NextResponse.json({ template: saved }, { status: 201 });
    }

    const validated = emailTemplateDocumentSchema.parse(body);
    const saved = await createTemplate(validated);
    return NextResponse.json({ template: saved }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    const message = error instanceof Error ? error.message : 'Failed to create template';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
