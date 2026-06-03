'use client';

import { useBuilderStore } from '@/builder/store/builderStore';
import { useTemplatePreview } from '@/builder/hooks/useTemplatePreview';

export function LivePreview() {
  const template = useBuilderStore((s) => s.template);
  const viewMode = useBuilderStore((s) => s.viewMode);
  const setViewMode = useBuilderStore((s) => s.setViewMode);
  const { html, loading, error } = useTemplatePreview(template);

  const frameWidth = viewMode === 'desktop' ? '100%' : '375px';
  const maxWidth = viewMode === 'desktop' ? '700px' : '375px';

  return (
    <div className="builder-preview-section">
      <div className="builder-preview-toolbar">
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Live Preview {loading && '· Updating...'}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className={`btn btn-secondary btn-sm btn-toggle ${viewMode === 'desktop' ? 'active' : ''}`}
            onClick={() => setViewMode('desktop')}
          >
            Desktop
          </button>
          <button
            type="button"
            className={`btn btn-secondary btn-sm btn-toggle ${viewMode === 'mobile' ? 'active' : ''}`}
            onClick={() => setViewMode('mobile')}
          >
            Mobile
          </button>
        </div>
      </div>

      <div className="builder-preview-frame-wrap">
        {!template || template.blocks.length === 0 ? (
          <div className="canvas-empty" style={{ maxWidth: 400 }}>
            Add components to see a live preview
          </div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : (
          <div
            className="builder-preview-frame"
            style={{ width: frameWidth, maxWidth }}
          >
            <iframe srcDoc={html} title="Email Preview" />
          </div>
        )}
      </div>
    </div>
  );
}
