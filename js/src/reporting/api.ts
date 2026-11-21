import type { ReportingAction, ReportingCell, ReportingColumn, ReportingKind } from './types';
import type { ReportingGridCapabilities, ReportingGridPage, ReportingGridPageRequest, ReportingGridRowActivation } from './paging';

export type ReportingDocumentKind = 'report' | 'dashboard';
export type ReportingView = Exclude<ReportingKind, 'dashboard'>;

export const reportingViews = [
  { id: 'bar', label: 'Bar chart' }, { id: 'line', label: 'Line chart' }, { id: 'pie', label: 'Pie chart' },
  { id: 'timeline', label: 'Timeline' }, { id: 'scatter', label: 'Scatter plot' }, { id: 'table', label: 'Table' },
  { id: 'time-line', label: 'Time-series line' }, { id: 'area', label: 'Area chart' },
  { id: 'step', label: 'Step chart' }, { id: 'time-column', label: 'Time-series columns' },
  { id: 'filter', label: 'Filter' }, { id: 'grid', label: 'Data grid' }, { id: 'metric', label: 'Metric' },
  { id: 'waterfall', label: 'Waterfall' }, { id: 'pareto', label: 'Pareto' }, { id: 'histogram', label: 'Histogram' },
] as const satisfies readonly { id: ReportingView; label: string }[];

export interface ReportingField {
  id: string;
  label: string;
  columns?: ReportingColumn[];
  grid?: ReportingGridCapabilities;
  /** ISO date field in query results. Use 'label' for dates returned as group labels. */
  dateField?: string;
}

export interface ReportingDataset {
  id: string;
  label: string;
  metrics: ReportingField[];
  dimensions: ReportingField[];
}

export interface ReportingQuery {
  dataset: string;
  metric: string;
  groupBy: string | null;
  from: string;
  to: string;
}

export interface ReportingResultRow {
  label: string;
  value: number;
  fields?: Record<string, ReportingCell>;
}

export interface ReportingTile {
  title: string;
  view: ReportingView;
  query: ReportingQuery;
}

/** Names a workspace action for the host, using the tile's index in the report definition. */
export type ReportingActionResolver = (tile: ReportingTile, tileIndex: number) => string | undefined;

/** A reporting interaction and the tile that produced it. */
export interface ReportingWorkspaceAction {
  actionName: string;
  tile: ReportingTile;
  tileIndex: number;
  payload: ReportingAction | ReportingGridRowActivation;
}

/** A reusable report configuration. Executed rows belong to the widget snapshot. */
export interface ReportingDocument {
  title: string;
  kind: ReportingDocumentKind;
  tiles: ReportingTile[];
}

export interface SavedReportingDefinition {
  id: string;
  definition: ReportingDocument;
}

export interface ReportingCatalog {
  datasets: ReportingDataset[];
  presets: SavedReportingDefinition[];
}

export interface ReportingClientOptions {
  /** Defaults to /api/reporting. Use an absolute URL outside a browser. */
  baseUrl?: string;
  /** Supply your application's transport to attach credentials or intercept requests. */
  fetch?: typeof fetch;
}

export class ReportingHttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'ReportingHttpError';
  }
}

/** HTTP client for the optional ChatWidgets reporting endpoints. */
export class ReportingClient {
  private readonly baseUrl: string;
  private readonly transport: typeof fetch;

  constructor(options: ReportingClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? '/api/reporting').replace(/\/+$/, '');
    this.transport = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  catalog(signal?: AbortSignal): Promise<ReportingCatalog> {
    return this.request('GET', '/catalog', signal);
  }

  list(signal?: AbortSignal): Promise<SavedReportingDefinition[]> {
    return this.request('GET', '/saved', signal);
  }

  run(query: ReportingQuery, signal?: AbortSignal): Promise<ReportingResultRow[]> {
    return this.request('POST', '/run', signal, query);
  }

  page(request: ReportingGridPageRequest, signal?: AbortSignal): Promise<ReportingGridPage> {
    return this.request('POST', '/page', signal, request);
  }

  create(definition: ReportingDocument, signal?: AbortSignal): Promise<SavedReportingDefinition> {
    return this.request('POST', '/saved', signal, definition);
  }

  async update(id: string, definition: ReportingDocument, signal?: AbortSignal): Promise<void> {
    await this.request<void>('PUT', '/saved/' + encodeURIComponent(id), signal, definition);
  }

  async remove(id: string, signal?: AbortSignal): Promise<void> {
    await this.request<void>('DELETE', '/saved/' + encodeURIComponent(id), signal);
  }

  private async request<T>(method: string, path: string, signal?: AbortSignal, body?: object): Promise<T> {
    const response = await this.transport(this.baseUrl + path, {
      method, signal,
      headers: body ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const problem: unknown = await response.json().catch(() => null);
      const message = problem && typeof problem === 'object' && 'error' in problem && typeof problem.error === 'string'
        ? problem.error : `Reporting request failed (${response.status}).`;
      throw new ReportingHttpError(response.status, message);
    }
    return response.status === 204 ? undefined as T : response.json();
  }
}
