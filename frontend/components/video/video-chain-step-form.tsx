"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { VideoTarget } from "@/lib/videos";
import type { VideoRecipeStep } from "@/lib/video-access";
import {
  formatTimecode,
  parseTimecode,
  removeAudioStep,
  speedStep,
  SPEED_PRESETS,
  trimStep,
} from "@/lib/video-edit";
import {
  adjustStep,
  ADJUST_STEP,
  FILTERS,
  filterStep,
  isAcceptedWatermarkFile,
  NEUTRAL_ADJUST,
  orientStep,
  resizeStep,
  watermarkStep,
  WATERMARK_PRESETS,
  type AdjustValues,
  type FilterId,
  type Rotation,
  type WatermarkPreset,
} from "@/lib/video-visual";
import { uploadWatermarkFile } from "@/lib/video-visual-api";
import {
  convertStep,
  VIDEO_CONTAINERS,
  type VideoContainer,
} from "@/lib/video-convert";
import { operationLabel, type ChainOperation } from "@/lib/video-chain";

// Configuration of one step of the chain editor (UC-VID-014 step 2), with the
// step builders of B004, B005 and B007. Nothing is submitted here: the editor
// validates the whole chain with the projects service (ADD T-01). The panels
// of those bolts submit on their own and are not reused (V10).
type Params = Record<string, unknown>;

const num = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const selectClass = "rounded-md border bg-background p-2";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      {children}
    </label>
  );
}

