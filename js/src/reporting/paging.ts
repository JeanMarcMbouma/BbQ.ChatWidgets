import type { ReportingQuery, ReportingResultRow } from './api';

export interface ReportingGridCapabilities {
  searchFields: string[];
  sortFields: string[];
  filterFields: string[];
}

export interface ReportingGridFilter {
  field: string;
  value: string;
}

export interface ReportingGridPageRequest {
  query: ReportingQuery;
  offset: number;
  limit: number;
  search?: string;
  sortField?: string;
  descending?: boolean;
  filters?: ReportingGridFilter[];
}

export interface ReportingGridRow {
  key: string;
  row: ReportingResultRow;
}

/** Activation of a server-paged row, identified independently of its visible page or position. */
export interface ReportingGridRowActivation {
  kind: 'activate';
  rowKey: string;
  row: ReportingResultRow;
}

export interface ReportingGridPage {
  total: number;
  rows: ReportingGridRow[];
}
