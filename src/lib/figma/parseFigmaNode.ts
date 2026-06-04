import type { FigmaNodeDocument } from './client';

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
  textAlign?: string;
  color?: string;
  backgroundColor?: string;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  gap?: number;
  layoutMode?: string;
  cornerRadius?: number;
  imageRef?: string;
  nodeId?: string;
  children: ParsedFigmaNode[];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function extractSolidColor(
  fills?: FigmaNodeDocument['fills']
): string | undefined {
  const fill = fills?.find((f) => f.type === 'SOLID' && f.visible !== false && f.color);
  if (!fill?.color) return undefined;
  return rgbToHex(fill.color.r, fill.color.g, fill.color.b);
}

function extractImageRef(fills?: FigmaNodeDocument['fills']): string | undefined {
  const fill = fills?.find((f) => f.type === 'IMAGE' && f.visible !== false && f.imageRef);
  return fill?.imageRef;
}

function extractTextStyle(node: FigmaNodeDocument): {
  fontSize?: number;
  fontWeight?: number;
  textAlign?: string;
  color?: string;
} {
  const style = node.style as
    | {
        fontSize?: number;
        fontWeight?: number;
        textAlignHorizontal?: string;
      }
    | undefined;

  return {
    fontSize: style?.fontSize,
    fontWeight: style?.fontWeight,
    textAlign: style?.textAlignHorizontal?.toLowerCase(),
    color: extractSolidColor(node.fills),
  };
}

export function parseFigmaNode(
  node: FigmaNodeDocument,
  depth = 0,
  maxDepth = 8
): ParsedFigmaNode {
  const box = node.absoluteBoundingBox;
  const textStyle = node.type === 'TEXT' ? extractTextStyle(node) : {};
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
    textAlign: textStyle.textAlign,
    color: textStyle.color,
    backgroundColor: extractSolidColor(node.fills),
    paddingTop: node.paddingTop,
    paddingRight: node.paddingRight,
    paddingBottom: node.paddingBottom,
    paddingLeft: node.paddingLeft,
    gap: node.itemSpacing,
    layoutMode: node.layoutMode,
    cornerRadius,
    imageRef: extractImageRef(node.fills),
    nodeId: node.id,
    children: [],
  };

  if (depth < maxDepth) {
    parsed.children = (node.children ?? [])
      .filter((child) => child.visible !== false)
      .map((child) => parseFigmaNode(child, depth + 1, maxDepth));
  }

  return parsed;
}

export function collectImageRefs(node: ParsedFigmaNode): string[] {
  const refs: string[] = [];
  if (node.imageRef) refs.push(node.imageRef);
  for (const child of node.children) {
    refs.push(...collectImageRefs(child));
  }
  return refs;
}

export function collectNodeIdsForRender(node: ParsedFigmaNode): string[] {
  const ids: string[] = [];
  const hasImageFill = Boolean(node.imageRef);
  const isImageType = node.type === 'IMAGE' || (node.type === 'RECTANGLE' && hasImageFill);

  if (isImageType && node.nodeId) {
    ids.push(node.nodeId);
  }

  for (const child of node.children) {
    ids.push(...collectNodeIdsForRender(child));
  }

  return ids;
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

export function resolveNodeRenderUrls(
  node: ParsedFigmaNode,
  nodeUrlMap: Record<string, string>
): ParsedFigmaNode {
  const renderUrl = node.nodeId ? nodeUrlMap[node.nodeId] : undefined;
  return {
    ...node,
    imageRef: renderUrl ?? node.imageRef,
    children: node.children.map((child) => resolveNodeRenderUrls(child, nodeUrlMap)),
  };
}

/** Walk tree by name path segments, e.g. ["Hero", "Logo"] */
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
