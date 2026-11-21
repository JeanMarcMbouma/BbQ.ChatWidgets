import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  ReportingCell, ReportingColumn, ReportingField, ReportingGridPage, ReportingGridRow, ReportingGridRowActivation,
  ReportingQuery,
} from '@bbq-chat/widgets';
import { Subscription } from 'rxjs';
import { ReportingApi } from './reporting-api';

@Component({
  selector: 'bbq-paged-reporting-grid',
  standalone: true,
  imports: [DecimalPipe, FormsModule],
  providers: [ReportingApi],
  templateUrl: './paged-grid.component.html',
  styleUrl: './paged-grid.component.css',
})
export class PagedReportingGridComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) query!: ReportingQuery;
  @Input({ required: true }) dimension!: ReportingField;
  @Output() readonly selectionChange = new EventEmitter<readonly string[]>();
  /** Emitted when the user activates a row by clicking it or using its View button. */
  @Output() readonly rowActivate = new EventEmitter<ReportingGridRowActivation>();

  private readonly api = inject(ReportingApi);
  private readonly detector = inject(ChangeDetectorRef);
  private request?: Subscription;
  private appliedSearch = '';
  private appliedFilterField = '';
  private appliedFilterValue = '';

  readonly selected = new Set<string>();
  page: ReportingGridPage | null = null;
  loading = false;
  error = '';
  search = '';
  filterField = '';
  filterValue = '';
  sortField = '';
  descending = false;
  offset = 0;
  visibleOffset = 0;
  visibleLimit = 25;
  limit = 25;

  get visiblePage(): number {
    return Math.floor(this.visibleOffset / this.visibleLimit) + 1;
  }

  get pageCount(): number {
    return Math.ceil((this.page?.total ?? 0) / this.visibleLimit);
  }

  ngOnChanges(): void {
    this.offset = 0;
    this.page = null;
    this.selected.clear();
    this.sortField = this.search = this.filterField = this.filterValue = '';
    this.appliedSearch = this.appliedFilterField = this.appliedFilterValue = '';
    this.load();
  }

  ngOnDestroy(): void {
    this.request?.unsubscribe();
  }

  get columns(): readonly ReportingColumn[] {
    return this.dimension.columns ?? [{ field: 'label', label: 'Order' }, { field: 'value', label: 'Value' }];
  }

  get filterColumns(): readonly ReportingColumn[] {
    return this.columns.filter(column => this.dimension.grid?.filterFields.includes(column.field));
  }

  canSort(field: string): boolean {
    return this.dimension.grid?.sortFields.includes(field) ?? false;
  }

  sort(field: string): void {
    this.descending = this.sortField === field && !this.descending;
    this.sortField = field;
    this.offset = 0;
    this.load();
  }

  apply(): void {
    this.appliedSearch = this.search.trim();
    this.appliedFilterField = this.filterField;
    this.appliedFilterValue = this.filterValue.trim();
    this.offset = 0;
    this.selected.clear();
    this.selectionChange.emit([]);
    this.load();
  }

  resize(size: number): void {
    this.limit = size;
    this.offset = 0;
    this.load();
  }

  step(direction: -1 | 1): void {
    this.offset += direction * this.limit;
    this.load();
  }

  cell(entry: ReportingGridRow, field: string): ReportingCell {
    if (field === 'label' || field === 'value') return entry.row[field];
    return entry.row.fields?.[field] ?? null;
  }

  activateRow(entry: ReportingGridRow): void {
    if (this.loading) return;
    this.rowActivate.emit({ kind: 'activate', rowKey: entry.key, row: entry.row });
  }

  onRowClick(entry: ReportingGridRow, event: MouseEvent): void {
    if ((event.target as Element | null)?.closest('a, button, input, select, textarea, label')) return;
    this.activateRow(entry);
  }

  get isPageSelected(): boolean {
    return !!this.page?.rows.length && this.page.rows.every(entry => this.selected.has(entry.key));
  }

  select(key: string, checked: boolean): void {
    if (checked) this.selected.add(key);
    else this.selected.delete(key);
    this.selectionChange.emit([...this.selected]);
  }

  selectPage(checked: boolean): void {
    for (const entry of this.page?.rows ?? []) {
      if (checked) this.selected.add(entry.key);
      else this.selected.delete(entry.key);
    }
    this.selectionChange.emit([...this.selected]);
  }

  clearSelection(): void {
    this.selected.clear();
    this.selectionChange.emit([]);
  }

  load(): void {
    this.request?.unsubscribe();
    this.loading = true;
    this.error = '';
    this.request = this.api.page({
      query: this.query, offset: this.offset, limit: this.limit,
      search: this.appliedSearch || undefined, sortField: this.sortField || undefined, descending: this.descending,
      filters: this.appliedFilterField && this.appliedFilterValue
        ? [{ field: this.appliedFilterField, value: this.appliedFilterValue }] : undefined,
    }).subscribe({
      next: page => {
        if (this.offset > 0 && this.offset >= page.total) {
          this.offset = Math.max(0, Math.ceil(page.total / this.limit) - 1) * this.limit;
          this.load();
          return;
        }
        this.page = page;
        this.visibleOffset = this.offset;
        this.visibleLimit = this.limit;
        this.loading = false;
        this.detector.markForCheck();
      },
      error: (error: unknown) => {
        this.page = null;
        this.loading = false;
        this.error = error instanceof HttpErrorResponse && typeof error.error?.error === 'string'
          ? error.error.error : 'Could not load this grid page.';
        this.detector.markForCheck();
      },
    });
  }
}
