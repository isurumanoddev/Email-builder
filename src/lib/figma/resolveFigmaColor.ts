import type { FigmaNodeDocument, FigmaPaint, FigmaVariable } from './client';

function colorToCss(
  color: { r: number; g: number; b: number; a?: number },
  fillOpacity = 1,
  nodeOpacity = 1
): string {
  const toByte = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255);
  const r = toByte(color.r);
  const g = toByte(color.g);
  const b = toByte(color.b);
  const a = Math.min(1, Math.max(0, (color.a ?? 1) * fillOpacity * nodeOpacity));

  if (a >= 0.999) {
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  }
  return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})`;
}

function resolveVariableColor(
  variableId: string,
  variables: Record<string, FigmaVariable>
): string | undefined {
  const variable = variables[variableId];
  if (!variable?.valuesByMode) return undefined;

  const firstMode = Object.values(variable.valuesByMode)[0];
  if (firstMode && typeof firstMode === 'object' && 'r' in firstMode) {
    return colorToCss(firstMode as { r: number; g: number; b: number; a?: number });
  }
  return undefined;
}

function resolveBoundFillColor(
  node: FigmaNodeDocument,
  variables?: Record<string, FigmaVariable>
): string | undefined {
  if (!variables || !node.boundVariables?.fills) return undefined;

  const aliases = Array.isArray(node.boundVariables.fills)
    ? node.boundVariables.fills
    : [node.boundVariables.fills];

  for (const alias of aliases) {
    if (alias?.id) {
      const color = resolveVariableColor(alias.id, variables);
      if (color) return color;
    }
  }
  return undefined;
}

export function extractSolidFromPaints(
  paints: FigmaPaint[] | undefined,
  nodeOpacity = 1
): string | undefined {
  if (!paints?.length) return undefined;

  for (const fill of paints) {
    if (fill.visible === false) continue;

    if (fill.type === 'SOLID' && fill.color) {
      return colorToCss(fill.color, fill.opacity ?? 1, nodeOpacity);
    }

    if (fill.type === 'GRADIENT_LINEAR' && fill.color) {
      return colorToCss(fill.color, fill.opacity ?? 1, nodeOpacity);
    }
  }

  return undefined;
}

export function extractBackgroundColor(
  node: FigmaNodeDocument,
  variables?: Record<string, FigmaVariable>
): string | undefined {
  const nodeOpacity = node.opacity ?? 1;
  const fromVariable = resolveBoundFillColor(node, variables);
  if (fromVariable) return fromVariable;

  const isShape =
    node.type === 'RECTANGLE' ||
    node.type === 'ELLIPSE' ||
    node.type === 'VECTOR' ||
    node.type === 'POLYGON';

  if (isShape) {
    const fromFills = extractSolidFromPaints(node.fills, nodeOpacity);
    if (fromFills) return fromFills;
  }

  const fromBackground = extractSolidFromPaints(node.background, nodeOpacity);
  if (fromBackground) return fromBackground;

  if (node.backgroundColor) {
    return colorToCss(node.backgroundColor, 1, nodeOpacity);
  }

  return extractSolidFromPaints(node.fills, nodeOpacity);
}

export function extractTextColor(
  node: FigmaNodeDocument,
  variables?: Record<string, FigmaVariable>
): string | undefined {
  return (
    resolveBoundFillColor(node, variables) ??
    extractSolidFromPaints(node.fills, node.opacity ?? 1)
  );
}

export function extractStrokeColor(
  node: FigmaNodeDocument,
  variables?: Record<string, FigmaVariable>
): string | undefined {
  return extractSolidFromPaints(node.strokes, node.opacity ?? 1);
}

export function extractImageRef(fills?: FigmaPaint[]): string | undefined {
  const fill = fills?.find((f) => f.type === 'IMAGE' && f.visible !== false && f.imageRef);
  return fill?.imageRef;
}
