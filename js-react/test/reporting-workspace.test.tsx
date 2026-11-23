import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ReportingWorkspace,
  type ReportingCatalog,
  type ReportingDocument,
  type ReportingQuery,
  type ReportingWorkspaceClient,
} from "../src";

afterEach(cleanup);

const query: ReportingQuery = { dataset: "orders", metric: "revenue", groupBy: "status", from: "2026-11-01", to: "2026-11-14" };
const pagedQuery = { ...query, groupBy: "warehouse-orders" };
const preset: ReportingDocument = {
  title: "Warehouse dashboard", kind: "dashboard", tiles: [
    { title: "Orders to review", view: "grid", query: pagedQuery },
    { title: "Value by status", view: "bar", query },
  ],
};
const catalog: ReportingCatalog = {
  presets: [{ id: "warehouse", definition: preset }],
  datasets: [{
    id: "orders", label: "Orders", metrics: [{ id: "revenue", label: "Revenue" }],
    dimensions: [
      { id: "status", label: "Status" },
      { id: "warehouse-orders", label: "Warehouse orders", columns: [{ field: "label", label: "Order" }],
        grid: { searchFields: ["label"], sortFields: ["label"], filterFields: [] } },
    ],
  }],
};

function reportingClient() {
  return {
    catalog: vi.fn<ReportingWorkspaceClient["catalog"]>().mockResolvedValue(catalog),
    list: vi.fn<ReportingWorkspaceClient["list"]>().mockResolvedValue([]),
    run: vi.fn<ReportingWorkspaceClient["run"]>().mockResolvedValue([{ label: "Complete", value: 120 }]),
    page: vi.fn<ReportingWorkspaceClient["page"]>().mockResolvedValue({
      total: 1, rows: [{ key: "order-42", row: { label: "N-1042", value: 80 } }],
    }),
    create: vi.fn<ReportingWorkspaceClient["create"]>().mockImplementation(async definition => ({ id: "saved-1", definition })),
    update: vi.fn<ReportingWorkspaceClient["update"]>().mockResolvedValue(undefined),
    remove: vi.fn<ReportingWorkspaceClient["remove"]>().mockResolvedValue(undefined),
  };
}

