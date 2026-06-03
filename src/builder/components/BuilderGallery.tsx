'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { TemplateSummary } from '@/lib/schema/template';
import { formatCategoryLabel } from '@/builder/utils/props';
import '@/builder/builder.css';

export function BuilderGallery() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/templates');
      if (!res.ok) throw new Error('Failed to load templates');
      const data = await res.json();
      setTemplates(data.templates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useDefaults: true,
          name: 'Untitled Template',
          category: 'newsletter',
        }),
      });
      if (!res.ok) throw new Error('Failed to create template');
      const data = await res.json();
      router.push(`/builder/${data.template.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
      setCreating(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    const res = await fetch(`/api/templates/${id}/duplicate`, { method: 'POST' });
    if (res.ok) {
      await fetchTemplates();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    }
  };

  return (
    <div className="gallery-page">
      <div className="gallery-header">
        <div>
          <h1 className="gallery-title">Email Template Builder</h1>
          <p className="gallery-subtitle">
            Create, edit, and preview email templates with drag-and-drop components
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <Link href="/" className="btn btn-secondary">
            ← Home
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? 'Creating...' : '+ New Template'}
          </button>
        </div>
      </div>

      {loading && <div className="loading-state">Loading templates...</div>}
      {error && <div className="error-state">{error}</div>}

      {!loading && !error && templates.length === 0 && (
        <div className="canvas-empty" style={{ padding: 48 }}>
          No templates yet. Click &quot;New Template&quot; to get started.
        </div>
      )}

      {!loading && templates.length > 0 && (
        <div className="gallery-grid">
          {templates.map((template) => (
            <article key={template.id} className="gallery-card">
              <div>
                <span className="category-tag">{formatCategoryLabel(template.category)}</span>
              </div>
              <h2 className="gallery-card-title">{template.name}</h2>
              {template.description && (
                <p className="gallery-card-meta">{template.description}</p>
              )}
              <p className="gallery-card-meta">
                {template.blockCount} block{template.blockCount !== 1 ? 's' : ''} · Updated{' '}
                {new Date(template.updatedAt).toLocaleDateString()}
              </p>
              <div className="gallery-card-actions">
                <Link href={`/builder/${template.id}`} className="btn btn-primary btn-sm">
                  Edit
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleDuplicate(template.id)}
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-danger"
                  onClick={() => handleDelete(template.id, template.name)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
