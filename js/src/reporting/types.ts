import type { ReportingPresentation } from './presentation';

export const reportingTimeSeriesKinds = ['time-line', 'area', 'step', 'time-column'] as const;
export type ReportingTimeSeriesKind = typeof reportingTimeSeriesKinds[number];
export const reportingKinds = ['dashboard', 'filter', 'bar', 'line', 'pie', 'timeline', 'scatter',
  ...reportingTimeSeriesKinds, 'waterfall', 'pareto', 'histogram', 'table', 'grid', 'metric'] as const;
export type ReportingKind = typeof reportingKinds[number];

export function isReportingTimeSeriesKind(kind: ReportingKind): kind is ReportingTimeSeriesKind {
  return reportingTimeSeriesKinds.some(timeSeriesKind => timeSeriesKind === kind);
}

export type ReportingCell = string | number | boolean | null;
export type ReportingRow = Readonly<Record<string, ReportingCell>>;
export interface ReportingColumn { field: string; label: string; editable?: boolean }

export interface ReportingSettings {
  dataSource?: string;
  categoryField?: string;
  valueField?: string;
  xField?: string;
  dateField?: string;
  groupBy?: string;
  columns?: readonly ReportingColumn[];
  presentation?: ReportingPresentation;
}

export interface ReportingNode {
  kind: ReportingKind;
  label: string;
  action: string;
  settings?: ReportingSettings;
  sources?: Readonly<Record<string, readonly ReportingRow[]>>;
  rows?: readonly ReportingRow[];
  children?: readonly ReportingNode[];
  filterField?: string;
  pageSize?: number;
  error?: string;
}

export interface ReportingDefinition extends ReportingNode { type: 'reporting' }

export type ReportingAction =
  | { kind: 'filter'; source?: string; field: string; value: ReportingCell; active: boolean }
  | { kind: 'select'; source?: string; rowIndices: number[]; row?: ReportingRow; group?: { field: string; value: ReportingCell } }
  | { kind: 'activate'; source?: string; rowIndex: number; row: ReportingRow }
  | { kind: 'edit'; source?: string; rowIndex: number; field: string; value: ReportingCell };

function isReportingCell(value: unknown): value is ReportingCell {
  return value === null || typeof value === 'string' || typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isRow(value: unknown): value is ReportingRow {
  return isRecord(value) && Object.values(value).every(isReportingCell);
}

function isRowIndex(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

/** Narrows an event from a general widget renderer to a snapshot reporting action. */
export function isReportingAction(value: unknown): value is ReportingAction {
  if (!isRecord(value) || (value.source !== undefined && typeof value.source !== 'string')) return false;
  switch (value.kind) {
    case 'filter':
      return typeof value.field === 'string' && typeof value.active === 'boolean' && isReportingCell(value.value);
    case 'select':
      return Array.isArray(value.rowIndices) && value.rowIndices.every(isRowIndex) &&
        (value.row === undefined || isRow(value.row)) &&
        (value.group === undefined || (isRecord(value.group) && typeof value.group.field === 'string' && isReportingCell(value.group.value)));
    case 'activate':
      return isRowIndex(value.rowIndex) && isRow(value.row);
    case 'edit':
      return isRowIndex(value.rowIndex) && typeof value.field === 'string' && isReportingCell(value.value);
    default:
      return false;
  }
}
