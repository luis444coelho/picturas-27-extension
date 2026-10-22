// Formatters of the video information panel (UC-VID-007 RN4, ADD 4.2). No
// imports, so Node can test them with type stripping.

export const UNAVAILABLE = "Indisponível";

// hh:mm:ss.mmm (INFO-002).
export function formatPreciseDuration(ms: number): string {
  const total = Math.round(ms);
  const h = Math.floor(total / 3_600_000);
  const m = Math.floor((total % 3_600_000) / 60_000);
  const s = Math.floor((total % 60_000) / 1000);
  const millis = total % 1000;
  const two = (n: number) => String(n).padStart(2, "0");
  return `${two(h)}:${two(m)}:${two(s)}.${String(millis).padStart(3, "0")}`;
}

// Display resolution, rotation tag already applied (INFO-003, Q-ADD-13).
export function formatResolution(width: number, height: number): string {
  return `${width} × ${height} px`;
}

// MB below 1 GB, GB from there, 2 decimals; 1 MB = 1024² and 1 GB = 1024³ bytes (INFO-005).
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
}

// 2 decimals (INFO-006).
export function formatFps(num: number, den: number): string {
  return `${(num / den).toFixed(2)} fps`;
}

const CODEC_LABELS: Record<string, string> = {
  h264: "H.264",
  hevc: "H.265",
  mpeg4: "MPEG-4",
  aac: "AAC",
  mp3: "MP3",
};

export function codecLabel(codec: string): string {
  return CODEC_LABELS[codec] ?? codec.toUpperCase();
}

// "MOV (H.264 / AAC)", or "MP4 (H.264 / sem áudio)" when audioCodec is null (INFO-004).
export function formatVideoFormat(
  container: string,
  videoCodec: string,
  audioCodec: string | null,
): string {
  const audio = audioCodec === null ? "sem áudio" : codecLabel(audioCodec);
  return `${container.toUpperCase()} (${codecLabel(videoCodec)} / ${audio})`;
}
