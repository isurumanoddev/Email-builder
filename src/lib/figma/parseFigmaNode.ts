import type { CSSProperties } from 'react';
import type { FigmaNodeDocument, FigmaVariable } from './client';
import {
  extractBackgroundColor,
  extractImageRef,
  extractStrokeColor,
  extractTextColor,
} from './resolveFigmaColor';

export interface ParsedFigmaNode {
  id: string;
  type: string;
  name: string;
  width?: number;
  height?: number;
  visible: boolean;
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: string;
  color?: string;
  backgroundColor?: string;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  gap?: number;
  layoutMode?: string;
  primaryAxisAlign?: string;
  counterAxisAlign?: string;
  cornerRadius?: number;
  strokeColor?: string;
  strokeWeight?: number;
  imageRef?: string;
  /** PNG export from Figma /images API — pixel-accurate render of this node */
  exportUrl?: string;
  componentId?: string;
  nodeId?: string;
  children: ParsedFigmaNode[];
}

const RASTER_TYPES = new Set([
  'VECTOR',
  'ELLIPSE',
  'STAR',
  'POLYGON',
  'BOOLEAN_OPERATION',
  'LINE',
  'REGULAR_POLYGON',
]);

function extractTextStyle(
  node: FigmaNodeDocument,
  variables?: Record<string, FigmaVariable>
): {
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: string;
  color?: string;
} {
  const style = node.style as
    | {
        fontSize?: number;
        fontWeight?: number;
        fontFamily?: string;
        lineHeightPx?: number;
        letterSpacing?: number;
        textAlignHorizontal?: string;
      }
    | undefined;

  return {
    fontSize: style?.fontSize,
    fontWeight: style?.fontWeight,
    fontFamily: style?.fontFamily,
    lineHeight: style?.lineHeightPx,
    letterSpacing: style?.letterSpacing,
    textAlign: style?.textAlignHorizontal?.toLowerCase(),
    color: extractTextColor(node, variables),
  };
}

export function parseFigmaNode(
  node: FigmaNodeDocument,
  variables?: Record<string, FigmaVariable>
): ParsedFigmaNode {
  const box = node.absoluteBoundingBox;
  const textStyle = node.type === 'TEXT' ? extractTextStyle(node, variables) : {};
  const cornerRadius =
    typeof node.cornerRadius === 'number'
      ? node.cornerRadius
      : Array.isArray(node.rectangleCornerRadii)
        ? Math.max(...node.rectangleCornerRadii)
        : undefined;

  const parsed: ParsedFigmaNode = {
    id: node.id,
    type: node.type,
    name: node.name,
    width: box?.width != null ? Math.round(box.width) : undefined,
    height: box?.height != null ? Math.round(box.height) : undefined,
    visible: node.visible !== false,
    text: node.characters?.trim() || undefined,
    fontSize: textStyle.fontSize,
    fontWeight: textStyle.fontWeight,
    fontFamily: textStyle.fontFamily,
    lineHeight: textStyle.lineHeight,
    letterSpacing: textStyle.letterSpacing,
    textAlign: textStyle.textAlign,
    color: textStyle.color,
    backgroundColor: extractBackgroundColor(node, variables),
    paddingTop: node.paddingTop,
    paddingRight: node.paddingRight,
    paddingBottom: node.paddingBottom,
    paddingLeft: node.paddingLeft,
    gap: node.itemSpacing,
    layoutMode: node.layoutMode,
    primaryAxisAlign: node.primaryAxisAlignItems,
    counterAxisAlign: node.counterAxisAlignItems,
    cornerRadius,
    strokeColor: extractStrokeColor(node, variables),
    strokeWeight: node.strokeWeight,
    imageRef: extractImageRef(node.fills),
    componentId: node.componentId,
    nodeId: node.id,
    children: (node.children ?? [])
      .filter((child) => child.visible !== false)
      .map((child) => parseFigmaNode(child, variables)),
  };

  return parsed;
}

export function collectImageRefs(node: ParsedFigmaNode): string[] {
  const refs: string[] = [];
  if (node.imageRef && !node.imageRef.startsWith('/') && !node.imageRef.startsWith('http')) {
    refs.push(node.imageRef);
  }
  for (const child of node.children) {
    refs.push(...collectImageRefs(child));
  }
  return refs;
}

export function collectExportNodeIds(root: ParsedFigmaNode): string[] {
  const ids = new Set<string>();

  function walk(node: ParsedFigmaNode, depth: number) {
    if (!node.nodeId || !node.visible) return;

    const hasImageFill = Boolean(node.imageRef);
    const isImageType = node.type === 'IMAGE' || (node.type === 'RECTANGLE' && hasImageFill);

    if (isImageType || RASTER_TYPES.has(node.type)) {
      ids.add(node.nodeId);
    } else if (node.type === 'INSTANCE' && !findTextChild(node)) {
      ids.add(node.nodeId);
    } else if (depth === 1 && (node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'INSTANCE')) {
      ids.add(node.nodeId);
    }

    for (const child of node.children) {
      walk(child, depth + 1);
    }
  }

  walk(root, 0);
  return [...ids];
}

export function getTopLevelSections(root: ParsedFigmaNode): ParsedFigmaNode[] {
  return getContentChildren(root);
}

export function collectNodeIdsForRender(node: ParsedFigmaNode): string[] {
  return collectExportNodeIds(node);
}

export function resolveImageRefsInTree(
  node: ParsedFigmaNode,
  refMap: Record<string, string>
): ParsedFigmaNode {
  return {
    ...node,
    imageRef: node.imageRef && refMap[node.imageRef] ? refMap[node.imageRef] : node.imageRef,
    children: node.children.map((child) => resolveImageRefsInTree(child, refMap)),
  };
}

