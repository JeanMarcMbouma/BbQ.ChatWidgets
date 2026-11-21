import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { ReportingCatalog, ReportingQuery } from '@bbq-chat/widgets';
import { describe, expect, it, vi } from 'vitest';
import { REPORTING_INITIAL_PRESET, ReportingComponent, type ReportingWorkspaceAction } from './reporting.component';

const query: ReportingQuery = {
  dataset: 'fulfilment', metric: 'revenue', groupBy: 'paged-order', from: '2026-11-01', to: '2026-11-14',
};

const catalog: ReportingCatalog = {
  datasets: [{
    id: 'fulfilment',
    label: 'Order fulfilment',
    metrics: [{ id: 'revenue', label: 'Order value' }],
    dimensions: [{
      id: 'paged-order',
      label: 'Warehouse orders',
      columns: [{ field: 'label', label: 'Order' }],
      grid: { searchFields: ['label'], sortFields: ['label'], filterFields: [] },
    }],
  }],
  presets: [{
    id: 'warehouse-grid',
    definition: {
      title: 'Warehouse operations', kind: 'report',
      tiles: [{ title: 'Warehouse orders', view: 'grid', query }],
    },
  }],
};

describe('reporting workspace', () => {
  it('loads Warehouse operations from the paged endpoint and routes row activation to the host', async () => {
    TestBed.configureTestingModule({
      imports: [ReportingComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: REPORTING_INITIAL_PRESET, useValue: 'warehouse-grid' },
      ],
    });

    const fixture = TestBed.createComponent(ReportingComponent);
    const http = TestBed.inject(HttpTestingController);
    const load = vi.spyOn(fixture.componentInstance, 'load');
    const events: ReportingWorkspaceAction[] = [];
    fixture.componentInstance.reportingAction.subscribe(event => events.push(event));
    fixture.componentRef.setInput('resolveAction', () => 'warehouse-order-details');
    fixture.detectChanges();
    http.expectOne('/api/reporting/catalog').flush(catalog);
    http.expectOne('/api/reporting/saved').flush([]);
    await load.mock.results[0].value;
    fixture.detectChanges();

    expect(fixture.componentInstance.error).toBe('');
    http.expectNone('/api/reporting/run');
    const page = http.expectOne('/api/reporting/page');
    expect(page.request.method).toBe('POST');
    expect(page.request.body).toMatchObject({ query, offset: 0, limit: 25 });
    page.flush({
      total: 2400,
      rows: Array.from({ length: 25 }, (_, index) => {
        const key = `N-${1001 + index}`;
        return { key, row: { label: key, value: index + 20 } };
      }),
    });
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('.content h2')?.textContent).toContain('Warehouse operations');
    expect(root.querySelector('bbq-paged-reporting-grid footer [role="status"]')?.textContent).toContain('1–25 of 2,400');
    expect(root.querySelector('bbq-paged-reporting-grid nav[aria-label="Grid pagination"]')?.textContent)
      .toContain('Page 1 of 96');
    expect(root.querySelectorAll('bbq-paged-reporting-grid tbody tr')).toHaveLength(25);
    root.querySelector<HTMLInputElement>('bbq-paged-reporting-grid tbody input')!.click();
    expect(events).toEqual([]);
    root.querySelector<HTMLButtonElement>('bbq-paged-reporting-grid tbody .row-action')!.click();
    expect(events).toEqual([{
      actionName: 'warehouse-order-details',
      tile: catalog.presets[0].definition.tiles[0],
      tileIndex: 0,
      payload: { kind: 'activate', rowKey: 'N-1001', row: { label: 'N-1001', value: 20 } },
    }]);
    http.verify();
  });

  it('forwards a chart point through the workspace with the original tile context', async () => {
    TestBed.configureTestingModule({
      imports: [ReportingComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(ReportingComponent);
    const http = TestBed.inject(HttpTestingController);
    const chartTile = {
      title: 'Sales by warehouse', view: 'bar' as const, query: { ...query, groupBy: null },
    };
    const events: ReportingWorkspaceAction[] = [];
    fixture.componentInstance.reportingAction.subscribe(event => events.push(event));
    fixture.componentRef.setInput('resolveAction', (tile: typeof chartTile) => tile.view === 'bar' ? 'sales-details' : undefined);
    const load = vi.spyOn(fixture.componentInstance, 'load');
    fixture.detectChanges();
    http.expectOne('/api/reporting/catalog').flush({
      ...catalog,
      presets: [{
        id: 'sales-chart',
        definition: { title: 'Sales chart', kind: 'report', tiles: [chartTile] },
      }],
    });
    http.expectOne('/api/reporting/saved').flush([]);
    const run = await vi.waitFor(() => http.expectOne('/api/reporting/run'));
    run.flush([{ label: 'Leeds', value: 56 }]);
    await load.mock.results[0].value;
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    await vi.waitFor(() => expect(root.querySelector('svg [data-report-command="point"]')).not.toBeNull());
    const mark = root.querySelector<SVGElement>('svg [data-report-command="point"]')!;
    mark.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(events).toEqual([{
      actionName: 'sales-details',
      tile: chartTile,
      tileIndex: 0,
      payload: { kind: 'select', source: 'source-0', rowIndices: [0], row: { label: 'Leeds', value: 56, x: 1, date: null } },
    }]);
    http.verify();
  });
});
