import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { exportTemplateRequestSchema } from '@/lib/schema/validators';
import { DynamicEmailTemplate } from '@/lib/render/DynamicEmailTemplate';
import { DEFAULT_TEMPLATE_META } from '@/lib/schema/template';
import { getTemplate } from '@/lib/templates/fileStorage';
import { buildEmailExport } from '@/lib/export';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = exportTemplateRequestSchema.parse(body);

    let templateName = parsed.name ?? 'email-template';
    let meta = parsed.meta ?? DEFAULT_TEMPLATE_META;
    let blocks = parsed.blocks;

    // Fall back to saved file only when the client did not send blocks
    if ((!blocks || blocks.length === 0) && parsed.templateId) {
      const saved = await getTemplate(parsed.templateId);
      if (!saved) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      templateName = saved.name;
      meta = saved.meta;
      blocks = saved.blocks;
    }

    if (!blocks || blocks.length === 0) {
      return NextResponse.json(
        { error: 'Add at least one component to the canvas before exporting.' },
        { status: 400 }
      );
    }

    const html = await render(
      DynamicEmailTemplate({
        meta,
        blocks,
      })
    );

    const pkg = await buildEmailExport(html, templateName);

    return new NextResponse(Buffer.from(pkg.zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${pkg.baseName}.zip"`,
        'Content-Length': String(pkg.zipBuffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting email:', error);
    const message = error instanceof Error ? error.message : 'Failed to export email';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
