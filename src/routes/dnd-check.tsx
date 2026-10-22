import { createFileRoute } from "@tanstack/react-router";
import { SortableList } from "@/components/admin/SortableList";
const items = ["A", "B", "C", "D"].map((t) => ({ id: t, t }));
export const Route = createFileRoute("/dnd-check")({ component: () => <div className="admin-theme p-10"><SortableList items={items} onReorder={async () => {}} render={(i, _n, h) => <div className="flex h-20 items-center gap-3 rounded-xl border bg-card p-2">{h}<span data-t>{i.t}</span></div>} /></div> });
