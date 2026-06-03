'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBuilderStore } from '@/builder/store/builderStore';

export function BuilderToolbar() {
  const router = useRouter();
  const template = useBuilderStore((s) => s.template);
  const isDirty = useBuilderStore((s) => s.isDirty);
  const isSaving = useBuilderStore((s) => s.isSaving);
  const saveError = useBuilderStore((s) => s.saveError);
  const saveMessage = useBuilderStore((s) => s.saveMessage);
  const showAdvanced = useBuilderStore((s) => s.showAdvanced);
  const updateTemplateInfo = useBuilderStore((s) => s.updateTemplateInfo);
  const setShowAdvanced = useBuilderStore((s) => s.setShowAdvanced);
  const save = useBuilderStore((s) => s.save);

  const handleDuplicate = async () => {
    if (!template) return;
    const res = await fetch(`/api/templates/${template.id}/duplicate`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      router.push(`/builder/${data.template.id}`);
    }
  };

  const handleExportHtml = async () => {
    if (!template) return;
    const res = await fetch('/api/email/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meta: template.meta, blocks: template.blocks }),
    });
    if (!res.ok) return;
    const data = await res.json();
    const blob = new Blob([data.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.replace(/\s+/g, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="builder-toolbar">
      <div className="builder-toolbar-left">
        <Link href="/builder" className="btn btn-ghost btn-sm">
          ← Templates
        </Link>
        {template && (
          <div className="builder-toolbar-title">
            <input
              value={template.name}
              onChange={(e) => updateTemplateInfo({ name: e.target.value })}
              aria-label="Template name"
            />
          </div>
        )}
        {isDirty && <span className="status-badge dirty">Unsaved</span>}
        {saveMessage && !isDirty && <span className="status-badge saved">{saveMessage}</span>}
        {saveError && <span className="status-badge error">{saveError}</span>}
      </div>

      <div className="builder-toolbar-right">
        <label className="field-checkbox-row" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <input
            type="checkbox"
            checked={showAdvanced}
            onChange={(e) => setShowAdvanced(e.target.checked)}
          />
          Advanced
        </label>
        <a
          href="http://localhost:3005"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
          title="Run npm run email:dev and npm run email:resend:setup first"
        >
          Send email
        </a>
        <button type="button" className="btn btn-secondary btn-sm" onClick={handleExportHtml}>
          Export HTML
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={handleDuplicate}>
          Duplicate
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => save()}
          disabled={isSaving || !isDirty}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </header>
  );
}
