"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { VideoTarget } from "@/lib/videos";
import type { VideoRecipeStep } from "@/lib/video-access";
import {
  CHAIN_OPERATIONS,
  operationLabel,
  type ChainOperation,
  type StepAddress,
} from "@/lib/video-chain";
import { SortableList } from "./video-chain-step-list";
import { VideoChainPresets } from "./video-chain-presets";
import { OPERATION_CONFIGS } from "./video-operation-config";
import type { ConfigSource } from "./operation-config";
import type { Composition } from "./use-composition";

// Ordered list of the operations of one chain (the video of "Aplicar várias
// operações", one clip of the Movie Maker, or the steps after the concat):
// add, configure, reorder and remove, with no fixed number (D-86). Each
// operation is configured with the component of the simple edit (ADR-020),
// in a dialog; the draft is validated inside the whole chain (CHAIN-003).
export interface StepItem {
  key: string;
  step: VideoRecipeStep;
}

export interface StepDraft {
  index: number | null; // null: a new step at the end
  step: VideoRecipeStep | null;
}

let counter = 0;
export const newKey = () => `s${(counter += 1)}`;
export const toItems = (steps: VideoRecipeStep[]): StepItem[] =>
  steps.map((step) => ({ key: newKey(), step }));

// The list with the draft applied, for the validation of the whole chain.
export function withDraft(
  items: StepItem[],
  draft: StepDraft | null,
): VideoRecipeStep[] {
  const steps = items.map((item) => item.step);
  if (!draft?.step) return steps;
  if (draft.index === null) return [...steps, draft.step];
  return steps.map((step, i) => (i === draft.index ? draft.step! : step));
}

export function VideoOperationChain({
  target,
  title,
  items,
  onChange,
  onDraft,
  composition,
  addressOf,
  sourceOf,
  allowConvert,
  disabled,
}: {
  target: VideoTarget;
  title: string;
  items: StepItem[];
  onChange: (items: StepItem[]) => void;
  onDraft: (draft: StepDraft | null) => void;
  composition: Composition;
  addressOf: (index: number) => StepAddress;
  sourceOf: (index: number) => ConfigSource | null; // null while unknown
  allowConvert: boolean;
  disabled: boolean;
}) {
  const operations = CHAIN_OPERATIONS.filter(
    (op) => allowConvert || op.id !== "convert",
  );
  const [adding, setAdding] = useState<ChainOperation>(operations[0].id);
  // The input properties are fixed when the dialog opens: the chain is
  // validated again while the form changes, and the form must not remount.
  const [editing, setEditing] = useState<{
    index: number | null;
    operation: ChainOperation;
    source: ConfigSource;
  } | null>(null);

  const close = () => {
    setEditing(null);
    onDraft(null);
  };
  const save = (step: VideoRecipeStep) => {
    if (!editing) return;
    onChange(
      editing.index === null
        ? [...items, { key: newKey(), step }]
        : items.map((item, i) =>
            i === editing.index ? { ...item, step } : item,
          ),
    );
    close();
  };

  const position = editing ? (editing.index ?? items.length) : 0;
  const source = editing?.source ?? null;
  const open = (index: number | null, operation: ChainOperation) => {
    const at = sourceOf(index ?? items.length);
    if (at) setEditing({ index, operation, source: at });
  };
  const Config = editing ? OPERATION_CONFIGS[editing.operation] : null;

  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-medium">{title}</h3>
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">Sem operações.</p>
      )}
      <SortableList
        items={items}
        disabled={disabled}
        onChange={onChange}
        render={(item, index) => {
          const errors = composition.errorsAt(addressOf(index));
          return (
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span>
                  {index + 1}. {operationLabel(item.step.operation)}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={disabled || !sourceOf(index)}
                  onClick={() =>
                    open(index, item.step.operation as ChainOperation)
                  }
                >
                  Configurar
                </Button>
              </div>
              {errors.map((message, i) => (
                <p key={i} role="alert" className="text-destructive">
                  {message}
                </p>
              ))}
            </div>
          );
        }}
      />
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          Operação
          <select
            className="rounded-md border bg-background p-2"
            value={adding}
            disabled={disabled}
            onChange={(e) => setAdding(e.target.value as ChainOperation)}
          >
            {operations.map((op) => (
              <option key={op.id} value={op.id}>
                {op.label}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || !sourceOf(items.length)}
          onClick={() => open(null, adding)}
        >
          Acrescentar operação
        </Button>
      </div>
      <VideoChainPresets
        lists={[{ id: "main", label: title }]}
        canSave={items.length > 0}
        currentSteps={items.map((item) => item.step)}
        onLoad={(_, steps) => {
          if (
            items.length &&
            !window.confirm(
              "Substituir as operações desta lista pelas da predefinição?",
            )
          )
            return;
          onChange(toItems(steps));
        }}
        disabled={disabled}
      />
      <Dialog open={editing !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing && operationLabel(editing.operation)}
            </DialogTitle>
            <DialogDescription>{title}</DialogDescription>
          </DialogHeader>
          {editing && Config && source && (
            <Config
              key={`${editing.index}-${editing.operation}`}
              target={target}
              source={source}
              initial={
                editing.index === null ? null : items[editing.index]?.step
              }
              disabled={disabled}
              chainValidation={composition.validationAt(addressOf(position))}
              onStepChange={(step) => onDraft({ index: editing.index, step })}
              renderActions={({ step, validation, busy, beforeSubmit }) => (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    disabled={
                      !step || validation.pending || !validation.valid || busy
                    }
                    onClick={() => {
                      beforeSubmit();
                      if (step) save(step);
                    }}
                  >
                    Guardar operação
                  </Button>
                  <Button type="button" variant="outline" onClick={close}>
                    Cancelar
                  </Button>
                </div>
              )}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
