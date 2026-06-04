'use client';

import { useCallback, useState } from 'react';
import { ImageUploadField } from '@/builder/components/ImageUploadField';
import { ImportResultPanel } from '@/builder/components/ImportResultPanel';
import { useBuilderStore } from '@/builder/store/builderStore';
import type { AiBlock } from '@/lib/ai/schemas/analyzeResult';

interface AiImportModalProps {
  open: boolean;
  onClose: () => void;
}

interface AnalyzeResponse {
  confidence: number;
  blocks: AiBlock[];
  reasoning: string;
  previewHtml?: string;
}

export function AiImportModal({ open, onClose }: AiImportModalProps) {
  const addBlocksFromAi = useBuilderStore((s) => s.addBlocksFromAi);

  const [desktopUrl, setDesktopUrl] = useState<string | null>(null);
  const [mobileUrl, setMobileUrl] = useState<string | null>(null);
  const [hint, setHint] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  const reset = useCallback(() => {
    setDesktopUrl(null);
    setMobileUrl(null);
    setHint('');
    setError(null);
    setResult(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleAnalyze = async () => {
    if (!desktopUrl) {
      setError('Upload a desktop screenshot first.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/ai/analyze-component', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          desktopUrl,
          mobileUrl: mobileUrl ?? undefined,
          hint: hint.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Analysis failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    if (!result?.blocks.length) return;
    addBlocksFromAi(result.blocks);
    handleClose();
  };

  if (!open) return null;

  return (
    <div className="import-modal-overlay" onClick={handleClose} role="presentation">
      <div
        className="import-modal import-modal-ai"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="ai-import-title"
        aria-modal="true"
      >
        <div className="import-modal-header">
          <div>
            <h2 id="ai-import-title">AI Import</h2>
            <p className="import-modal-subtitle">Upload screenshots — AI maps them to email components</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="import-modal-body">
          <div className="import-modal-uploads">
            <ImageUploadField
              label="Desktop screenshot"
              value={desktopUrl}
              onChange={setDesktopUrl}
              required
              hint="Export the desktop frame from Figma as PNG"
            />
            <ImageUploadField
              label="Mobile screenshot"
              value={mobileUrl}
              onChange={setMobileUrl}
              hint="Optional — improves responsive layout detection"
            />
          </div>

          <div className="import-modal-field">
            <label className="import-field-label" htmlFor="ai-hint">
              Hint (optional)
            </label>
            <textarea
              id="ai-hint"
              className="import-modal-textarea"
              placeholder='e.g. "Hero banner with red CTA"'
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              rows={2}
            />
          </div>

          {error && <div className="import-modal-error">{error}</div>}

          {result && (
            <ImportResultPanel
              confidence={result.confidence}
              reasoning={result.reasoning}
              blocks={result.blocks}
              previewHtml={result.previewHtml}
            />
          )}
        </div>

        <div className="import-modal-footer">
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleClose}>
            Cancel
          </button>
          {!result ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !desktopUrl}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          ) : (
            <button type="button" className="btn btn-primary btn-sm" onClick={handleConfirm}>
              Add to canvas
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
