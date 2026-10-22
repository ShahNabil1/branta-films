import { useEffect, useState, type ReactNode } from "react";
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { moveItem } from "@/lib/artwork";

type Item = { id: string };

/** Drag-and-drop vertical list. Order updates instantly; `onReorder` persists it (rolls back on failure). */
export function SortableList<T extends Item>({ items, onReorder, render, disabled = false }: {
  items: T[]; disabled?: boolean;
  onReorder: (ids: string[]) => Promise<unknown>;
  render: (item: T, index: number, handle: ReactNode) => ReactNode;
}) {
  const [order, setOrder] = useState(items);
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => setOrder(items), [items]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  async function end(e: DragEndEvent) {
    setActive(null);
    if (!e.over || e.active.id === e.over.id) return;
    const from = order.findIndex((i) => i.id === e.active.id), to = order.findIndex((i) => i.id === e.over!.id);
    const prev = order, next = moveItem(order, from, to);
    setOrder(next);
    try { await onReorder(next.map((i) => i.id)); } catch { setOrder(prev); }
  }
  const activeItem = order.find((i) => i.id === active);
  return <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    onDragStart={(e) => setActive(String(e.active.id))} onDragCancel={() => setActive(null)} onDragEnd={(e) => void end(e)}>
    <SortableContext items={order.map((i) => i.id)} strategy={verticalListSortingStrategy} disabled={disabled}>
      <ul className="space-y-2.5">{order.map((item, i) => <Row key={item.id} id={item.id} disabled={disabled}>{(handle) => render(item, i, handle)}</Row>)}</ul>
    </SortableContext>
    <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.22,1,0.36,1)" }}>
      {activeItem ? <div className="admin-theme scale-[1.02] cursor-grabbing rounded-xl shadow-2xl ring-2 ring-primary/40">{render(activeItem, order.indexOf(activeItem), <Grip />)}</div> : null}
    </DragOverlay>
  </DndContext>;
}

const Grip = () => <span className="grid h-10 w-7 place-items-center rounded-lg text-muted-foreground"><GripVertical className="size-5" /></span>;

function Row({ id, disabled, children }: { id: string; disabled: boolean; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const handle = <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label="Drag to reorder"
    className={cn("grid h-10 w-7 shrink-0 touch-none place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", disabled ? "cursor-not-allowed opacity-40" : "cursor-grab active:cursor-grabbing")}>
    <GripVertical className="size-5" /></button>;
  return <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={cn("relative", isDragging && "z-10 opacity-40")}>{children(handle)}</li>;
}
