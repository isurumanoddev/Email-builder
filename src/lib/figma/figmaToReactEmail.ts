import type { CSSProperties } from 'react';
import type { ParsedFigmaNode } from './parseFigmaNode';
import {
  findNodeByPath,
  findTextChild,
  findButtonBackgroundShape,
  getContentChildren,
  getTopLevelSections,
  mapCounterAxisAlign,
  nodePath,
  resolveEffectiveBackground,
  tryMapCompositeButton,
} from './parseFigmaNode';
import type { ReactEmailNode } from './types/reactEmailAst';

const EMAIL_FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const SKIP_TYPES = new Set(['VECTOR', 'ELLIPSE', 'STAR', 'POLYGON', 'BOOLEAN_OPERATION']);

const CONTAINER_TYPES = new Set(['FRAME', 'COMPONENT', 'INSTANCE', 'GROUP']);

export interface FigmaToReactEmailResult {
  tree: ReactEmailNode;
  warnings: string[];
  nodeCount: number;
}

function fontFamily(node: ParsedFigmaNode): string {
  if (node.fontFamily) {
    return `"${node.fontFamily}", ${EMAIL_FONT}`;
  }
  return EMAIL_FONT;
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
  const backgroundColor = resolveEffectiveBackground(node);
  const textAlign = mapCounterAxisAlign(node.layoutMode, node.counterAxisAlign);

  const style: CSSProperties = {
    ...paddingStyle(node),
    textAlign,
    width: '100%',
  };

  if (backgroundColor) {
    style.backgroundColor = backgroundColor;
  }

  if (node.width && node.width <= 600) {
    style.maxWidth = node.width;
  }

  return style;
}

function textStyle(node: ParsedFigmaNode, inheritAlign?: CSSProperties['textAlign']): CSSProperties {
  return {
    color: node.color ?? '#000000',
    fontSize: node.fontSize ?? 16,
    fontWeight: node.fontWeight ?? 400,
    textAlign: (node.textAlign as CSSProperties['textAlign']) ?? inheritAlign ?? 'left',
    fontFamily: fontFamily(node),
    margin: 0,
    lineHeight: node.lineHeight ? `${node.lineHeight}px` : '1.4',
    letterSpacing: node.letterSpacing ? `${node.letterSpacing}px` : undefined,
  };
}

function isButtonLike(node: ParsedFigmaNode): boolean {
  const name = node.name.toLowerCase();
  const textChild = findTextChild(node);

  if (!textChild) return false;

  if (/button|cta|btn|call.?to.?action|primary|secondary|shop|buy|learn|sign.?up|register/.test(name)) {
    return true;
  }

  if (tryMapCompositeButton(node)) return true;

  if (node.type !== 'RECTANGLE' && node.type !== 'FRAME' && node.type !== 'INSTANCE') {
    return false;
  }

  const bgShape = findButtonBackgroundShape(node);
  if (bgShape && textChild) return true;

  if (node.backgroundColor && node.cornerRadius != null) return true;
  if (node.backgroundColor && (node.height ?? 0) <= 72 && (node.width ?? 0) <= 360) {
    return true;
  }

  return false;
}

function getImageSrc(node: ParsedFigmaNode): string | undefined {
  if (node.exportUrl) return node.exportUrl;
  if (node.imageRef?.startsWith('/') || node.imageRef?.startsWith('http')) {
    return node.imageRef;
  }
  return node.imageRef;
}

