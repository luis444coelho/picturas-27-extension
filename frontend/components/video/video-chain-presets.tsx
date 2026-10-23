"use client";

import { useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/providers/session-provider";
import type { VideoApiError } from "@/lib/videos";
import type { VideoRecipeStep } from "@/lib/video-access";
import {
  chainErrorMessage,
  cleanPresetName,
  PRESET_NAME_MAX,
  withoutServerFields,
} from "@/lib/video-chain";
import {
  createVideoPreset,
  deleteVideoPreset,
  listVideoPresets,
  updateVideoPreset,
} from "@/lib/video-chain-api";

// Video chain presets (CHAIN-014, UC-VID-014 FA3, D-83, D-84): the user's own,
// never shared, without concat. Loading replaces the steps of the chosen list.
// Loading into a batch is out of this construction (D-06).
type ListId = "main" | number;

function presetError(cause: unknown) {
  const data = axios.isAxiosError(cause)
    ? (cause.response?.data as VideoApiError | undefined)
    : undefined;
  const code = data?.error.code;
  return (
    (code &&
      chainErrorMessage(
        code,
        (data?.error.details ?? {}) as Record<string, unknown>,
      )) ||
    "Não foi possível guardar a predefinição."
  );
}

export function VideoChainPresets({
  lists,
  canSave,
  currentSteps,
  onLoad,
  disabled,
}: {
  lists: { id: ListId; label: string }[];
  canSave: boolean;
  currentSteps: VideoRecipeStep[];
  onLoad: (list: ListId, steps: VideoRecipeStep[]) => void;
  disabled: boolean;
}) {
  const session = useSession();
  const uid = session.user._id;
  const qc = useQueryClient();
  const queryKey = ["videoPresets", uid];
  const presets = useQuery({
    queryKey,
    queryFn: () => listVideoPresets(uid, session.token),
  });
  const [name, setName] = useState("");
  const [into, setInto] = useState<ListId>("main");
  const [error, setError] = useState<string | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey });

  const save = useMutation({
    mutationFn: () =>
      createVideoPreset(
        uid,
        session.token,
        cleanPresetName(name)!,
        withoutServerFields(currentSteps),
      ),
    onSuccess: () => {
      setName("");
      setError(null);
      refresh();
    },
    onError: (cause) => setError(presetError(cause)),
  });
  const rename = useMutation({
    mutationFn: ({ id, next }: { id: string; next: string }) =>
      updateVideoPreset(uid, session.token, id, { name: next }),
    onSuccess: refresh,
    onError: (cause) => setError(presetError(cause)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteVideoPreset(uid, session.token, id),
    onSuccess: refresh,
    onError: (cause) => setError(presetError(cause)),
  });

  return (
    <section className="flex flex-col gap-2 rounded-md border p-3">
      <h3 className="font-medium">Predefinições de vídeo</h3>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          Nome
          <Input
            value={name}
            maxLength={PRESET_NAME_MAX}
            disabled={!canSave || disabled}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <Button
          type="button"
          variant="outline"
          disabled={
            !canSave || disabled || !cleanPresetName(name) || save.isPending
          }
          onClick={() => save.mutate()}
        >
          Guardar como predefinição
        </Button>
      </div>
      {!canSave && (
        <p className="text-muted-foreground">
          Só uma cadeia sem junção, com pelo menos um passo, pode ser guardada.
        </p>
      )}
      {lists.length > 1 && (
        <label className="flex flex-col gap-1">
          Carregar em
          <select
            className="rounded-md border bg-background p-2"
            value={String(into)}
            onChange={(e) =>
              setInto(
                e.target.value === "main" ? "main" : Number(e.target.value),
              )
            }
          >
            {lists.map((l) => (
              <option key={String(l.id)} value={String(l.id)}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {presets.isLoading && <p>A carregar…</p>}
      <ul className="flex flex-col gap-1">
        {(presets.data ?? []).map((preset) => (
          <li
            key={preset.id}
            className="flex items-center justify-between gap-2"
          >
            <span className="truncate">
              {preset.name} · {preset.steps.length}{" "}
              {preset.steps.length === 1 ? "passo" : "passos"}
            </span>
            <span className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={() => onLoad(into, preset.steps)}
              >
                Carregar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={disabled}
                onClick={() => {
                  const next = cleanPresetName(
                    window.prompt("Novo nome", preset.name) ?? "",
                  );
                  if (next) rename.mutate({ id: preset.id, next });
                }}
              >
                Mudar o nome
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={disabled}
                onClick={() =>
                  window.confirm(`Apagar «${preset.name}»?`) &&
                  remove.mutate(preset.id)
                }
              >
                Apagar
              </Button>
            </span>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
