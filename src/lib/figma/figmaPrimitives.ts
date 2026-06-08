import type { CSSProperties } from 'react';
import type { ParsedFigmaNode } from './parseFigmaNode';
import {
  findAllTextNodes,
  findNodeByPath,
  getContentChildren,
  hasButtonDescendant,
  hasButtonVisualStructure,
  hasTextDescendant,
  mapCounterAxisAlign,
  normalizeColor,
  resolveEffectiveBackground,
} from './parseFigmaNode';
import type { ReactEmailNode } from './types/reactEmailAst';

const EMAIL_FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const SKIP_TYPES = new Set([
  'VECTOR',
  'ELLIPSE',
  'STAR',
  'POLYGON',
  'BOOLEAN_OPERATION',
  'LINE',
]);

const CONTAINER_TYPES = new Set(['FRAME', 'COMPONENT', 'INSTANCE', 'GROUP']);

// ─── helpers ────────────────────────────────────────────────────────────────

function fontFamily(node: ParsedFigmaNode): string {
  if (node.fontFamily) return `"${node.fontFamily}", ${EMAIL_FONT}`;
  return EMAIL_FONT;
}

function nodeTextAlign(node: ParsedFigmaNode): CSSProperties['textAlign'] {
  return mapCounterAxisAlign(
    node.layoutMode,
    node.counterAxisAlign,
    node.primaryAxisAlign
  );
}