/** Pixel-accurate build: export each Figma section as PNG, stack as React Email Section + Img */
function buildFidelityTree(
  desktopRoot: ParsedFigmaNode,
  mobileRoot: ParsedFigmaNode | undefined,
  warnings: string[]
): ReactEmailNode {
  const rootBg = resolveEffectiveBackground(desktopRoot);
  const sections = getTopLevelSections(desktopRoot);
  const sectionNodes: ReactEmailNode[] = [];

  for (const section of sections) {
    const src = section.exportUrl ?? getImageSrc(section);
    if (!src) {
      warnings.push(`Section "${section.name}" could not be exported — re-fetch from Figma.`);
      continue;
    }

    const mobileSection = mobileRoot?.children.find((c) => c.name === section.name);
    const mobileSrc = mobileSection?.exportUrl;
    const imgClass = `figma-section-${section.id.replace(/[:;]/g, '-')}`;

    sectionNodes.push({
      type: 'Section',
      style: {
        width: '100%',
        backgroundColor: resolveEffectiveBackground(section),
        textAlign: 'center',
      },
      children: [
        {
          type: 'Img',
          src,
          mobileSrc: mobileSrc && mobileSrc !== src ? mobileSrc : undefined,
          width: Math.min(section.width ?? 600, 600),
          height: section.height,
          alt: section.name,
          className: imgClass,
        },
      ],
    });
  }

  if (sectionNodes.length === 0) {
    const frameSrc = desktopRoot.exportUrl ?? getImageSrc(desktopRoot);
    if (!frameSrc) {
      warnings.push('No section exports available; falling back to primitive mapping.');
      return buildPrimitiveTree(desktopRoot, mobileRoot, warnings);
    }

    warnings.push('Using full-frame PNG for pixel-perfect design match.');
    return {
      type: 'Section',
      style: {
        maxWidth: 600,
        width: '100%',
        margin: '0 auto',
        backgroundColor: rootBg,
        textAlign: 'center',
      },
      children: [
        {
          type: 'Img',
          src: frameSrc,
          mobileSrc:
            mobileRoot?.exportUrl && mobileRoot.exportUrl !== frameSrc
              ? mobileRoot.exportUrl
              : undefined,
          width: Math.min(desktopRoot.width ?? 600, 600),
          height: desktopRoot.height,
          alt: desktopRoot.name,
          className: 'figma-frame-responsive',
        },
      ],
    };
  }

  return {
    type: 'Section',
    style: {
      maxWidth: 600,
      width: '100%',
      margin: '0 auto',
      backgroundColor: rootBg,
    },
    children: sectionNodes,
  };
}

function buildPrimitiveTree(
  desktopNode: ParsedFigmaNode,
  mobileNode: ParsedFigmaNode | undefined,
  warnings: string[]
): ReactEmailNode {
  const sourceNode =
    mobileNode != null ? applyMobileLayout(desktopNode, mobileNode) : desktopNode;

  const rootBackground = resolveEffectiveBackground(sourceNode);
  const mapped = mapNode(sourceNode, warnings, 0, [sourceNode.name]);

  let tree: ReactEmailNode;

  if (mapped.length === 0) {
    tree = {
      type: 'Section',
      style: { maxWidth: 600, margin: '0 auto', backgroundColor: rootBackground },
      children: [],
    };
  } else if (mapped.length === 1) {
    tree = ensureRootWrapper(mapped[0], rootBackground);
  } else {
    tree = {
      type: 'Section',
      style: {
        maxWidth: 600,
        margin: '0 auto',
        width: '100%',
        backgroundColor: rootBackground,
      },
      children: applyGapToChildren(mapped, sourceNode.gap),
    };
  }

  return mergeMobileImages(tree, desktopNode, mobileNode, warnings);
}

function mapTextNode(
  node: ParsedFigmaNode,
  inheritAlign?: CSSProperties['textAlign']
): ReactEmailNode {
  const style = textStyle(node, inheritAlign);
  const isHeading = (node.fontSize ?? 16) >= 24 || (node.fontWeight ?? 400) >= 600;

  if (isHeading) {
    const as: 'h1' | 'h2' | 'h3' =
      (node.fontSize ?? 16) >= 32 ? 'h1' : (node.fontSize ?? 16) >= 24 ? 'h2' : 'h3';
    return {
      type: 'Heading',
      content: node.text ?? '',
      as,
      style,
    };
  }

  return {
    type: 'Text',
    content: node.text ?? '',
    style,
  };
}

