'use client';

import { useCallback, useState } from 'react';
import { ImportResultPanel } from '@/builder/components/ImportResultPanel';
import { useBuilderStore } from '@/builder/store/builderStore';
import type { AiBlock } from '@/lib/ai/schemas/analyzeResult';

interface FigmaImportModalProps {
  open: boolean;
  onClose: () => void;
}

interface AnalyzeResponse {
  confidence: number;
  blocks: AiBlock[];
  reasoning: string;
  previewHtml?: string;
}

type Step = 'connect' | 'review' | 'result';

export function FigmaImportModal({ open, onClose }: FigmaImportModalProps) {
  const addBlocksFromAi = useBuilderStore((s) => s.addBlocksFromAi);

  const [step, setStep] = useState<Step>('connect');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [mobileFigmaUrl, setMobileFigmaUrl] = useState('');
  const [desktopUrl, setDesktopUrl] = useState<string | null>(null);
  const [mobileUrl, setMobileUrl] = useState<string | null>(null);
  const [figmaContext, setFigmaContext] = useState<string | null>(null);
  const [figmaMeta, setFigmaMeta] = useState<{ fileName: string; nodeName: string } | null>(null);
  const [showContext, setShowContext] = useState(false);
  const [hint, setHint] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  const reset = useCallback(() => {
    setStep('connect');
    setFigmaUrl('');
    setMobileFigmaUrl('');
    setDesktopUrl(null);
    setMobileUrl(null);
    setFigmaContext(null);
    setFigmaMeta(null);
    setShowContext(false);
    setHint('');
    setError(null);
    setResult(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleFetch = async () => {
    if (!figmaUrl.trim()) {
      setError('Paste a Figma frame URL with node-id.');
      return;
    }

    setIsFetching(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/figma/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          figmaUrl: figmaUrl.trim(),
          mobileFigmaUrl: mobileFigmaUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Figma import failed');
      }

      setDesktopUrl(data.desktopUrl);
      setMobileUrl(data.mobileUrl ?? null);
      setFigmaContext(data.designContext);
      setFigmaMeta({ fileName: data.fileName, nodeName: data.nodeName });
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Figma import failed');
    } finally {
      setIsFetching(false);
    }
  };

  const handleAnalyze = async () => {
    if (!desktopUrl) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/analyze-component', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          desktopUrl,
          mobileUrl: mobileUrl ?? undefined,
          hint: hint.trim() || undefined,
          figmaContext: figmaContext ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Analysis failed');
      }

      setResult(data);
      setStep('result');
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
        className="import-modal import-modal-figma"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="figma-import-title"
        aria-modal="true"
      >
        <div className="import-modal-header import-modal-header-figma">
          <div>
            <div className="figma-badge">Figma</div>
            <h2 id="figma-import-title">Import from Figma</h2>
            <p className="import-modal-subtitle">
              Paste frame links — pulls design data and builds email components
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="figma-steps">
          <span className={`figma-step ${step === 'connect' ? 'active' : 'done'}`}>
            1. Connect
          </span>
          <span className={`figma-step ${step === 'review' ? 'active' : step === 'result' ? 'done' : ''}`}>
            2. Review
          </span>
          <span className={`figma-step ${step === 'result' ? 'active' : ''}`}>3. Build</span>
        </div>

        <div className="import-modal-body">
          {step === 'connect' && (
            <div className="figma-connect">
              <div className="import-modal-field">
                <label className="import-field-label" htmlFor="figma-url">
                  Desktop frame URL <span className="import-required">*</span>
                </label>
                <p className="import-field-hint">
                  Select a frame in Figma → right-click → Copy link
                </p>
                <input
                  id="figma-url"
                  type="url"
                  className="import-modal-input"
                  placeholder="https://www.figma.com/design/...?node-id=1-2"
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                />
              </div>

              <div className="import-modal-field">
                <label className="import-field-label" htmlFor="figma-mobile-url">
                  Mobile frame URL
                </label>
                <input
                  id="figma-mobile-url"
                  type="url"
                  className="import-modal-input"
                  placeholder="Optional — same file, mobile frame"
                  value={mobileFigmaUrl}
                  onChange={(e) => setMobileFigmaUrl(e.target.value)}
                />
              </div>

              <div className="figma-setup-note">
                Requires <code>FIGMA_ACCESS_TOKEN</code> in <code>.env.local</code>.{' '}
                <a
                  href="https://help.figma.com/hc/en-us/articles/8085703771159"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Create token →
                </a>
              </div>
            </div>
          )}

          {step === 'review' && figmaMeta && (
            <div className="figma-review">
              <div className="figma-loaded-card">
                <div className="figma-loaded-info">
                  <strong>{figmaMeta.nodeName}</strong>
                  <span>{figmaMeta.fileName}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setStep('connect')}
                >
                  Change
                </button>
              </div>

              <div className="figma-thumbs">
                {desktopUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={desktopUrl} alt="Desktop frame" className="figma-thumb" />
                )}
                {mobileUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={mobileUrl} alt="Mobile frame" className="figma-thumb" />
                )}
              </div>

              {figmaContext && (
                <div className="figma-context-section">
                  <button
                    type="button"
                    className="figma-context-toggle"
                    onClick={() => setShowContext((v) => !v)}
                  >
                    {showContext ? '▼' : '▶'} Design structure from Figma
                  </button>
                  {showContext && (
                    <pre className="figma-context-pre">{figmaContext}</pre>
                  )}
                </div>
              )}

              <div className="import-modal-field">
                <label className="import-field-label" htmlFor="figma-hint">
                  Hint for AI (optional)
                </label>
                <textarea
                  id="figma-hint"
                  className="import-modal-textarea"
                  placeholder='e.g. "Two-column product row with red CTA"'
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          {step === 'result' && result && (
            <ImportResultPanel
              confidence={result.confidence}
              reasoning={result.reasoning}
              blocks={result.blocks}
              previewHtml={result.previewHtml}
            />
          )}

          {error && <div className="import-modal-error">{error}</div>}
        </div>

        <div className="import-modal-footer">
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleClose}>
            Cancel
          </button>

          {step === 'connect' && (
            <button
              type="button"
              className="btn btn-primary btn-sm figma-btn-primary"
              onClick={handleFetch}
              disabled={isFetching || !figmaUrl.trim()}
            >
              {isFetching ? 'Fetching...' : 'Fetch from Figma'}
            </button>
          )}

          {step === 'review' && (
            <button
              type="button"
              className="btn btn-primary btn-sm figma-btn-primary"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Building components...' : 'Build email components'}
            </button>
          )}

          {step === 'result' && (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setResult(null);
                  setStep('review');
                }}
              >
                Back
              </button>
              <button type="button" className="btn btn-primary btn-sm figma-btn-primary" onClick={handleConfirm}>
                Add to canvas
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
