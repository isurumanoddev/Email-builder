import type { CSSProperties } from 'react';
import type { ParsedFigmaNode } from './parseFigmaNode';
import { findNodeByPath, nodePath } from './parseFigmaNode';
import type { ReactEmailNode } from './types/reactEmailAst';

const EMAIL_FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const SKIP_TYPES = new Set(['VECTOR', 'ELLIPSE', 'STAR', 'POLYGON', 'BOOLEAN_OPERATION']);

export interface FigmaToReactEmailResult {
  tree: ReactEmailNode;
  warnings: string[];
  nodeCount: number;
}

function paddingStyle(node: ParsedFigmaNode): CSSProperties | undefined {
  const { paddingTop, paddingRight, paddingBottom, paddingLeft } = node;
  if (
    paddingTop == null &&
    paddingRight == null &&
    paddingBottom == null &&
    paddingLeft == null
  ) {
    return undefined;
  }
  return {
    paddingTop: paddingTop ?? 0,
    paddingRight: paddingRight ?? 0,
    paddingBottom: paddingBottom ?? 0,
    paddingLeft: paddingLeft ?? 0,
  };
}

function sectionStyle(node: ParsedFigmaNode): CSSProperties {
  return {
    backgroundColor: node.backgroundColor ?? 'transparent',
    ...paddingStyle(node),
  };
}

function textStyle(node: ParsedFigmaNode): CSSProperties {
  return {
    color: node.color ?? '#000000',
    fontSize: node.fontSize ?? 16,
    fontWeight: node.fontWeight ?? 400,
    textAlign: (node.textAlign as CSSProperties['textAlign']) ?? 'left',
    fontFamily: EMAIL_FONT,
    margin: 0,
    lineHeight: '1.4',
  };
}

function isButtonLike(node: ParsedFigmaNode): boolean {
  if (node.type !== 'RECTANGLE' && node.type !== 'FRAME') return false;
  const textChildren = node.children.filter((c) => c.type === 'TEXT' && c.text);
  if (textChildren.length !== 1) return false;
  return Boolean(node.backgroundColor) || node.cornerRadius != null;
}

function getImageSrc(node: ParsedFigmaNode): string | undefined {
  if (node.imageRef?.startsWith('/')) return node.imageRef;
  if (node.imageRef) return node.imageRef;
  return undefined;
}

function mapTextNode(node: ParsedFigmaNode): ReactEmailNode {
  const isHeading = (node.fontSize ?? 16) >= 24 || (node.fontWeight ?? 400) >= 600;
  if (isHeading) {
    const as: 'h1' | 'h2' | 'h3' =
      (node.fontSize ?? 16) >= 32 ? 'h1' : (node.fontSize ?? 16) >= 24 ? 'h2' : 'h3';
    return {
      type: 'Heading',
      content: node.text ?? '',
      as,
      style: textStyle(node),
    };
  }
  return {
    type: 'Text',
    content: node.text ?? '',
    style: textStyle(node),
  };
}

function mapButtonNode(node: ParsedFigmaNode): ReactEmailNode {
  const textChild = node.children.find((c) => c.type === 'TEXT');
  const label = textChild?.text ?? node.name;
  return {
    type: 'Button',
    href: '#',
    label,
    style: {
      backgroundColor: node.backgroundColor ?? '#000000',
      color: textChild?.color ?? '#ffffff',
      borderRadius: node.cornerRadius ?? 4,
      fontFamily: EMAIL_FONT,
      fontSize: textChild?.fontSize ?? 16,
      fontWeight: textChild?.fontWeight ?? 600,
      padding: '12px 24px',
    },
  };
}

function mapImageNode(node: ParsedFigmaNode, imgClass?: string): ReactEmailNode | null {
  const src = getImageSrc(node);
  if (!src) return null;
  return {
    type: 'Img',
    src,
    width: node.width,
    height: node.height,
    alt: node.name,
    className: imgClass,
  };
}

