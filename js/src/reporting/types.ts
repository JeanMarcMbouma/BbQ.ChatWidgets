export const reportingKinds = ['dashboard', 'filter', 'bar', 'line', 'pie', 'timeline', 'scatter', 'table', 'grid', 'metric'] as const;
export type ReportingKind = typeof reportingKinds[number];
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
  | { kind: 'select'; source?: string; rowIndices: number[]; row?: ReportingRow }
  | { kind: 'edit'; source?: string; rowIndex: number; field: string; value: ReportingCell };