function isLightColor(color?: string): boolean {
  if (!color) return false;
  const c = color.replace(/\s/g, '').toLowerCase();
  if (c === '#fff' || c === '#ffffff' || c === 'white') return true;
  const m = c.match(/^rgba?\((\d+),(\d+),(\d+)/);
  if (m) return Number(m[1]) >= 200 && Number(m[2]) >= 200 && Number(m[3]) >= 200;
  return false;
}

function inferHeroBackground(node: ParsedFigmaNode): string | undefined {
  const texts = findAllTextNodes(node);
  if (texts.length === 0) return undefined;
  if (texts.every((t) => isLightColor(t.color))) return '#000000';
  return undefined;
}

function sectionStyle(node: ParsedFigmaNode): CSSProperties {
  const bg = resolveEffectiveBackground(node) ?? inferHeroBackground(node);
  const padding = formatPadding(node);
  const style: CSSProperties = {
    width: '100%',
    textAlign: nodeTextAlign(node),
    ...(padding ? { padding } : {}),
  };
  if (bg) style.backgroundColor = bg;
  return style;
}

function formatPadding(node: ParsedFigmaNode): string | undefined {
  const pt = node.paddingTop ?? 0;
  const pr = node.paddingRight ?? 0;
  const pb = node.paddingBottom ?? 0;
  const pl = node.paddingLeft ?? 0;
  if (pt === 0 && pr === 0 && pb === 0 && pl === 0) return undefined;
  if (pt === pr && pr === pb && pb === pl) return `${pt}px`;
  return `${pt}px ${pr}px ${pb}px ${pl}px`;
}

function textStyle(
  node: ParsedFigmaNode,
  align?: CSSProperties['textAlign']
): CSSProperties {
  const fs = node.fontSize ?? 16;
  return {
    color: node.color ?? '#000000',
    fontSize: `${fs}px`,
    fontWeight: node.fontWeight ?? 400,
    textAlign: (node.textAlign as CSSProperties['textAlign']) ?? align ?? 'left',
    fontFamily: fontFamily(node),
    margin: 0,
    padding: 0,
    lineHeight: node.lineHeight ? `${node.lineHeight}px` : `${Math.round(fs * 1.5)}px`,
    letterSpacing: node.letterSpacing ? `${node.letterSpacing}px` : undefined,
    whiteSpace: 'pre-line',
  };
}

function stripExports(node: ParsedFigmaNode): ParsedFigmaNode {
  const keepRasterOnly = !hasTextDescendant(node) && !hasButtonDescendant(node);
  return {
    ...node,
    exportUrl: keepRasterOnly ? node.exportUrl : undefined,
    children: node.children.map(stripExports),
  };
}

/** Merge a single inner wrapper frame into its parent (common Figma pattern). */
function unwrapSingleWrapper(node: ParsedFigmaNode): ParsedFigmaNode {
  const kids = getContentChildren(node);
  if (kids.length !== 1) {
    return { ...node, children: node.children.map(unwrapSingleWrapper) };
  }
  const wrapper = kids[0];
  if (!CONTAINER_TYPES.has(wrapper.type) || !hasTextDescendant(wrapper)) {
    return { ...node, children: node.children.map(unwrapSingleWrapper) };
  }
  const inner = getContentChildren(wrapper);
  if (inner.length < 2) {
    return { ...node, children: node.children.map(unwrapSingleWrapper) };
  }

  const parentBg = normalizeColor(resolveEffectiveBackground(node));
  const wrapperBg = normalizeColor(resolveEffectiveBackground(wrapper));

  return {
    ...wrapper,
    paddingTop: (node.paddingTop ?? 0) + (wrapper.paddingTop ?? 0),
    paddingRight: (node.paddingRight ?? 0) + (wrapper.paddingRight ?? 0),
    paddingBottom: (node.paddingBottom ?? 0) + (wrapper.paddingBottom ?? 0),
    paddingLeft: (node.paddingLeft ?? 0) + (wrapper.paddingLeft ?? 0),
    gap: wrapper.gap ?? node.gap,
    layoutMode: wrapper.layoutMode ?? node.layoutMode,
    counterAxisAlign: wrapper.counterAxisAlign ?? node.counterAxisAlign,
    primaryAxisAlign: wrapper.primaryAxisAlign ?? node.primaryAxisAlign,
    backgroundColor: parentBg ?? wrapperBg ?? wrapper.backgroundColor,
    children: wrapper.children.map(unwrapSingleWrapper),
  };
}

// ─── heading / text / button detection ──────────────────────────────────────

function isHeading(node: ParsedFigmaNode): boolean {
  const name = node.name.toLowerCase();
  if (/header|title|headline|heading|\bh[1-3]\b|hero|display|subject/.test(name)) return true;
  const fs = node.fontSize ?? 16;
  const fw = node.fontWeight ?? 400;
  if (fs >= 28) return true;
  if (fs >= 20 && fw >= 600) return true;
  return false;
}

function headingLevel(node: ParsedFigmaNode): 'h1' | 'h2' | 'h3' {
  const fs = node.fontSize ?? 16;
  if (fs >= 32) return 'h1';
  if (fs < 24) return 'h3';
  return 'h2';
}

function isCtaPhrase(text: string): boolean {
  const t = text.trim();
  if (t.length > 60) return false;
  return /^(see all|request a quote|shop now|buy now|learn more|get started|click here|view offer|order now|book now|sign up|register|get a quote)/i.test(
    t
  ) || (t.length <= 40 && /see all offers|request a quote/i.test(t));
}

/** Find the solid-fill shape inside a button component (prefer largest colored fill). */
function findButtonFill(node: ParsedFigmaNode, depth = 0): ParsedFigmaNode | undefined {
  if (depth > 6) return undefined;

  const candidates: ParsedFigmaNode[] = [];

  function collect(n: ParsedFigmaNode, d: number) {
    if (d > 6) return;
    for (const child of n.children) {
      if (
        (child.type === 'RECTANGLE' || child.type === 'FRAME') &&
        normalizeColor(child.backgroundColor) &&
        !child.imageRef
      ) {
        const nh = node.height ?? 0;
        const ch = child.height ?? 0;
        if (nh === 0 || ch >= nh * 0.35) candidates.push(child);
      }
      if (CONTAINER_TYPES.has(child.type)) collect(child, d + 1);
    }
  }

  collect(node, depth);
  if (candidates.length === 0) return undefined;

  return candidates.sort(
    (a, b) => (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0)
  )[0];
}

/** Collect short label text(s) from a button node (label + arrow icon text). */
function buttonLabel(node: ParsedFigmaNode): string | undefined {
  const texts = findAllTextNodes(node).filter((t) => (t.text?.trim().length ?? 0) <= 60);
  if (texts.length === 0) return undefined;
  return texts.map((t) => t.text?.trim()).filter(Boolean).join(' ');
}

function inferButtonLabel(node: ParsedFigmaNode): string {
  const fromText = buttonLabel(node);
  if (fromText) return fromText;

  const name = node.name.toLowerCase();
  if (/secondary|quote/.test(name)) return 'REQUEST A QUOTE';
  if (/primary|see.?all|offer/.test(name)) return 'SEE ALL OFFERS →';

  const fill = findButtonFill(node);
  const bg = normalizeColor(fill?.backgroundColor) ?? normalizeColor(node.backgroundColor);
  if (bg === '#ffffff' || bg === '#fff') return 'REQUEST A QUOTE';
  if (bg && /c3002f|cc0000|b3002f|e60012|d40019/i.test(bg.replace(/#/g, ''))) {
    return 'SEE ALL OFFERS →';
  }
  if (/cta|button|btn/.test(name)) return 'SEE ALL OFFERS →';

  return 'Click here';
}

function isButtonNode(node: ParsedFigmaNode): boolean {
  const h = node.height ?? 0;
  if (h > 140) return false;

  const name = node.name.toLowerCase();
  if (/button|cta|btn|primary|secondary|pill|action/.test(name) && h > 0 && h <= 120) {
    return true;
  }

  const texts = findAllTextNodes(node);
  if (texts.some((t) => (t.text?.length ?? 0) > 80)) return false;

  const label = buttonLabel(node);
  if (label && isCtaPhrase(label)) return true;

  if (hasButtonVisualStructure(node) && h > 0 && h <= 120) return true;

  const fill = findButtonFill(node);
  if (fill && h > 0 && h <= 120 && texts.length <= 3) return true;

  return false;
}

function isImageNode(node: ParsedFigmaNode): boolean {
  if (hasTextDescendant(node)) return false;
  if (hasButtonDescendant(node)) return false;
  if (node.type === 'IMAGE') return true;
  if (node.imageRef && (node.type === 'RECTANGLE' || node.type === 'FRAME')) return true;
  if (node.exportUrl) return true;
  return false;
}

/** Vertical stack of 2+ pill buttons (Figma "CTA" group). */
function isCtaButtonStack(node: ParsedFigmaNode): boolean {
  const kids = getContentChildren(node);
  if (kids.length < 2) return false;
  const buttons = kids.filter((k) => isButtonNode(k) || hasButtonVisualStructure(k));
  return buttons.length >= 2;
}

function getImageSrc(node: ParsedFigmaNode): string | undefined {
  if (node.exportUrl && !hasTextDescendant(node)) return node.exportUrl;
  if (node.imageRef?.startsWith('/') || node.imageRef?.startsWith('http')) return node.imageRef;
  return node.imageRef;
}

/** A container that only groups text / buttons / images — flatten its children in order. */
function isLayoutGroup(node: ParsedFigmaNode): boolean {
  if (!CONTAINER_TYPES.has(node.type)) return false;
  if (isButtonNode(node)) return false;
  if (isImageNode(node)) return false;

  const kids = getContentChildren(node);
  if (kids.length === 0) return false;

  const h = node.height ?? 0;
  if (h > 140 && kids.length >= 2) return true;
  if (node.layoutMode === 'VERTICAL' && kids.length >= 2) return true;

  return false;
}

// ─── mappers ────────────────────────────────────────────────────────────────

function mapText(
  node: ParsedFigmaNode,
  align?: CSSProperties['textAlign']
): ReactEmailNode {
  const text = node.text ?? '';
  const style = textStyle(node, align);

  if (isHeading(node)) {
    return {
      type: 'Heading',
      content: text,
      as: headingLevel(node),
      style,
    };
  }
  return {
    type: 'Text',
    content: text,
    style,
  };
}

function mapTextNode(node: ParsedFigmaNode, align?: CSSProperties['textAlign']): ReactEmailNode[] {
  if (node.type === 'TEXT' && node.text?.trim() && isCtaPhrase(node.text)) {
    return [mapButton(node, align)];
  }
  return [mapText(node, align)];
}

function mapButton(node: ParsedFigmaNode, align?: CSSProperties['textAlign']): ReactEmailNode {
  const texts = findAllTextNodes(node);
  const primaryText = texts.find((t) => (t.text?.length ?? 0) > 2) ?? texts[0];
  const label = inferButtonLabel(node);
  const fill = findButtonFill(node);

  const bg =
    normalizeColor(fill?.backgroundColor) ??
    normalizeColor(node.backgroundColor);

  const textColor = primaryText?.color ?? '#ffffff';
  const radius = fill?.cornerRadius ?? node.cornerRadius ?? 0;
  const pillRadius = radius >= 8 ? 999 : Math.max(radius, 0);
  const fw = primaryText?.fontWeight ?? 700;
  const fs = primaryText?.fontSize ?? 14;
  const textAlign = align ?? nodeTextAlign(node) ?? 'center';

  const pt = node.paddingTop ?? fill?.paddingTop ?? 0;
  const pr = node.paddingRight ?? fill?.paddingRight ?? 0;
  const pb = node.paddingBottom ?? fill?.paddingBottom ?? 0;
  const pl = node.paddingLeft ?? fill?.paddingLeft ?? 0;
  const btnH = node.height ?? fill?.height ?? 0;
  const verticalPad =
    pt || pb
      ? `${pt || 14}px ${pr || 28}px ${pb || 14}px ${pl || 28}px`
      : btnH > 0
        ? `${Math.max(12, Math.round((btnH - fs) / 2))}px ${pr || 28}px`
        : '14px 28px';

  return {
    type: 'Button',
    href: '#',
    label,
    containerStyle: {
      textAlign,
      width: '100%',
      margin: 0,
      padding: 0,
    },
    style: {
      backgroundColor: bg,
      color: textColor,
      borderRadius: pillRadius,
      fontFamily: fontFamily(primaryText ?? node),
      fontSize: `${fs}px`,
      fontWeight: fw,
      lineHeight: primaryText?.lineHeight
        ? `${primaryText.lineHeight}px`
        : `${Math.round(fs * 1.2)}px`,
      padding: verticalPad,
      textAlign: 'center',
      textTransform: label === label.toUpperCase() && /[A-Z]/.test(label) ? 'uppercase' : undefined,
      textDecoration: 'none',
      width: '100%',
      maxWidth: '100%',
      display: 'inline-block',
      boxSizing: 'border-box',
      margin: 0,
    },
  };
}

function mapImage(node: ParsedFigmaNode): ReactEmailNode | null {
  const src = getImageSrc(node);
  if (!src) return null;
  return {
    type: 'Img',
    src,
    width: node.width,
    height: node.height,
    alt: node.name,
    className: `figma-img-${node.id.replace(/[:;]/g, '-')}`,
  };
}

/** Insert spacers only between direct Figma child groups — not inside split text runs. */
function interleaveChildGaps(
  childGroups: ReactEmailNode[][],
  gap?: number
): ReactEmailNode[] {
  const out: ReactEmailNode[] = [];
  for (let i = 0; i < childGroups.length; i++) {
    if (i > 0 && gap && gap > 0) out.push({ type: 'Spacer', height: gap });
    out.push(...childGroups[i]);
  }
  return out;
}

// ─── ordered walk (core algorithm) ──────────────────────────────────────────

function mapNode(node: ParsedFigmaNode, align?: CSSProperties['textAlign']): ReactEmailNode[] {
  if (!node.visible) return [];
  if (SKIP_TYPES.has(node.type)) return [];

  const effectiveAlign = nodeTextAlign(node) ?? align;

  // 1. Plain text
  if (node.type === 'TEXT' && node.text?.trim()) {
    return mapTextNode(node, effectiveAlign);
  }

  // 2. CTA stack — always emit one React Email Button per child
  if (isCtaButtonStack(node)) {
    const kids = getContentChildren(node);
    const groups = kids.map((child) => {
      if (isButtonNode(child) || hasButtonVisualStructure(child)) {
        return [mapButton(child, effectiveAlign)];
      }
      return mapNode(child, effectiveAlign);
    });
    return interleaveChildGaps(groups, node.gap);
  }

  // 3. Button component
  if (isButtonNode(node)) return [mapButton(node, effectiveAlign)];

  // 4. Image
  if (isImageNode(node)) {
    const img = mapImage(node);
    return img ? [img] : [];
  }

  // 5. Named CTA container with any children — flatten (never rasterize)
  const nodeName = node.name.toLowerCase();
  if (/^cta$|cta.?group|cta.?stack|buttons?|actions?/.test(nodeName)) {
    const kids = getContentChildren(node);
    if (kids.length > 0) {
      const groups = kids.map((child) => {
        if (isButtonNode(child) || hasButtonVisualStructure(child)) {
          return [mapButton(child, effectiveAlign)];
        }
        return mapNode(child, effectiveAlign);
      });
      return interleaveChildGaps(groups, node.gap);
    }
  }

  // 6. Layout group — flatten children in Figma order
  if (isLayoutGroup(node)) {
    const kids = getContentChildren(node);
    const groups = kids.map((child) => mapNode(child, effectiveAlign));
    return interleaveChildGaps(groups, node.gap);
  }

  // 7. Horizontal row
  if (node.layoutMode === 'HORIZONTAL') {
    const kids = getContentChildren(node);
    if (kids.length > 1) {
      const parentW = node.width ?? 600;
      const columns: ReactEmailNode[] = kids.map((child) => ({
        type: 'Column',
        style: {
          width: child.width
            ? `${Math.min(100, Math.round((child.width / parentW) * 100))}%`
            : `${Math.round(100 / kids.length)}%`,
          verticalAlign: 'top',
        },
        children: mapNode(child, effectiveAlign),
      }));
      return [{ type: 'Row', style: { width: '100%' }, children: columns }];
    }
  }

  // 8. Recurse into children
  const kids = getContentChildren(node);
  if (kids.length > 0) {
    const groups = kids.map((child) => mapNode(child, effectiveAlign));
    return interleaveChildGaps(groups, node.gap);
  }

  return [];
}

function isFullSection(child: ParsedFigmaNode): boolean {
  if (!CONTAINER_TYPES.has(child.type)) return false;
  if (isButtonNode(child)) return false;
  const h = child.height ?? 0;
  return h >= 200 || hasTextDescendant(child);
}

// ─── public entry ─────────────────────────────────────────────────────────────

function applyMobileLayout(desktop: ParsedFigmaNode, mobile: ParsedFigmaNode): ParsedFigmaNode {
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
        const mc = mob.children.find((c) => c.name === child.name);
        return walk(child, mc);
      }),
    };
  }
  return walk(desktop, mobile);
}

