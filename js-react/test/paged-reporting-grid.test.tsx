import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { ReportingField, ReportingGridPage, ReportingGridPageRequest, ReportingQuery } from "@bbq-chat/widgets";
import { PagedReportingGrid } from "../src/PagedReportingGrid.js";

const query: ReportingQuery = {
  dataset: "fulfilment", metric: "revenue", groupBy: "orders",
  from: "2026-11-01", to: "2026-11-14",
};
const dimension: ReportingField = {
  id: "orders",
  label: "Orders",
  columns: [{ field: "label", label: "Order" }, { field: "value", label: "Value" }],
  grid: { searchFields: ["label"], sortFields: ["value"], filterFields: ["label"] },
};

afterEach(cleanup);

it("requests bounded pages and emits the stable row key separately from checkbox selection", async () => {
  const client = {
    page: vi.fn(async (request: ReportingGridPageRequest) => ({
      total: 60,
      rows: [{ key: request.offset ? "B" : "A", row: { label: request.offset ? "Order B" : "Order A", value: 10 } }],
    })),
  };
  const activate = vi.fn();
  const select = vi.fn();
  render(<PagedReportingGrid client={client} query={query} dimension={dimension} title="Warehouse"
    onRowActivate={activate} onSelectionChange={select} />);
  const selectedRow = await screen.findByRole<HTMLInputElement>("checkbox", { name: "Select Order A" });
  expect(client.page).toHaveBeenLastCalledWith({ query, offset: 0, limit: 25 }, expect.any(AbortSignal));
  fireEvent.click(selectedRow);
  expect(select).toHaveBeenCalledWith(["A"]);
  expect(activate).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  fireEvent.click(await screen.findByRole("button", { name: "View Order B" }));
  expect(client.page).toHaveBeenLastCalledWith({ query, offset: 25, limit: 25 }, expect.any(AbortSignal));
  expect(activate).toHaveBeenCalledExactlyOnceWith({ kind: "activate", rowKey: "B", row: { label: "Order B", value: 10 } });
  fireEvent.click(screen.getByRole("button", { name: "Previous" }));
  expect((await screen.findByRole<HTMLInputElement>("checkbox", { name: "Select Order A" })).checked).toBe(true);
  fireEvent.click(screen.getByRole("cell", { name: "Order A" }));
  expect(activate).toHaveBeenLastCalledWith({ kind: "activate", rowKey: "A", row: { label: "Order A", value: 10 } });

  fireEvent.click(screen.getByRole("button", { name: "Value" }));
  await screen.findByRole("cell", { name: "Order A" });
  await vi.waitFor(() => expect(client.page).toHaveBeenLastCalledWith(
    { query, offset: 0, limit: 25, sortField: "value", descending: false }, expect.any(AbortSignal)));

  fireEvent.change(screen.getByRole("searchbox", { name: "Search" }), { target: { value: " Order " } });
  fireEvent.change(screen.getByLabelText("Filter field"), { target: { value: "label" } });
  fireEvent.change(screen.getByLabelText("Exact value"), { target: { value: "Order A" } });
  await vi.waitFor(() => expect((screen.getByRole("button", { name: "Apply" }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole("button", { name: "Apply" }));
  await vi.waitFor(() => expect(client.page).toHaveBeenLastCalledWith({
    query, offset: 0, limit: 25, sortField: "value", descending: false, search: "Order",
    filters: [{ field: "label", value: "Order A" }],
  }, expect.any(AbortSignal)));
  expect(select).toHaveBeenLastCalledWith([]);
});

it("ignores a stale page from an aborted query even if the client resolves it", async () => {
  const first = {} as { complete: (page: ReportingGridPage) => void; signal: AbortSignal };
  const client = {
    page: vi.fn(async (request: ReportingGridPageRequest, signal?: AbortSignal) => {
      if (request.query.from === query.from) {
        first.signal = signal!;
        return new Promise<ReportingGridPage>(complete => { first.complete = complete; });
      }
      return { total: 1, rows: [{ key: "B", row: { label: "Order B", value: 20 } }] };
    }),
  };
  const { rerender } = render(<PagedReportingGrid client={client} query={query} dimension={dimension} title="Warehouse" />);
  await vi.waitFor(() => expect(client.page).toHaveBeenCalledTimes(1));
  rerender(<PagedReportingGrid client={client} query={{ ...query, from: "2026-11-02" }} dimension={dimension} title="Warehouse" />);
  await screen.findByRole("cell", { name: "Order B" });
  expect(first.signal.aborted).toBe(true);
  await act(async () => first.complete({ total: 1, rows: [{ key: "A", row: { label: "Order A", value: 10 } }] }));
  expect(screen.queryByRole("cell", { name: "Order A" })).toBeNull();
  expect(screen.getByRole("cell", { name: "Order B" })).toBeDefined();
});

it("clears selected keys when the standalone grid changes client scope", async () => {
  const client = {
    page: vi.fn(async () => ({ total: 1, rows: [{ key: "A", row: { label: "Order A", value: 10 } }] })),
  };
  const replacement = { page: vi.fn(client.page) };
  const select = vi.fn();
  const { rerender } = render(<PagedReportingGrid client={client} query={query} dimension={dimension}
    title="Warehouse" onSelectionChange={select} />);
  fireEvent.click(await screen.findByRole("checkbox", { name: "Select Order A" }));
  expect(select).toHaveBeenLastCalledWith(["A"]);
  rerender(<PagedReportingGrid client={replacement} query={query} dimension={dimension}
    title="Warehouse" onSelectionChange={select} />);
  expect((await screen.findByRole<HTMLInputElement>("checkbox", { name: "Select Order A" })).checked).toBe(false);
  expect(select.mock.calls).toEqual([[["A"]], [[]]]);
});
