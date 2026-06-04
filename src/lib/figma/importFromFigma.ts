import { promises as fs } from 'fs';
import path from 'path';
import { generateId } from '@/lib/utils/id';
import { getFigmaImages, getFigmaNodes } from './client';
import { extractDesignContext } from './extractDesignContext';
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

  const desktopNode = nodesResponse.nodes[desktop.nodeId]?.document;
  if (!desktopNode) {
    throw new Error('Could not load the selected Figma frame. Check the node-id in the URL.');
  }

  const desktopImageUrl = images[desktop.nodeId];
  if (!desktopImageUrl) {
    throw new Error('Figma could not render the desktop frame as an image.');
  }

  const savedDesktopUrl = await downloadToUploads(desktopImageUrl, 'figma-desk');

  let savedMobileUrl: string | undefined;
  let designContext = extractDesignContext(desktopNode);

  if (mobile) {
    const mobileNode = nodesResponse.nodes[mobile.nodeId]?.document;
    const mobileImageUrl = images[mobile.nodeId];

    if (mobileNode) {
      designContext += `\n\n--- Mobile frame ---\n${extractDesignContext(mobileNode)}`;
    }

    if (mobileImageUrl) {
      savedMobileUrl = await downloadToUploads(mobileImageUrl, 'figma-mob');
    }
  }

  return {
    desktopUrl: savedDesktopUrl,
    mobileUrl: savedMobileUrl,
    designContext,
    fileName: nodesResponse.name,
    nodeName: desktopNode.name,
  };
}