function mapButtonFromParts(
  container: ParsedFigmaNode,
  shape: ParsedFigmaNode,
  text: ParsedFigmaNode,
  inheritAlign?: CSSProperties['textAlign']
): ReactEmailNode {
  const pt = shape.paddingTop ?? container.paddingTop ?? 14;
  const pr = shape.paddingRight ?? container.paddingRight ?? 28;
  const pb = shape.paddingBottom ?? container.paddingBottom ?? 14;
  const pl = shape.paddingLeft ?? container.paddingLeft ?? 28;

  return {
    type: 'Button',
    href: '#',
    label: text.text ?? container.name,
    containerStyle: {
      textAlign: inheritAlign ?? mapCounterAxisAlign(container.layoutMode, container.counterAxisAlign),
      width: '100%',
      ...(resolveEffectiveBackground(container)
        ? { backgroundColor: resolveEffectiveBackground(container) }
        : {}),
      ...paddingStyle(container),
    },
    style: {
      backgroundColor: shape.backgroundColor ?? container.backgroundColor ?? '#000000',
      color: text.color ?? '#ffffff',
      borderRadius: shape.cornerRadius ?? container.cornerRadius ?? 0,
      fontFamily: fontFamily(text),
      fontSize: text.fontSize ?? 16,
      fontWeight: text.fontWeight ?? 600,
      lineHeight: text.lineHeight ? `${text.lineHeight}px` : '120%',
      paddingTop: pt,
      paddingRight: pr,
      paddingBottom: pb,
      paddingLeft: pl,
      width: shape.width ?? container.width,
      minWidth: shape.width ?? container.width,
      textAlign: 'center',
      border:
        shape.strokeColor && shape.strokeWeight
          ? `${shape.strokeWeight}px solid ${shape.strokeColor}`
          : undefined,
    },
  };
}

