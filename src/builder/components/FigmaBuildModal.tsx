'use client';

import { useCallback, useState } from 'react';
import { FigmaReviewPanel } from '@/builder/components/figma/FigmaReviewPanel';
import { ImportResultPanel } from '@/builder/components/ImportResultPanel';
import { useBuilderStore } from '@/builder/store/builderStore';
import type { AiBlock } from '@/lib/ai/schemas/analyzeResult';

interface FigmaBuildModalProps {
  open: boolean;
  onClose: () => void;
  onFetchAgain?: () => void;
}

interface BuildResponse {
  confidence: number;
  blocks: AiBlock[];
  reasoning: string;
  previewHtml?: string;
  warnings?: string[];
}

type Step = 'build' | 'result';

export function FigmaBuildModal({ open, onClose, onFetchAgain }: FigmaBuildModalProps) {
  const figmaSession = useBuilderStore((s) => s.figmaSession);
  const addBlocksFromAi = useBuilderStore((s) => s.addBlocksFromAi);
  const updateFigmaHint = useBuilderStore((s) => s.updateFigmaHint);
  const clearFigmaSession = useBuilderStore((s) => s.clearFigmaSession);

  const [step, setStep] = useState<Step>('build');
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BuildResponse | null>(null);

  const reset = useCallback(() => {
    setStep('build');
    setIsBuilding(false);
    setError(null);
    setResult(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleBuildReactEmail = async () => {
    if (!figmaSession) return;

    setIsBuilding(true);
    setError(null);

    try {
      const res = await fetch('/api/figma/build-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          desktopNode: figmaSession.desktopNode,
          mobileNode: figmaSession.mobileNode,
          nodeName: figmaSession.nodeName,
          fileName: figmaSession.fileName,
          desktopUrl: figmaSession.desktopUrl,
          mobileUrl: figmaSession.mobileUrl,
          mode: 'primitives',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'React Email build failed');
      }

      setResult(data);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'React Email build failed');
    } finally {
      setIsBuilding(false);
    }
  };

  const handleConfirm = () => {
    if (!result?.blocks.length) return;
    addBlocksFromAi(result.blocks);
    clearFigmaSession();
    handleClose();
  };

  if (!open) return null;

  if (!figmaSession) {
    return (
      <div className="import-modal-overlay" onClick={handleClose} role="presentation">
        <div
          className="import-modal import-modal-figma"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="import-modal-header import-modal-header-figma">
            <h2>Build from Figma</h2>
          </div>
          <div className="import-modal-body">
            <p className="import-field-hint">
              No Figma design loaded. Fetch a frame first.
            </p>
          </div>
          <div className="import-modal-footer">
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleClose}>
              Close
            </button>
            {onFetchAgain && (
              <button
                type="button"
                className="btn btn-primary btn-sm figma-btn-primary"
                onClick={onFetchAgain}
              >
                Fetch from Figma
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="import-modal-overlay" onClick={handleClose} role="presentation">
      <div
        className="import-modal import-modal-figma"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="figma-build-title"
        aria-modal="true"
      >
        <div className="import-modal-header import-modal-header-figma">
          <div>
            <div className="figma-badge">React Email</div>
            <h2 id="figma-build-title">Build React Email Components</h2>
            <p className="import-modal-subtitle">
              {figmaSession.nodeName} — Heading, Text, Button from Figma data
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="import-modal-body">
          {step === 'build' && (
            <>
              <FigmaReviewPanel
                session={figmaSession}
                hint={figmaSession.hint ?? ''}
                onHintChange={updateFigmaHint}
                showHint={false}
              />
              <p className="import-field-hint">
                Reads text and buttons directly from the Figma API tree. Header/title text becomes{' '}
                <strong>Heading</strong> with Figma font size, weight, and color. Buttons become{' '}
                <strong>Button</strong> with background, radius, and label text from the design.
                Body copy uses <strong>Text</strong>.
              </p>
            </>
          )}

          {step === 'result' && result && (
            <ImportResultPanel
              confidence={result.confidence}
              reasoning={result.reasoning}
              blocks={result.blocks}
              previewHtml={result.previewHtml}
              warnings={result.warnings}
              buildMode="react-email"
            />
          )}

          {error && <div className="import-modal-error">{error}</div>}
        </div>

        <div className="import-modal-footer">
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleClose}>
            Cancel
          </button>

          {step === 'build' && (
            <button
              type="button"
              className="btn btn-primary btn-sm figma-btn-primary"
              onClick={handleBuildReactEmail}
              disabled={isBuilding}
            >
              {isBuilding ? 'Building...' : 'Build React Email'}
            </button>
          )}

          {step === 'result' && (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setResult(null);
                  setStep('build');
                }}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm figma-btn-primary"
                onClick={handleConfirm}
              >
                Add to canvas
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
