import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { renderTemplateRequestSchema } from '@/lib/schema/validators';
import { DynamicEmailTemplate } from '@/lib/render/DynamicEmailTemplate';
import { DEFAULT_TEMPLATE_META } from '@/lib/schema/template';
import { getTemplate } from '@/lib/templates/fileStorage';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Support rendering by saved template id
    if (body.templateId && typeof body.templateId === 'string') {
      const template = await getTemplate(body.templateId);
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }

      const html = await render(
        DynamicEmailTemplate({
          meta: template.meta,
          blocks: template.blocks,
        })
      );

      return NextResponse.json({ html, templateId: template.id });
    }

    const parsed = renderTemplateRequestSchema.parse(body);

    const html = await render(
      DynamicEmailTemplate({
        meta: parsed.meta ?? DEFAULT_TEMPLATE_META,
        blocks: parsed.blocks,
      })
    );

    return NextResponse.json({ html });
  } catch (error) {
    console.error('Error rendering dynamic email:', error);
    const message = error instanceof Error ? error.message : 'Failed to render email';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