export function VideoChainStepForm({
  operation,
  initial,
  target,
  onSave,
  onCancel,
}: {
  operation: ChainOperation;
  initial?: VideoRecipeStep;
  target: VideoTarget;
  onSave: (step: VideoRecipeStep) => void;
  onCancel: () => void;
}) {
  const p: Params = initial?.parameters ?? {};
  const [start, setStart] = useState(formatTimecode(num(p.startMs, 0)));
  const [end, setEnd] = useState(formatTimecode(num(p.endMs, 1000)));
  const [factor, setFactor] = useState(String(num(p.factor, 2)));
  const [adjust, setAdjust] = useState<AdjustValues>({
    brightness: num(p.brightness, NEUTRAL_ADJUST.brightness),
    contrastFactor: num(p.contrastFactor, NEUTRAL_ADJUST.contrastFactor),
    saturationFactor: num(p.saturationFactor, NEUTRAL_ADJUST.saturationFactor),
  });
  const [filter, setFilter] = useState<FilterId>(
    (p.filter as FilterId) ?? "bw",
  );
  const [width, setWidth] = useState(String(num(p.width, 1280)));
  const [height, setHeight] = useState(String(num(p.height, 720)));
  const [rotation, setRotation] = useState<Rotation>(
    (p.rotation as Rotation) ?? 90,
  );
  const [flipH, setFlipH] = useState(Boolean(p.flipH));
  const [flipV, setFlipV] = useState(Boolean(p.flipV));
  const [container, setContainer] = useState<VideoContainer>(
    (p.target as VideoContainer) ?? "mov",
  );
  const [markType, setMarkType] = useState<"text" | "image">(
    p.type === "image" ? "image" : "text",
  );
  const [markText, setMarkText] = useState(
    typeof p.text === "string" ? p.text : "",
  );
  const [markId, setMarkId] = useState<string | null>(
    typeof p.watermarkId === "string" ? p.watermarkId : null,
  );
  const [markPreset, setMarkPreset] = useState<WatermarkPreset>(
    ((p.position as { preset?: WatermarkPreset })?.preset as WatermarkPreset) ??
      "bottom-right",
  );
  const [scale, setScale] = useState(String(num(p.scale, 0.2)));
  const [opacity, setOpacity] = useState(String(num(p.opacity, 0.8)));
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!isAcceptedWatermarkFile(file)) {
      setUploadError("Escolhe uma imagem PNG ou JPEG até 1 MB.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      setMarkId((await uploadWatermarkFile(target, file)).watermarkId);
    } catch {
      setUploadError("Não foi possível carregar a imagem.");
    } finally {
      setUploading(false);
    }
  };

  // Only trivial client checks (format of the inputs); the rules are the
  // server's (ADD T-01).
  function build(): VideoRecipeStep | null {
    switch (operation) {
      case "trim": {
        const s = parseTimecode(start);
        const e = parseTimecode(end);
        return s === null || e === null ? null : trimStep(s, e);
      }
      case "remove_audio":
        return removeAudioStep();
      case "speed":
        return Number.isFinite(Number(factor))
          ? speedStep(Number(factor))
          : null;
      case "adjust":
        return adjustStep(adjust);
      case "filter":
        return filterStep(filter);
      case "resize":
        return resizeStep(Number(width), Number(height));
      case "orient":
        return orientStep({ rotation, flipH, flipV });
      case "convert":
        return convertStep(container);
      case "watermark":
        return watermarkStep({
          type: markType,
          text: markText,
          watermarkId: markId,
          position: { preset: markPreset },
          scale: Number(scale),
          opacity: Number(opacity),
        });
    }
  }

  const step = build();
  return (
    <div className="flex flex-col gap-3 rounded-md border p-3">
      <p className="font-medium">{operationLabel(operation)}</p>
      {operation === "trim" && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Início (hh:mm:ss.mmm)">
            <Input value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="Fim (hh:mm:ss.mmm)">
            <Input value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>
      )}
      {operation === "remove_audio" && (
        <p className="text-sm">
          Remove todas as faixas de áudio do vídeo neste ponto da cadeia.
        </p>
      )}
      {operation === "speed" && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1">
            {SPEED_PRESETS.map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={Number(factor) === value ? "default" : "outline"}
                onClick={() => setFactor(String(value))}
              >
                {value}×
              </Button>
            ))}
          </div>
          <Field label="Fator">
            <Input
              type="number"
              step="0.05"
              value={factor}
              onChange={(e) => setFactor(e.target.value)}
            />
          </Field>
        </div>
      )}
      {operation === "adjust" && (
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["brightness", "Brilho"],
              ["contrastFactor", "Contraste"],
              ["saturationFactor", "Saturação"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <Input
                type="number"
                min={0}
                max={2}
                step={ADJUST_STEP}
                value={adjust[key]}
                onChange={(e) =>
                  setAdjust({ ...adjust, [key]: Number(e.target.value) })
                }
              />
            </Field>
          ))}
        </div>
      )}
      {operation === "filter" && (
        <Field label="Filtro">
          <select
            className={selectClass}
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterId)}
          >
            {FILTERS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
      )}
      {operation === "resize" && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Largura (px)">
            <Input
              type="number"
              step={2}
              value={width}
              onChange={(e) => setWidth(e.target.value)}
            />
          </Field>
          <Field label="Altura (px)">
            <Input
              type="number"
              step={2}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </Field>
        </div>
      )}
      {operation === "orient" && (
        <div className="flex flex-col gap-2">
          <Field label="Rotação">
            <select
              className={selectClass}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value) as Rotation)}
            >
              {[0, 90, 180, 270].map((value) => (
                <option key={value} value={value}>
                  {value}°
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={flipH}
              onChange={(e) => setFlipH(e.target.checked)}
            />
            Espelho horizontal
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={flipV}
              onChange={(e) => setFlipV(e.target.checked)}
            />
            Espelho vertical
          </label>
        </div>
      )}
      {operation === "convert" && (
        <Field label="Formato de saída (último passo)">
          <select
            className={selectClass}
            value={container}
            onChange={(e) => setContainer(e.target.value as VideoContainer)}
          >
            {VIDEO_CONTAINERS.map((item) => (
              <option key={item} value={item}>
                {item.toUpperCase()}
              </option>
            ))}
          </select>
        </Field>
      )}
      {operation === "watermark" && (
        <div className="flex flex-col gap-2">
          <Field label="Tipo">
            <select
              className={selectClass}
              value={markType}
              onChange={(e) => setMarkType(e.target.value as "text" | "image")}
            >
              <option value="text">Texto</option>
              <option value="image">Imagem</option>
            </select>
          </Field>
          {markType === "text" ? (
            <Field label="Texto">
              <Input
                value={markText}
                onChange={(e) => setMarkText(e.target.value)}
              />
            </Field>
          ) : (
            <Field
              label={
                markId ? "Imagem carregada (substituir)" : "Imagem PNG ou JPEG"
              }
            >
              <Input
                type="file"
                accept="image/png,image/jpeg"
                disabled={uploading}
                onChange={(e) => void upload(e.target.files?.[0])}
              />
            </Field>
          )}
          {uploadError && (
            <p role="alert" className="text-sm text-destructive">
              {uploadError}
            </p>
          )}
          <Field label="Posição">
            <select
              className={selectClass}
              value={markPreset}
              onChange={(e) => setMarkPreset(e.target.value as WatermarkPreset)}
            >
              {WATERMARK_PRESETS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Escala (0.05 a 0.5)">
              <Input
                type="number"
                step="0.01"
                value={scale}
                onChange={(e) => setScale(e.target.value)}
              />
            </Field>
            <Field label="Opacidade (0.1 a 1)">
              <Input
                type="number"
                step="0.01"
                value={opacity}
                onChange={(e) => setOpacity(e.target.value)}
              />
            </Field>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!step}
          onClick={() => step && onSave(step)}
        >
          Guardar passo
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