export function resolveExportUrls(
  node: ParsedFigmaNode,
  exportMap: Record<string, string>
): ParsedFigmaNode {
  const exportUrl = node.nodeId ? exportMap[node.nodeId] : undefined;
  return {
    ...node,
    exportUrl: exportUrl ?? node.exportUrl,
    imageRef:
      exportUrl && (RASTER_TYPES.has(node.type) || node.type === 'IMAGE')
        ? exportUrl
        : node.imageRef,
    children: node.children.map((child) => resolveExportUrls(child, exportMap)),
  };
}

export function findNodeByPath(
  node: ParsedFigmaNode,
  path: string[]
): ParsedFigmaNode | undefined {
  if (path.length === 0) return node;
  const [head, ...rest] = path;
  const child = node.children.find((c) => c.name === head);
  if (!child) return undefined;
  return findNodeByPath(child, rest);
}

export function nodePath(node: ParsedFigmaNode, parentPath: string[] = []): string {
  return [...parentPath, node.name].join('/');
}

export function isBackgroundRect(child: ParsedFigmaNode, parent: ParsedFigmaNode): boolean {
  if (child.type !== 'RECTANGLE' && child.type !== 'FRAME') return false;
  if (child.imageRef) return false;
  if (!child.backgroundColor) return false;
  if (child.children.some((c) => c.type === 'TEXT' && c.text)) return false;

  const name = child.name.toLowerCase();
  if (/background|^bg$|fill|base|surface/.test(name)) return true;

  const wRatio = parent.width && child.width ? child.width / parent.width : 1;
  const hRatio = parent.height && child.height ? child.height / parent.height : 1;

  return wRatio >= 0.85 && hRatio >= 0.85;
}

export function findButtonBackgroundShape(
  node: ParsedFigmaNode,
  depth = 0
): ParsedFigmaNode | undefined {
  if (depth > 6) return undefined;

  const candidates = node.children.filter(
    (c) =>
      (c.type === 'RECTANGLE' || c.type === 'FRAME') &&
      c.backgroundColor &&
      !c.imageRef &&
      !isBackgroundRect(c, node) &&
      !c.children.some((t) => t.type === 'TEXT' && t.text)
  );

  if (candidates.length > 0) {
    const named = candidates.find((c) =>
      /background|^bg$|fill|button|cta|shape/i.test(c.name)
    );
    if (named) return named;

    const rounded = candidates.find((c) => (c.cornerRadius ?? 0) > 0);
    if (rounded) return rounded;

    return candidates.sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];
  }

  for (const child of node.children) {
    if (child.type === 'FRAME' || child.type === 'GROUP' || child.type === 'INSTANCE') {
      const nested = findButtonBackgroundShape(child, depth + 1);
      if (nested) return nested;
    }
  }

  return undefined;
}

export function tryMapCompositeButton(
  node: ParsedFigmaNode,
  depth = 0
): { shape: ParsedFigmaNode; text: ParsedFigmaNode } | null {
  if (depth > 6) return null;

  const children = node.children.filter((c) => c.visible !== false);
  const textNodes = children.filter((c) => c.type === 'TEXT' && c.text);
  const shapeNodes = children.filter(
    (c) =>
      (c.type === 'RECTANGLE' || c.type === 'FRAME') &&
      c.backgroundColor &&
      !c.imageRef &&
      !isBackgroundRect(c, node)
  );

  const name = node.name.toLowerCase();
  const nameMatch =
    /button|cta|btn|call.?to.?action|primary|secondary|shop|buy|learn|sign.?up|register/.test(
      name
    );

  if (textNodes.length === 1 && shapeNodes.length > 0) {
    const text = textNodes[0];
    const shape = findButtonBackgroundShape(node) ?? shapeNodes[0];
    const height = node.height ?? shape.height ?? 0;
    const width = node.width ?? shape.width ?? 0;

    if (nameMatch || (height > 0 && height <= 100 && width > 0 && width <= 480)) {
      return { shape, text };
    }
  }

  for (const child of children) {
    if (child.type === 'FRAME' || child.type === 'GROUP' || child.type === 'INSTANCE') {
      const nested = tryMapCompositeButton(child, depth + 1);
      if (nested) return nested;
    }
  }

  return null;
}

export function resolveEffectiveBackground(node: ParsedFigmaNode): string | undefined {
  if (node.backgroundColor) return node.backgroundColor;

  const bgChild = node.children.find((c) => isBackgroundRect(c, node));
  return bgChild?.backgroundColor;
}

export function getContentChildren(node: ParsedFigmaNode): ParsedFigmaNode[] {
  const effectiveBg = resolveEffectiveBackground(node);
  return node.children.filter((child) => {
    if (isBackgroundRect(child, node) && child.backgroundColor === effectiveBg) {
      return false;
    }
    return true;
  });
}

export function findTextChild(node: ParsedFigmaNode): ParsedFigmaNode | undefined {
  for (const child of node.children) {
    if (child.type === 'TEXT' && child.text) return child;
    const nested = findTextChild(child);
    if (nested) return nested;
  }
  return undefined;
}

export function mapCounterAxisAlign(
  layoutMode: string | undefined,
  counterAxisAlign: string | undefined
): CSSProperties['textAlign'] {
  if (!counterAxisAlign) return 'left';
  const align = counterAxisAlign.toUpperCase();

  if (layoutMode === 'HORIZONTAL') {
    if (align === 'CENTER') return 'center';
    if (align === 'MAX') return 'right';
    return 'left';
  }

  if (align === 'CENTER') return 'center';
  if (align === 'MAX') return 'right';
  return 'left';
}
