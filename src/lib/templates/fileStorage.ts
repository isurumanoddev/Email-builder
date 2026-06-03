import { promises as fs } from 'fs';
import path from 'path';
import type { EmailTemplateDocument, TemplateSummary } from '@/lib/schema/template';
import { emailTemplateDocumentSchema } from '@/lib/schema/validators';
import { toTemplateSummary } from '@/lib/templates/factory';
import { generateId } from '@/lib/utils/id';

const TEMPLATES_DIR = path.join(process.cwd(), 'data', 'templates');

async function ensureTemplatesDir(): Promise<void> {
  await fs.mkdir(TEMPLATES_DIR, { recursive: true });
}

function templateFilePath(id: string): string {
  return path.join(TEMPLATES_DIR, `${id}.json`);
}

export async function listTemplates(): Promise<TemplateSummary[]> {
  await ensureTemplatesDir();
  const files = await fs.readdir(TEMPLATES_DIR);
  const jsonFiles = files.filter((file) => file.endsWith('.json'));

  const summaries: TemplateSummary[] = [];

  for (const file of jsonFiles) {
    try {
      const raw = await fs.readFile(path.join(TEMPLATES_DIR, file), 'utf-8');
      const parsed = emailTemplateDocumentSchema.parse(JSON.parse(raw));
      summaries.push(toTemplateSummary(parsed));
    } catch {
      // Skip invalid template files
    }
  }

  return summaries.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getTemplate(id: string): Promise<EmailTemplateDocument | null> {
  try {
    const raw = await fs.readFile(templateFilePath(id), 'utf-8');
    return emailTemplateDocumentSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function saveTemplate(template: EmailTemplateDocument): Promise<EmailTemplateDocument> {
  await ensureTemplatesDir();
  const validated = emailTemplateDocumentSchema.parse(template);
  await fs.writeFile(templateFilePath(validated.id), JSON.stringify(validated, null, 2), 'utf-8');
  return validated;
}

export async function createTemplate(
  template: Omit<EmailTemplateDocument, 'createdAt' | 'updatedAt'> & {
    createdAt?: string;
    updatedAt?: string;
  }
): Promise<EmailTemplateDocument> {
  const now = new Date().toISOString();
  const doc: EmailTemplateDocument = emailTemplateDocumentSchema.parse({
    ...template,
    createdAt: template.createdAt ?? now,
    updatedAt: template.updatedAt ?? now,
  });
  return saveTemplate(doc);
}

export async function updateTemplate(
  id: string,
  updates: Partial<Omit<EmailTemplateDocument, 'id' | 'createdAt'>>
): Promise<EmailTemplateDocument | null> {
  const existing = await getTemplate(id);
  if (!existing) {
    return null;
  }

  const updated: EmailTemplateDocument = emailTemplateDocumentSchema.parse({
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  });

  return saveTemplate(updated);
}

export async function deleteTemplate(id: string): Promise<boolean> {
  try {
    await fs.unlink(templateFilePath(id));
    return true;
  } catch {
    return false;
  }
}

export async function duplicateTemplate(id: string): Promise<EmailTemplateDocument | null> {
  const existing = await getTemplate(id);
  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();
  const duplicate: EmailTemplateDocument = emailTemplateDocumentSchema.parse({
    ...existing,
    id: generateId(),
    name: `${existing.name} (Copy)`,
    duplicatedFrom: existing.id,
    blocks: existing.blocks.map((block) => ({
      ...block,
      id: generateId(),
    })),
    createdAt: now,
    updatedAt: now,
  });

  return saveTemplate(duplicate);
}

export { TEMPLATES_DIR };