describe("React reporting workspace", () => {
  it("uses the paging and snapshot endpoints and emits host-named chart and row actions", async () => {
    const client = reportingClient();
    const onAction = vi.fn();
    const { container } = render(<ReportingWorkspace client={client} initialPresetId="warehouse"
      resolveAction={tile => tile.view === "grid" ? "view-order" : "inspect-status"} onReportingAction={onAction} />);

    const warehouse = await screen.findByRole("region", { name: "Orders to review" });
    fireEvent.click(await within(warehouse).findByRole("button", { name: "View N-1042" }));
    await waitFor(() => {
      expect(container.querySelector("[data-report-command=point]")).not.toBeNull();
    });
    fireEvent.click(container.querySelector("[data-report-command=point]")!);

    expect(client.run).toHaveBeenCalledTimes(1);
    expect(client.run).toHaveBeenCalledWith(query, expect.any(AbortSignal));
    expect(client.page).toHaveBeenCalledWith(expect.objectContaining({ query: pagedQuery, offset: 0, limit: 25 }), expect.any(AbortSignal));
    expect(onAction.mock.calls.map(([event]) => event)).toEqual([
      { actionName: "view-order", tile: preset.tiles[0], tileIndex: 0,
        payload: { kind: "activate", rowKey: "order-42", row: { label: "N-1042", value: 80 } } },
      { actionName: "inspect-status", tile: preset.tiles[1], tileIndex: 1,
        payload: { kind: "select", source: "source-0", rowIndices: [0],
          row: { label: "Complete", value: 120, x: 1, date: null } } },
    ]);
  });

  it("authors a custom report, saves it and reopens its rendered result", async () => {
    const client = reportingClient();
    render(<ReportingWorkspace client={client} />);
    await screen.findByRole("heading", { level: 2, name: "Warehouse dashboard" });

    fireEvent.click(screen.getByRole("button", { name: "New report" }));
    fireEvent.change(screen.getByLabelText("Title", { exact: true }), { target: { value: "Daily trends" } });
    fireEvent.change(screen.getByLabelText("Tile title"), { target: { value: "Order trend" } });
    fireEvent.change(screen.getByLabelText("Display"), { target: { value: "time-line" } });
    fireEvent.click(screen.getByRole("button", { name: "Save as new" }));

    const navigation = screen.getByRole("navigation", { name: "Reports and dashboards" });
    const report = await within(navigation).findByRole("button", { name: "Daily trends" });
    expect(client.create).toHaveBeenCalledWith({
      title: "Daily trends", kind: "report", tiles: [
        { title: "Order trend", view: "time-line", query: { ...query, groupBy: null } },
      ],
    }, expect.any(AbortSignal));
    fireEvent.click(report);

    expect(await screen.findByRole("region", { name: "Report results" })).toBeTruthy();
    expect(await screen.findByRole("button", { name: "Edit report" })).toBeTruthy();
    expect(client.run).toHaveBeenCalledWith({ ...query, groupBy: null }, expect.any(AbortSignal));
  });

  it("authors portable filters and applies them after reopening the saved report", async () => {
    const client = reportingClient();
    client.catalog.mockResolvedValue({
      ...catalog,
      datasets: [{ ...catalog.datasets[0], inputs: [
        { id: "warehouse", label: "Warehouse", role: "Filter", type: "Text", options: [{ label: "Leeds", value: "Leeds" }] },
        { id: "channel", label: "Channel", role: "Filter", type: "Text", options: [{ label: "Retail", value: "retail" }] },
      ] }],
      presets: [{ id: "warehouse", definition: { ...preset, filters: [{ input: "warehouse" }] } }],
    });
    render(<ReportingWorkspace client={client} />);
    fireEvent.click(await screen.findByRole("button", { name: "Edit dashboard" }));

    fireEvent.change(screen.getByLabelText("Add filter"), { target: { value: "channel" } });
    fireEvent.change(screen.getByLabelText("Channel label"), { target: { value: "Sales channel" } });
    fireEvent.click(screen.getByRole("button", { name: "Move Channel filter up" }));
    fireEvent.click(screen.getByRole("button", { name: "Save as new" }));
    const nav = screen.getByRole("navigation", { name: "Reports and dashboards" });
    await waitFor(() => expect(within(nav).getAllByRole("button", { name: "Warehouse dashboard" })).toHaveLength(2));
    expect(client.create.mock.calls[0][0].filters).toEqual([
      { input: "channel", label: "Sales channel" }, { input: "warehouse" },
    ]);
    fireEvent.click(within(nav).getAllByRole("button", { name: "Warehouse dashboard" })[1]);
    const salesChannel = await screen.findByLabelText("Sales channel");
    fireEvent.change(salesChannel, { target: { value: "0" } });
    await waitFor(() => expect(client.run).toHaveBeenLastCalledWith({
      ...query, inputs: [{ id: "channel", value: "retail" }],
    }, expect.any(AbortSignal)));
  });

  it("does not run an old report on a replacement client", async () => {
    const client = reportingClient();
    const replacement = reportingClient();
    replacement.catalog.mockResolvedValue({ datasets: [], presets: [] });
    const { rerender } = render(<ReportingWorkspace client={client} />);
    const warehouse = await screen.findByRole("region", { name: "Orders to review" });
    await within(warehouse).findByRole("cell", { name: "N-1042" });
    expect(client.page).toHaveBeenCalledTimes(1);

    rerender(<ReportingWorkspace client={replacement} />);
    expect(screen.queryByRole("region", { name: "Orders to review" })).toBeNull();
    expect(await screen.findByText("No reporting datasets are available.")).toBeTruthy();
    expect(replacement.page).not.toHaveBeenCalled();
    expect(replacement.run).not.toHaveBeenCalled();
  });
});