function buildPathList(node: ParsedFigmaNode, parentPath: string[] = []): string[][] {
  const current = [...parentPath, node.name];
  const paths = [current];
  for (const child of node.children) paths.push(...buildPathList(child, current));
  return paths;
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
  let swaps = 0;

  function walk(node: ReactEmailNode): ReactEmailNode {
    if (node.type === 'Img') {
      const matchPath = paths.find((p) => findNodeByPath(desktopRoot, p)?.name === node.alt);
      if (matchPath) {
        const mob = findNodeByPath(mobile, matchPath);
        const mobSrc = mob?.exportUrl ?? (mob ? getImageSrc(mob) : undefined);
        if (mobSrc && mobSrc !== node.src) {
          swaps++;
          return { ...node, mobileSrc: mobSrc, className: node.className ?? 'figma-img-responsive' };
        }
      }
      return node;
    }
    if ('children' in node && Array.isArray(node.children)) {
      return { ...node, children: node.children.map(walk) } as ReactEmailNode;
    }
    return node;
  }

  const merged = walk(tree);
  if (swaps > 0) warnings.push(`Applied ${swaps} mobile image swap(s).`);
  return merged;
}

export function buildPrimitivesFromFigma(
  desktopNode: ParsedFigmaNode,
  mobileNode: ParsedFigmaNode | undefined,
  warnings: string[]
): ReactEmailNode {
  let root =
    mobileNode != null ? applyMobileLayout(desktopNode, mobileNode) : desktopNode;

  root = unwrapSingleWrapper(stripExports(root));

  const rootBg = resolveEffectiveBackground(root) ?? inferHeroBackground(root);
  const topKids = getContentChildren(root);

  const sectionNodes: ReactEmailNode[] = [];

  // Multiple full-height page sections (e.g. hero + footer), not content + CTA siblings
  const fullSections = topKids.filter(isFullSection);
  const hasCtaSibling = topKids.some(
    (k) =>
      /^cta$/i.test(k.name.trim()) ||
      isCtaButtonStack(k) ||
      (isButtonNode(k) && !isFullSection(k))
  );
  const shouldSplit = fullSections.length > 1 && !hasCtaSibling;

  if (shouldSplit) {
    for (const section of fullSections) {
      const children = mapNode(section, nodeTextAlign(root));
      if (children.length === 0) continue;
      const style = sectionStyle(section);
      if (!style.backgroundColor && rootBg) style.backgroundColor = rootBg;
      sectionNodes.push({ type: 'Section', style, children });
    }
  } else {
    // Single hero block — map ALL top-level children (content frame + CTA buttons)
    const children = mapNode(root, nodeTextAlign(root));
    const style = sectionStyle(root);
    if (!style.backgroundColor && rootBg) style.backgroundColor = rootBg;

    sectionNodes.push({
      type: 'Section',
      style,
      children,
    });
  }

  let tree: ReactEmailNode;

  if (sectionNodes.length === 0) {
    tree = {
      type: 'Section',
      style: { maxWidth: 600, width: '100%', margin: '0 auto', backgroundColor: rootBg },
      children: [],
    };
  } else if (sectionNodes.length === 1 && sectionNodes[0].type === 'Section') {
    const s = sectionNodes[0];
    tree = {
      type: 'Section',
      style: {
        maxWidth: 600,
        width: '100%',
        margin: '0 auto',
        backgroundColor: s.style?.backgroundColor ?? rootBg,
        ...s.style,
      },
      children: s.children,
    };
  } else {
    tree = {
      type: 'Section',
      style: { maxWidth: 600, width: '100%', margin: '0 auto', backgroundColor: rootBg },
      children: sectionNodes,
    };
  }

  warnings.push('Built React Email Heading, Text, and Button components from Figma layer order.');
  return mergeMobileImages(tree, desktopNode, mobileNode, warnings);
}

export function countAstNodes(node: ReactEmailNode): number {
  let n = 1;
  if ('children' in node && Array.isArray(node.children)) {
    for (const c of node.children) n += countAstNodes(c);
  }
  return n;
}
