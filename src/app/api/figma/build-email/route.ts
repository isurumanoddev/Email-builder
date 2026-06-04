import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { z } from 'zod';
import { figmaToReactEmailTree } from '@/lib/figma/figmaToReactEmail';
import type { ParsedFigmaNode } from '@/lib/figma/parseFigmaNode';
import { DynamicEmailTemplate } from '@/lib/render/DynamicEmailTemplate';
import { generateId } from '@/lib/utils/id';
import { DEFAULT_TEMPLATE_META } from '@/lib/schema/template';

export const dynamic = 'force-dynamic';

const parsedFigmaNodeSchema: z.ZodType<ParsedFigmaNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: z.string(),
    name: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
    visible: z.boolean(),
    text: z.string().optional(),
    fontSize: z.number().optional(),
    fontWeight: z.number().optional(),
    textAlign: z.string().optional(),
    color: z.string().optional(),
    backgroundColor: z.string().optional(),
    paddingTop: z.number().optional(),
    paddingRight: z.number().optional(),
    paddingBottom: z.number().optional(),
    paddingLeft: z.number().optional(),
    gap: z.number().optional(),
    layoutMode: z.string().optional(),
    cornerRadius: z.number().optional(),
    imageRef: z.string().optional(),
    nodeId: z.string().optional(),
    children: z.array(parsedFigmaNodeSchema),
  })
);

const buildEmailSchema = z.object({
  desktopNode: parsedFigmaNodeSchema,
  mobileNode: parsedFigmaNodeSchema.optional(),
  nodeName: z.string(),
  fileName: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = buildEmailSchema.parse(body);

    const { tree, warnings, nodeCount } = figmaToReactEmailTree(
      parsed.desktopNode,
      parsed.mobileNode
    );

    const block = {
      componentId: 'figma-react-email',
      props: {
        tree,
        sourceFrame: parsed.nodeName,
        mobileFrame: parsed.mobileNode?.name ?? '',
      },
      label: parsed.nodeName,
    };

    const templateBlock = {
      id: generateId(),
      componentId: block.componentId,
      componentVersion: 1,
      props: block.props,
      label: block.label,
    };

    const previewHtml = await render(
      DynamicEmailTemplate({
        meta: DEFAULT_TEMPLATE_META,
        blocks: [templateBlock],
      })
    );

    return NextResponse.json({
      confidence: 1,
      blocks: [block],
      reasoning: `Built ${nodeCount} React Email node(s) from Figma frame "${parsed.nodeName}".`,
      previewHtml,
      warnings,
      nodeCount,
    });
  } catch (error) {
    console.error('Figma build-email error:', error);
    const message = error instanceof Error ? error.message : 'React Email build failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
