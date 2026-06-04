const FIGMA_API = 'https://api.figma.com/v1';

export interface FigmaNodeDocument {
  id: string;
  name: string;
  type: string;
  characters?: string;
  style?: Record<string, unknown>;
  fills?: Array<{ type?: string; color?: { r: number; g: number; b: number; a?: number } }>;
  absoluteBoundingBox?: { width?: number; height?: number; x?: number; y?: number };
  layoutMode?: string;
  itemSpacing?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  children?: FigmaNodeDocument[];
}

export interface FigmaNodesResponse {
  name: string;
  nodes: Record<
    string,
    {
      document: FigmaNodeDocument;
    } | null
  >;
}

function getToken(): string {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      'FIGMA_ACCESS_TOKEN is not set. Create a personal access token at https://help.figma.com/hc/en-us/articles/8085703771159'
    );
  }
  return token;
}

async function figmaFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${FIGMA_API}${path}`, {
    headers: { 'X-Figma-Token': getToken() },
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 403) {
      throw new Error('Figma access denied. Check your token and file permissions.');
    }
    if (res.status === 404) {
      throw new Error('Figma file or node not found. Check the URL and node-id.');
    }
    throw new Error(`Figma API error (${res.status}): ${body.slice(0, 200)}`);
  }

  return res.json() as Promise<T>;
}

export async function getFigmaNodes(
  fileKey: string,
  nodeIds: string[]
): Promise<FigmaNodesResponse> {
  const ids = nodeIds.map(encodeURIComponent).join(',');
  return figmaFetch(`/files/${fileKey}/nodes?ids=${ids}`);
}

export async function getFigmaImages(
  fileKey: string,
  nodeIds: string[],
  scale = 2
): Promise<Record<string, string | null>> {
  const ids = nodeIds.map(encodeURIComponent).join(',');
  const data = await figmaFetch<{ images: Record<string, string | null> }>(
    `/images/${fileKey}?ids=${ids}&format=png&scale=${scale}`
  );
  return data.images;
}