function mapNode(
  node: ParsedFigmaNode,
  warnings: string[],
  depth: number,
  path: string[]
): ReactEmailNode[] {
  if (!node.visible) return [];
  if ((node.width ?? 1) <= 0 || (node.height ?? 1) <= 0) return [];

  if (SKIP_TYPES.has(node.type)) {
    warnings.push(`Skipped unsupported node: ${nodePath(node, path.slice(0, -1))} (${node.type})`);
    return [];
  }

  if (depth > 8) {
    warnings.push(`Skipped deep node: ${nodePath(node, path.slice(0, -1))}`);
    return [];
  }

  if (node.type === 'TEXT' && node.text) {
    return [mapTextNode(node)];
  }

  if (node.type === 'LINE') {
    return [{ type: 'Hr', style: { borderColor: node.color ?? '#cccccc', margin: '8px 0' } }];
  }

  if (node.type === 'GROUP') {
    return node.children.flatMap((child) =>
      mapNode(child, warnings, depth + 1, [...path, child.name])
    );
  }

  if (node.type === 'IMAGE' || (node.type === 'RECTANGLE' && node.imageRef)) {
    const img = mapImageNode(node, `figma-img-${node.id.replace(/[:;]/g, '-')}`);
    return img ? [img] : [];
  }

  if (isButtonLike(node)) {
    return [mapButtonNode(node)];
  }

  const childNodes = node.children.flatMap((child) =>
    mapNode(child, warnings, depth + 1, [...path, child.name])
  );

  if (node.layoutMode === 'HORIZONTAL' && node.children.length > 0) {
    const columnNodes: ReactEmailNode[] = node.children.map((child) => ({
      type: 'Column',
      style: { width: child.width ? `${child.width}px` : undefined, verticalAlign: 'top' },
      children: mapNode(child, warnings, depth + 1, [...path, child.name]),
    }));

    return [
      {
        type: 'Section',
        style: sectionStyle(node),
        children: [{ type: 'Row', children: columnNodes }],
      },
    ];
  }

  if (
    (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') &&
    childNodes.length > 0
  ) {
    return [
      {
        type: 'Section',
        style: sectionStyle(node),
        children: childNodes,
      },
    ];
  }

  if (childNodes.length > 0) {
    return [
      {
        type: 'Section',
        style: sectionStyle(node),
        children: childNodes,
      },
    ];
  }

  if (node.backgroundColor && node.type === 'RECTANGLE') {
    warnings.push(`Skipped decorative shape: ${nodePath(node, path.slice(0, -1))}`);
  }

  return [];
}

function buildPathList(node: ParsedFigmaNode, parentPath: string[] = []): string[][] {
  const current = [...parentPath, node.name];
  const paths = [current];
  for (const child of node.children) {
    paths.push(...buildPathList(child, current));
  }
  return paths;
}

function applyMobileLayout(
  desktop: ParsedFigmaNode,
  mobile: ParsedFigmaNode
): ParsedFigmaNode {
  function walk(desk: ParsedFigmaNode, mob: ParsedFigmaNode | undefined): ParsedFigmaNode {
    if (!mob) return desk;

    return {
      ...desk,
      paddingTop: mob.paddingTop ?? desk.paddingTop,
      paddingRight: mob.paddingRight ?? desk.paddingRight,
      paddingBottom: mob.paddingBottom ?? desk.paddingBottom,
      paddingLeft: mob.paddingLeft ?? desk.paddingLeft,
      gap: mob.gap ?? desk.gap,
      children: desk.children.map((child) => {
        const mobileChild = mob.children.find((c) => c.name === child.name);
        return walk(child, mobileChild);
      }),
    };
  }

  return walk(desktop, mobile);
}

function mergeMobileImages(
  tree: ReactEmailNode,
  desktopRoot: ParsedFigmaNode,
  mobileRoot: ParsedFigmaNode | undefined,
  warnings: string[]
): ReactEmailNode {
  if (!mobileRoot) return tree;
  const mobile = mobileRoot;

  const paths = buildPathList(desktopRoot);
  let swapCount = 0;

  function walk(node: ReactEmailNode): ReactEmailNode {
    if (node.type === 'Img') {
      const matchingPath = paths.find((p) => {
        const desk = findNodeByPath(desktopRoot, p);
        return desk?.name === node.alt;
      });

      if (matchingPath) {
        const mobileMatch = findNodeByPath(mobile, matchingPath);
        const mobileSrc = mobileMatch ? getImageSrc(mobileMatch) : undefined;
        if (mobileSrc && mobileSrc !== node.src) {
          swapCount += 1;
          return { ...node, mobileSrc, className: node.className ?? 'figma-img-responsive' };
        }
      }
      return node;
    }

    if ('children' in node && Array.isArray(node.children)) {
      return {
        ...node,
        children: node.children.map(walk),
      } as ReactEmailNode;
    }

    return node;
  }

  const merged = walk(tree);
  if (swapCount > 0) {
    warnings.push(`Applied ${swapCount} mobile image swap(s) for matching nodes.`);
  }
  return merged;
}

function ensureRootWrapper(tree: ReactEmailNode): ReactEmailNode {
  if (tree.type === 'Section' && tree.style?.maxWidth === 600) {
    return tree;
  }

  return {
    type: 'Section',
    style: { maxWidth: 600, margin: '0 auto', width: '100%' },
    children: [tree],
  };
}

function countNodes(node: ReactEmailNode): number {
  let count = 1;
  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      count += countNodes(child);
    }
  }
  return count;
}

export function figmaToReactEmailTree(
  desktopNode: ParsedFigmaNode,
  mobileNode?: ParsedFigmaNode
): FigmaToReactEmailResult {
  const warnings: string[] = [];
  const sourceNode =
    mobileNode != null ? applyMobileLayout(desktopNode, mobileNode) : desktopNode;

  if (mobileNode != null) {
    warnings.push('Applied mobile padding and spacing where frame structures match.');
  }

  const mapped = mapNode(sourceNode, warnings, 0, [sourceNode.name]);

  let tree: ReactEmailNode;

  if (mapped.length === 0) {
    warnings.push('No mappable content found; using empty section.');
    tree = {
      type: 'Section',
      style: { maxWidth: 600, margin: '0 auto' },
      children: [],
    };
  } else if (mapped.length === 1) {
    tree = ensureRootWrapper(mapped[0]);
  } else {
    tree = {
      type: 'Section',
      style: { maxWidth: 600, margin: '0 auto', width: '100%' },
      children: mapped,
    };
  }

  tree = mergeMobileImages(tree, desktopNode, mobileNode, warnings);

  return {
    tree,
    warnings,
    nodeCount: countNodes(tree),
  };
}
