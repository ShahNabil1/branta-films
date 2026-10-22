import { expect, it, vi } from "vitest";

const { tables } = vi.hoisted(() => ({ tables: vi.fn() }));
vi.mock("@/lib/security-middleware", () => ({ requireAccountAccess: {} }));
vi.mock("@tanstack/react-start", () => ({
  createMiddleware: () => { const chain = { middleware: () => chain, server: () => chain }; return chain; },
  createServerFn: () => { const chain = { middleware: () => chain, inputValidator: () => chain, handler: (fn: unknown) => fn }; return chain; },
}));
import { getAdminOverview } from "@/lib/admin.functions";

it("reads catalogue and accounts without reading or storing general Activity", async () => {
  tables.mockImplementation((table: string) => {
    if (table === "activity_log") throw new Error("Activity storage is forbidden");
    const query = { select: () => query, order: () => query, range: async () => ({ data: [], error: null }) };
    return query;
  });
  const read = getAdminOverview as unknown as (input: unknown) => Promise<unknown>;
  const result = await read({ context: { supabase: { from: tables } } });
  expect(tables.mock.calls.map(([table]) => table)).toEqual(["series", "episodes", "profiles", "user_roles", "series_unlocks"]);
  expect(result).not.toHaveProperty("activity");
});