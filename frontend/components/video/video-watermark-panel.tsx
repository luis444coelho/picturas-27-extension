"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectInfo } from "@/providers/project-provider";
import { videoErrorCode, type VideoTarget } from "@/lib/videos";
import {
  copyWatermarkFromGallery,
  fetchWatermarkPreview,
  isAcceptedWatermarkFile,
  uploadWatermarkFile,
  WATERMARK_PRESETS,
  WATERMARK_TEXT_MAX,
  type WatermarkPreset,
  type WatermarkValues,
  watermarkStep,
} from "@/lib/video-visual";
import { useVideoEditValidation, type VideoEditSession } from "./use-video-edit";
import { useVideoPreview } from "./use-video-preview";
import { VideoPreviewImage } from "./video-preview-image";
import { VideoVisualValidation } from "./video-visual-validation";

// UC-VID-004: text or image (WATERMARK-001 to 003), preset or manual position
// (004), scale 5–50% of the width (005, D-61) and opacity 10–100% (006), with
// the static preview of the first frame (009, D-62).
export function VideoWatermarkPanel({
  target,
  videoId,
  session,
}: {
  target: VideoTarget;
  videoId: string;
  session: VideoEditSession;
}) {
  const project = useProjectInfo();
  const [values, setValues] = useState<WatermarkValues>({
    type: "text",
    text: "",
    watermarkId: null,
    position: { preset: "bottom-right" },
    scale: 0.2,
    opacity: 0.6,
  });
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const manual = !("preset" in values.position);
  const step = watermarkStep(values);
  const preview = useVideoPreview(target, videoId, step, fetchWatermarkPreview);
  const validation = useVideoEditValidation(target, videoId, step);
  const set = (patch: Partial<WatermarkValues>) => setValues((current) => ({ ...current, ...patch }));
  const busy = session.busy || uploading;

  const acquire = async (load: () => Promise<{ watermarkId: string }>) => {
    setUploading(true);
    setImageError(null);
    try {
      const { watermarkId } = await load();
      set({ watermarkId });
    } catch (cause) {
      set({ watermarkId: null });
      setImageError(
        videoErrorCode(cause) === "INVALID_WATERMARK_CONTENT"
          ? "A imagem tem de ser um PNG ou JPEG válido, até 1 MB e 4096 px."
          : "Não foi possível carregar a imagem.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {step ? (
        <VideoPreviewImage preview={preview} alt="Primeiro fotograma com a marca de água" />
      ) : (
        <p className="text-sm text-muted-foreground">
          Escreve o texto ou escolhe a imagem para ver a pré-visualização.
        </p>
      )}
      <Tabs
        value={values.type}
        onValueChange={(type) => set({ type: type as WatermarkValues["type"] })}
      >
        <TabsList>
          <TabsTrigger value="text" disabled={busy}>Texto</TabsTrigger>
          <TabsTrigger value="image" disabled={busy}>Imagem</TabsTrigger>
        </TabsList>
        <TabsContent value="text" className="flex flex-col gap-1">
          <Label htmlFor="watermark-text">Texto da marca</Label>
          <Input
            id="watermark-text"
            value={values.text}
            maxLength={WATERMARK_TEXT_MAX}
            placeholder="© PictuRAS 2026"
            disabled={busy}
            onChange={(event) => set({ text: event.target.value })}
          />
          {values.type === "text" && !values.text.trim() && (
            <p role="alert" className="text-sm text-destructive">
              O texto é obrigatório.
            </p>
          )}
        </TabsContent>
        <TabsContent value="image" className="flex flex-col gap-2">
          <Label htmlFor="watermark-file">Ficheiro PNG ou JPEG (até 1 MB)</Label>
          <Input
            id="watermark-file"
            type="file"
            accept="image/png,image/jpeg"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (!isAcceptedWatermarkFile(file)) {
                set({ watermarkId: null });
                setImageError("A imagem tem de ser um PNG ou JPEG até 1 MB.");
                return;
              }
              void acquire(() => uploadWatermarkFile(target, file));
            }}
          />
          {project.imgs.length > 0 && (
            <>
              <p className="text-sm">Ou escolhe uma imagem do projeto:</p>
              <div className="grid grid-cols-4 gap-2">
                {project.imgs.map((img) => (
                  <button
                    key={img._id}
                    type="button"
                    disabled={busy}
                    title={img.name}
                    className="overflow-hidden rounded border hover:border-primary"
                    onClick={() => void acquire(() => copyWatermarkFromGallery(target, img._id))}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.name} className="h-14 w-full object-cover" />
                  </button>
                ))}
              </div>
            </>
          )}
          {uploading && <p className="text-sm">A carregar a imagem…</p>}
          {values.watermarkId && !uploading && (
            <p className="text-sm text-muted-foreground">Imagem pronta.</p>
          )}
          {imageError && (
            <p role="alert" className="text-sm text-destructive">
              {imageError}
            </p>
          )}
        </TabsContent>
      </Tabs>
      <div className="flex flex-col gap-1">
        <Label>Posição</Label>
        <div className="flex flex-wrap gap-2">
          {WATERMARK_PRESETS.map(({ id, label }) => (
            <Button
              key={id}
              size="sm"
              variant={!manual && (values.position as { preset: WatermarkPreset }).preset === id ? "default" : "outline"}
              disabled={busy}
              onClick={() => set({ position: { preset: id } })}
            >
              {label}
            </Button>
          ))}
          <Button
            size="sm"
            variant={manual ? "default" : "outline"}
            disabled={busy}
            onClick={() => set({ position: { x: 0, y: 0 } })}
          >
            Coordenadas
          </Button>
        </div>
        {manual && (
          <div className="flex gap-2">
            {(["x", "y"] as const).map((axis) => (
              <div key={axis} className="flex flex-1 flex-col gap-1">
                <Label htmlFor={`watermark-${axis}`}>{axis.toUpperCase()} (px)</Label>
                <Input
                  id={`watermark-${axis}`}
                  type="number"
                  step={1}
                  value={String((values.position as { x: number; y: number })[axis])}
                  disabled={busy}
                  onChange={(event) =>
                    set({
                      position: {
                        ...(values.position as { x: number; y: number }),
                        [axis]: Math.trunc(Number(event.target.value) || 0),
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
      {(
        [
          ["scale", "Escala (largura do quadro)", 0.05, 0.5],
          ["opacity", "Opacidade", 0.1, 1],
        ] as const
      ).map(([field, label, min, max]) => (
        <div key={field} className="flex flex-col gap-1">
          <div className="flex justify-between">
            <Label htmlFor={`watermark-${field}`}>{label}</Label>
            <span className="text-sm tabular-nums">{Math.round(values[field] * 100)}%</span>
          </div>
          <Slider
            id={`watermark-${field}`}
            min={min}
            max={max}
            step={0.01}
            value={[values[field]]}
            disabled={busy}
            onValueChange={([value]) => set({ [field]: Math.round(value * 100) / 100 })}
          />
        </div>
      ))}
      <VideoVisualValidation validation={validation} />
      <Button
        disabled={!step || !validation.valid || busy}
        onClick={() => {
          if (step) void session.submit(step);
        }}
      >
        Aplicar marca de água · 1 crédito
      </Button>
    </div>
  );
}
