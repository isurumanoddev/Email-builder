import type {
  EmailTemplateDocument,
  EmailTemplateMeta,
  TemplateBlock,
  TemplateSummary,
} from '@/lib/schema/template';
import { DEFAULT_TEMPLATE_META as defaultMeta } from '@/lib/schema/template';
import { generateId } from '@/lib/utils/id';

export function createBlockFromDefaults(
  componentId: string,
  version: number,
  defaultProps: Record<string, unknown>,
  label: string
): TemplateBlock {
  return {
    id: generateId(),
    componentId,
    componentVersion: version,
    props: structuredClone(defaultProps),
    label,
  };
}

export function createEmptyTemplate(
  name: string,
  category: EmailTemplateDocument['category'] = 'newsletter'
): EmailTemplateDocument {
  const now = new Date().toISOString();

  return {
    schemaVersion: 1,
    id: generateId(),
    name,
    category,
    meta: { ...defaultMeta },
    blocks: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function toTemplateSummary(doc: EmailTemplateDocument): TemplateSummary {
  return {
    id: doc.id,
    name: doc.name,
    description: doc.description,
    category: doc.category,
    blockCount: doc.blocks.length,
    updatedAt: doc.updatedAt,
  };
}

export type { EmailTemplateMeta };
export { defaultMeta as DEFAULT_TEMPLATE_META };
