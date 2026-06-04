import { promises as fs } from 'fs';
import path from 'path';
import { generateId } from '@/lib/utils/id';
import { getFigmaFileImages, getFigmaImages, getFigmaNodes } from './client';
import { extractDesignContext } from './extractDesignContext';
import {
  collectImageRefs,
  collectNodeIdsForRender,
  parseFigmaNode,
  resolveImageRefsInTree,
  resolveNodeRenderUrls,
  type ParsedFigmaNode,
} from './parseFigmaNode';
import { parseFigmaUrl } from './parseUrl';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'uploads');

async function downloadToUploads(imageUrl: string, prefix: string): Promise<string> {
  const res = await fetch(imageUrl, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) {
    throw new Error(`Failed to download Figma render (${res.status})`);
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const buffer = Buffer.from(await res.arrayBuffer());
  const filename = `${prefix}-${generateId()}.png`;
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `/images/uploads/${filename}`;
}

async function resolveTreeAssets(
  fileKey: string,
  node: ParsedFigmaNode
): Promise<ParsedFigmaNode> {
  const imageRefs = [...new Set(collectImageRefs(node))];
  const renderNodeIds = [...new Set(collectNodeIdsForRender(node))];

  const [fileImages, renderImages] = await Promise.all([
    imageRefs.length > 0
      ? getFigmaFileImages(fileKey)
      : Promise.resolve({} as Record<string, string | null>),
    renderNodeIds.length > 0
      ? getFigmaImages(fileKey, renderNodeIds, 2)
      : Promise.resolve({} as Record<string, string | null>),
  ]);

  const localRefMap: Record<string, string> = {};
  for (const ref of imageRefs) {
    const remoteUrl = fileImages[ref];
    if (remoteUrl) {
      localRefMap[ref] = await downloadToUploads(remoteUrl, 'figma-asset');
    }
  }

  let resolved = resolveImageRefsInTree(node, localRefMap);

  const localNodeUrlMap: Record<string, string> = {};
  for (const nodeId of renderNodeIds) {
    const remoteUrl = renderImages[nodeId];
    if (remoteUrl) {
      localNodeUrlMap[nodeId] = await downloadToUploads(remoteUrl, 'figma-node');
    }
  }

  resolved = resolveNodeRenderUrls(resolved, localNodeUrlMap);
  return resolved;
}

export interface FigmaImportInput {
  figmaUrl: string;
  mobileFigmaUrl?: string;
}

export interface FigmaImportResult {
  desktopUrl: string;
  mobileUrl?: string;
  designContext: string;
  fileName: string;
  nodeName: string;
  fileKey: string;
  desktopNode: ParsedFigmaNode;
  mobileNode?: ParsedFigmaNode;
}

export async function importFromFigma(input: FigmaImportInput): Promise<FigmaImportResult> {
  const desktop = parseFigmaUrl(input.figmaUrl);
  if (!desktop) {
    throw new Error('Invalid Figma URL. Paste a link with node-id, e.g. figma.com/design/...?node-id=1-2');
  }

  const mobile = input.mobileFigmaUrl?.trim()
    ? parseFigmaUrl(input.mobileFigmaUrl)
    : null;

  if (input.mobileFigmaUrl?.trim() && !mobile) {
    throw new Error('Invalid mobile Figma URL.');
  }

  if (mobile && mobile.fileKey !== desktop.fileKey) {
    throw new Error('Desktop and mobile Figma URLs must be from the same file.');
  }

  const nodeIds = mobile ? [desktop.nodeId, mobile.nodeId] : [desktop.nodeId];

  const [nodesResponse, images] = await Promise.all([
    getFigmaNodes(desktop.fileKey, nodeIds),
    getFigmaImages(desktop.fileKey, nodeIds, 1),
  ]);

  const desktopNodeDoc = nodesResponse.nodes[desktop.nodeId]?.document;
  if (!desktopNodeDoc) {
    throw new Error('Could not load the selected Figma frame. Check the node-id in the URL.');
  }

  const desktopImageUrl = images[desktop.nodeId];
  if (!desktopImageUrl) {
    throw new Error('Figma could not render the desktop frame as an image.');
  }

  const savedDesktopUrl = await downloadToUploads(desktopImageUrl, 'figma-desk');

  let savedMobileUrl: string | undefined;
  let designContext = extractDesignContext(desktopNodeDoc);

  let parsedDesktop = parseFigmaNode(desktopNodeDoc);
  let parsedMobile: ParsedFigmaNode | undefined;

  if (mobile) {
    const mobileNodeDoc = nodesResponse.nodes[mobile.nodeId]?.document;
    const mobileImageUrl = images[mobile.nodeId];

    if (mobileNodeDoc) {
      designContext += `\n\n--- Mobile frame ---\n${extractDesignContext(mobileNodeDoc)}`;
      parsedMobile = parseFigmaNode(mobileNodeDoc);
    }

    if (mobileImageUrl) {
      savedMobileUrl = await downloadToUploads(mobileImageUrl, 'figma-mob');
    }
  }

  parsedDesktop = await resolveTreeAssets(desktop.fileKey, parsedDesktop);
  if (parsedMobile) {
    parsedMobile = await resolveTreeAssets(desktop.fileKey, parsedMobile);
  }

  return {
    desktopUrl: savedDesktopUrl,
    mobileUrl: savedMobileUrl,
    designContext,
    fileName: nodesResponse.name,
    nodeName: desktopNodeDoc.name,
    fileKey: desktop.fileKey,
    desktopNode: parsedDesktop,
    mobileNode: parsedMobile,
  };
}
