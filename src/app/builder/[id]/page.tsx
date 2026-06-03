import { BuilderEditor } from '@/builder/components/BuilderEditor';

export const metadata = {
  title: 'Edit Template | React Email Builder',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BuilderEditorPage({ params }: PageProps) {
  const { id } = await params;
  return <BuilderEditor templateId={id} />;
}
