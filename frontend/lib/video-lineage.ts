import { api } from "./axios";
import type { ProjectVideo, VideoTarget } from "./videos";

export interface VideoLineageRecord {
  id: string;
  sourceVideoIds: string[];
  isResult: boolean;
  operations: string[];
  hasClipOperations: boolean;
  container: string | null;
  audioCodec: string | null;
}

export interface VideoVersion {
  video: ProjectVideo;
  lineage: VideoLineageRecord;
  children: VideoVersion[];
  version: number;
  relatedCompositions: string[];
}

export interface VideoFamily {
  root: VideoVersion;
  composite: boolean;
}

export async function fetchVideoLineage(
  target: VideoTarget,
): Promise<VideoLineageRecord[]> {
  const uid = target.shareId ? (target.ownerId ?? target.uid) : target.uid;
  const response = await api.get<{ videos: VideoLineageRecord[] }>(
    `/projects/${uid}/${target.pid}/videos/lineage`,
    {
      headers: { Authorization: `Bearer ${target.token}` },
      params: target.shareId ? { share: target.shareId } : undefined,
    },
  );
  return response.data.videos;
}

const byCreated = (a: ProjectVideo, b: ProjectVideo) =>
  a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);

// A multi-source result owns a small group. Its sources stay in their own
// families and point to it; a resource is rendered only once.
export function buildVideoFamilies(
  videos: ProjectVideo[],
  records: VideoLineageRecord[],
): VideoFamily[] {
  const recordById = new Map(records.map((record) => [record.id, record]));
  const nodes = new Map<string, VideoVersion>();
  for (const video of videos) {
    const lineage = recordById.get(video.id) ?? {
      id: video.id,
      sourceVideoIds: [],
      isResult: false,
      operations: [],
      hasClipOperations: false,
      container: null,
      audioCodec: null,
    };
    nodes.set(video.id, {
      video,
      lineage,
      children: [],
      version: 0,
      relatedCompositions: [],
    });
  }
  const roots: VideoVersion[] = [];
  for (const node of nodes.values()) {
    const sources = node.lineage.sourceVideoIds;
    if (
      sources.length === 1 &&
      sources[0] !== node.video.id &&
      nodes.has(sources[0])
    ) {
      nodes.get(sources[0])!.children.push(node);
    } else {
      roots.push(node);
    }
    if (sources.length > 1) {
      for (const id of new Set(sources)) {
        const source = nodes.get(id);
        if (source) source.relatedCompositions.push(node.video.id);
      }
    }
  }
  const order = (items: VideoVersion[]) => {
    items.sort((a, b) => byCreated(a.video, b.video));
    for (const item of items) order(item.children);
  };
  order(roots);
  for (const root of roots) {
    const family: VideoVersion[] = [];
    const visit = (node: VideoVersion, seen: Set<string>) => {
      if (seen.has(node.video.id)) return;
      seen.add(node.video.id);
      family.push(node);
      for (const child of node.children) visit(child, seen);
    };
    visit(root, new Set());
    family.sort((a, b) => byCreated(a.video, b.video));
    family.forEach((node, index) => {
      node.version = index;
    });
  }
  return roots.map((root) => ({
    root,
    composite: root.lineage.sourceVideoIds.length > 1,
  }));
}

export function videoOperationLabel(operations: string[]): string {
  if (operations[0] === "concat") return "Junção";
  const names: Record<string, string> = {
    trim: "Recortado",
    remove_audio: "Sem áudio",
    speed: "Velocidade",
    watermark: "Marca de água",
    adjust: "Ajustado",
    filter: "Filtro",
    resize: "Redimensionado",
    orient: "Rodado",
    convert: "Convertido",
  };
  if (operations.length > 1) return `${operations.length} operações`;
  return names[operations[0]] ?? "Resultado";
}