function mapButtonNode(
  node: ParsedFigmaNode,
  inheritAlign?: CSSProperties['textAlign']
): ReactEmailNode {
  const composite = tryMapCompositeButton(node);
  if (composite) {
    return mapButtonFromParts(node, composite.shape, composite.text, inheritAlign);
  }

  const textChild = findTextChild(node);
  const bgShape = findButtonBackgroundShape(node);

  if (bgShape && textChild) {
    return mapButtonFromParts(node, bgShape, textChild, inheritAlign);
  }

  if (!textChild) {
    return mapButtonFromParts(
      node,
      { ...node, backgroundColor: node.backgroundColor ?? '#000000' },
      { ...node, text: node.name, color: '#ffffff' },
      inheritAlign
    );
  }

  return mapButtonFromParts(
    node,
    { ...node, backgroundColor: resolveEffectiveBackground(node) ?? node.backgroundColor ?? '#000000' },
    textChild,
    inheritAlign
  );
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

function applyGapToChildren(
  children: ReactEmailNode[],
  gap?: number
): ReactEmailNode[] {
  if (!gap || gap <= 0 || children.length <= 1) return children;

  return children.map((child, index) => {
    if (index === 0) return child;

    if (child.type === 'Text' || child.type === 'Heading') {
      return {
        ...child,
        style: { ...child.style, marginTop: gap },
      };
    }

    if (child.type === 'Button') {
      return {
        ...child,
        containerStyle: { ...child.containerStyle, marginTop: gap },
      };
    }

    if ('style' in child) {
      return {
        ...child,
        style: { ...(child.style ?? {}), marginTop: gap },
      } as ReactEmailNode;
    }

    return child;
  });
}

function mapNode(
  node: ParsedFigmaNode,
  warnings: string[],
  depth: number,
  path: string[],
  inheritAlign?: CSSProperties['textAlign']
): ReactEmailNode[] {
  if (!node.visible) return [];
  if ((node.width ?? 1) <= 0 || (node.height ?? 1) <= 0) return [];

  if (SKIP_TYPES.has(node.type)) {
    warnings.push(`Skipped unsupported node: ${nodePath(node, path.slice(0, -1))} (${node.type})`);
    return [];
  }

  if (depth > 12) {
    warnings.push(`Skipped deep node: ${nodePath(node, path.slice(0, -1))}`);
    return [];
  }

  const textAlign = mapCounterAxisAlign(node.layoutMode, node.counterAxisAlign);
  const effectiveAlign = textAlign ?? inheritAlign;

  if (node.type === 'TEXT' && node.text) {
    return [mapTextNode(node, effectiveAlign)];
  }

  if (node.type === 'LINE') {
    return [{ type: 'Hr', style: { borderColor: node.color ?? '#cccccc', margin: '8px 0' } }];
  }

  if (node.type === 'GROUP') {
    const composite = tryMapCompositeButton(node);
    if (composite) {
      return [mapButtonFromParts(node, composite.shape, composite.text, effectiveAlign)];
    }

    return getContentChildren(node).flatMap((child) =>
      mapNode(child, warnings, depth + 1, [...path, child.name], effectiveAlign)
    );
  }

  if (node.type === 'IMAGE' || (node.type === 'RECTANGLE' && node.imageRef)) {
    const img = mapImageNode(node, `figma-img-${node.id.replace(/[:;]/g, '-')}`);
    return img ? [img] : [];
  }

  if (isButtonLike(node)) {
    return [mapButtonNode(node, effectiveAlign)];
  }

  const contentChildren = getContentChildren(node);

  if (node.layoutMode === 'HORIZONTAL' && contentChildren.length > 0) {
    const parentWidth = node.width ?? 600;
    const columnNodes: ReactEmailNode[] = contentChildren.map((child) => {
      const widthPct = child.width
        ? `${Math.min(100, Math.round((child.width / parentWidth) * 100))}%`
        : `${Math.round(100 / contentChildren.length)}%`;

      return {
        type: 'Column',
        style: {
          width: widthPct,
          verticalAlign: 'top',
        },
        children: mapNode(child, warnings, depth + 1, [...path, child.name], effectiveAlign),
      };
    });

    return [
      {
        type: 'Section',
        style: sectionStyle(node),
        children: [
          {
            type: 'Row',
            style: { width: '100%' },
            children: columnNodes,
          },
        ],
      },
    ];
  }

  if (CONTAINER_TYPES.has(node.type) && contentChildren.length > 0) {
    const mappedChildren = contentChildren.flatMap((child) =>
      mapNode(child, warnings, depth + 1, [...path, child.name], effectiveAlign)
    );

    return [
      {
        type: 'Section',
        style: sectionStyle(node),
        children: applyGapToChildren(mappedChildren, node.gap),
      },
    ];
  }

  if (node.backgroundColor && node.type === 'RECTANGLE') {
    return [
      {
        type: 'Section',
        style: {
          backgroundColor: node.backgroundColor,
          width: node.width ? `${node.width}px` : '100%',
          height: node.height,
        },
        children: [],
      },
    ];
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
      backgroundColor: resolveEffectiveBackground(mob) ?? resolveEffectiveBackground(desk),
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
        const mobileSrc = mobileMatch?.exportUrl ?? (mobileMatch ? getImageSrc(mobileMatch) : undefined);
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

function ensureRootWrapper(tree: ReactEmailNode, rootBg?: string): ReactEmailNode {
  const rootStyle: CSSProperties = {
    maxWidth: 600,
    width: '100%',
    margin: '0 auto',
  };

  if (rootBg) {
    rootStyle.backgroundColor = rootBg;
  }

  if (tree.type === 'Section') {
    return {
      ...tree,
      style: {
        ...tree.style,
        ...rootStyle,
        backgroundColor: tree.style?.backgroundColor ?? rootBg,
      },
    };
  }

  return {
    type: 'Section',
    style: rootStyle,
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
  mobileNode?: ParsedFigmaNode,
  options?: { desktopUrl?: string; mobileUrl?: string }
): FigmaToReactEmailResult {
  const warnings: string[] = [];

  let desktop = desktopNode;
  let mobile = mobileNode;

  if (options?.desktopUrl) {
    desktop = { ...desktop, exportUrl: options.desktopUrl };
  }
  if (options?.mobileUrl && mobile) {
    mobile = { ...mobile, exportUrl: options.mobileUrl };
  }

  warnings.push(
    'Design fidelity mode: each Figma section is exported as PNG and wrapped in React Email Section + Img.'
  );

  const tree = buildFidelityTree(desktop, mobile, warnings);

  return {
    tree,
    warnings,
    nodeCount: countNodes(tree),
  };
}
