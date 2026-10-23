"use client";

import type { ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { moveItem, removeItem } from "@/lib/video-chain";

// Ordered list of the chain editor and of the concat timeline (CHAIN-004,
// CHAIN-015, CONCAT-003, CONCAT-013): drag with dnd-kit or move with the
// arrows (UC-VID-013 step 3). The image components of the toolbar
// (applied-tools-list.tsx, sortable-tool-item.tsx) are not used (rule 2.6).
export interface SortableEntry {
  key: string;
}

function Row({
  id,
  index,
  count,
  disabled,
  onMove,
  onRemove,
  children,
}: {
  id: string;
  index: number;
  count: number;
  disabled: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id,
      disabled,
    });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-start gap-2 rounded-md border bg-background p-2"
    >
      <button
        type="button"
        className="mt-1 cursor-grab text-muted-foreground"
        aria-label="Arrastar"
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
      <div className="flex gap-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Subir"
          disabled={disabled || index === 0}
          onClick={() => onMove(index, index - 1)}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Descer"
          disabled={disabled || index === count - 1}
          onClick={() => onMove(index, index + 1)}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Remover"
          disabled={disabled}
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}

export function SortableList<T extends SortableEntry>({
  items,
  onChange,
  disabled = false,
  render,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  disabled?: boolean;
  render: (item: T, index: number) => ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const move = (from: number, to: number) =>
    onChange(moveItem(items, from, to));
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    move(
      items.findIndex((item) => item.key === active.id),
      items.findIndex((item) => item.key === over.id),
    );
  };
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.key)}
        strategy={verticalListSortingStrategy}
      >
        <ol className="flex flex-col gap-2">
          {items.map((item, index) => (
            <Row
              key={item.key}
              id={item.key}
              index={index}
              count={items.length}
              disabled={disabled}
              onMove={move}
              onRemove={(at) => onChange(removeItem(items, at))}
            >
              {render(item, index)}
            </Row>
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}
