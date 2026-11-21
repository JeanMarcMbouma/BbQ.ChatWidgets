import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { ReportingField, ReportingGridRowActivation, ReportingQuery } from '@bbq-chat/widgets';
import { describe, expect, it } from 'vitest';
import { PagedReportingGridComponent } from './paged-grid.component';

const query: ReportingQuery = {
  dataset: 'fulfilment', metric: 'revenue', groupBy: 'paged-order', from: '2026-11-01', to: '2026-11-14',
};
const dimension: ReportingField = {
  id: 'paged-order', label: 'Orders',
  columns: [{ field: 'label', label: 'Order' }, { field: 'value', label: 'Value' }],
  grid: { searchFields: ['label'], sortFields: ['value'], filterFields: [] },
};

describe('paged reporting grid', () => {
  it('fetches pages with complete query state and preserves selection by key', () => {
    TestBed.configureTestingModule({
      imports: [PagedReportingGridComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(PagedReportingGridComponent);
    const http = TestBed.inject(HttpTestingController);
    const component = fixture.componentInstance;
    const selected: (readonly string[])[] = [];
    const activated: ReportingGridRowActivation[] = [];
    component.selectionChange.subscribe(keys => selected.push(keys));
    component.rowActivate.subscribe(event => activated.push(event));
    fixture.componentRef.setInput('title', 'Warehouse orders');
    fixture.componentRef.setInput('query', query);
    fixture.componentRef.setInput('dimension', dimension);
    fixture.detectChanges();

    function page(offset: number, key: string, expectedQuery = query) {
      const request = http.expectOne('/api/reporting/page');
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toMatchObject({ query: expectedQuery, offset, limit: 25 });
      request.flush({ total: 60, rows: [{ key, row: { label: key, value: 30 } }] });
      fixture.detectChanges();
    }

    page(0, 'N-1001');
    const root: HTMLElement = fixture.nativeElement;
    root.querySelector<HTMLInputElement>('tbody input')!.click();
    expect(activated).toEqual([]);
    root.querySelector<HTMLTableCellElement>('tbody td:nth-child(2)')!.click();
    root.querySelectorAll<HTMLButtonElement>('footer button')[1].click();
    page(25, 'N-1026');
    expect(root.textContent).toContain('1 selected');
    expect(root.querySelector<HTMLInputElement>('tbody input')!.checked).toBe(false);
    root.querySelector<HTMLInputElement>('tbody input')!.click();
    root.querySelector<HTMLButtonElement>('tbody .row-action')!.click();
    expect(activated).toEqual([
      { kind: 'activate', rowKey: 'N-1001', row: { label: 'N-1001', value: 30 } },
      { kind: 'activate', rowKey: 'N-1026', row: { label: 'N-1026', value: 30 } },
    ]);
    root.querySelectorAll<HTMLButtonElement>('footer button')[0].click();
    page(0, 'N-1001');
    expect(root.querySelector<HTMLInputElement>('tbody input')!.checked).toBe(true);
    expect(selected).toEqual([['N-1001'], ['N-1001', 'N-1026']]);

    const changedQuery = { ...query, from: '2026-11-02' };
    fixture.componentRef.setInput('query', changedQuery);
    fixture.detectChanges();
    page(0, 'N-1001', changedQuery);
    expect(root.querySelector<HTMLInputElement>('tbody input')!.checked).toBe(false);
    http.verify();
    fixture.destroy();
  });
});
