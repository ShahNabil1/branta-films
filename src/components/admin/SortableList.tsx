import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { DndContext, DragOverlay, KeyboardSensor, MeasuringStrategy, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { moveItem } from "@/lib/artwork";

type Item = { id: string };

/**
 * Drag-and-drop vertical list. Order updates instantly, `onReorder` persists it (rolls back on failure),
 * and a toast offers Undo for a few seconds. The drag preview is portalled to <body> so transformed or
 * blurred ancestors can't offset it (which made items jump to the wrong slot).
 */
export function SortableList<T extends Item>({ items, onReorder, render, disabled = false, noun = "Order" }: {
  items: T[]; disabled?: boolean; noun?: string;
  onReorder: (ids: string[]) => Promise<unknown>;
  render: (item: T, index: number, handle: ReactNode) => ReactNode;
}) {
  const [order, setOrder] = useState(items);
  const [active, setActive] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const saving = useRef(false);
  const key = items.map((i) => i.id).join(",");
  // Only resync from props when the server's order really changes (not on every parent render).
  useEffect(() => { if (!saving.current) setOrder(items); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setMounted(true), []);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function persist(next: T[], prev: T[], undoable: boolean) {
    setOrder(next);
    saving.current = true;
    try {
      await onReorder(next.map((i) => i.id));
      if (undoable) toast.success(`${noun} saved`, { duration: 6000, action: { label: "Undo", onClick: () => void persist(prev, next, false) } });
      else toast.success(`${noun} restored`);
    } catch { setOrder(prev); }
    finally { saving.current = false; }
  }
  function end(e: DragEndEvent) {
    setActive(null);
    if (!e.over || e.active.id === e.over.id) return;
    const from = order.findIndex((i) => i.id === e.active.id), to = order.findIndex((i) => i.id === e.over!.id);
    if (from < 0 || to < 0) return;
    void persist(moveItem(order, from, to), order, true);
  }
  const activeItem = order.find((i) => i.id === active);
  const overlay = <DragOverlay dropAnimation={{ duration: 240, easing: "cubic-bezier(0.22,1,0.36,1)" }} zIndex={60}>
    {activeItem ? <div className="admin-theme cursor-grabbing rounded-xl bg-card shadow-2xl ring-2 ring-primary/40">{render(activeItem, order.indexOf(activeItem), <Grip />)}</div> : null}
  </DragOverlay>;
  return <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
    measuring={{ droppable: { strategy: MeasuringStrategy.Always } }} autoScroll={{ threshold: { x: 0, y: 0.15 } }}
    onDragStart={(e) => setActive(String(e.active.id))} onDragCancel={() => setActive(null)} onDragEnd={end}>
    <SortableContext items={order.map((i) => i.id)} strategy={verticalListSortingStrategy} disabled={disabled}>
      <ul className="space-y-2.5">{order.map((item, i) => <Row key={item.id} id={item.id} disabled={disabled}>{(handle) => render(item, i, handle)}</Row>)}</ul>
    </SortableContext>
    {mounted ? createPortal(overlay, document.body) : null}
  </DndContext>;
}

const Grip = () => <span className="grid h-10 w-7 shrink-0 place-items-center rounded-lg text-primary"><GripVertical className="size-5" /></span>;

function Row({ id, disabled, children }: { id: string; disabled: boolean; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled, transition: { duration: 220, easing: "cubic-bezier(0.22,1,0.36,1)" } });
  const handle = <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label="Drag to reorder"
    className={cn("grid h-10 w-7 shrink-0 touch-none place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", disabled ? "cursor-not-allowed opacity-40" : "cursor-grab active:cursor-grabbing")}>
    <GripVertical className="size-5" /></button>;
  return <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }}
    className={cn("relative rounded-xl", isDragging && "z-10 [&>*]:opacity-0 border-2 border-dashed border-primary/40 bg-primary/5")}>{children(handle)}</li>;
}
