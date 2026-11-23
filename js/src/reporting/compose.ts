import { ReportingWidget } from '../models/ChatWidget';
import type { ReportingCatalog, ReportingDocument, ReportingQuery, ReportingResultRow, ReportingTile } from './api';
import type { ReportingRow } from './types';
import { normalizeReportingQuery, reportingQueryKey } from './inputs';

export interface ReportingSnapshotOptions {
  /** Exclude tiles rendered by the host, such as server-paged grids. */
  includeTile?: (tile: ReportingTile) => boolean;
  /** Provide a localized error message for a failed query. */
  describeError?: (error: unknown) => string;
  /** Override the actionable ID while retaining the document's tile index. */
  tileAction?: (tile: ReportingTile, index: number) => string;
  /** Supply a localized label for automatically added shared-source filters. */
  filterLabel?: (tile: ReportingTile) => string;
}

/**
 * Executes each distinct query once per render and composes a dashboard snapshot.
 * The document and catalog remain reusable without the returned data.
 */
export async function composeReportingSnapshot(
  document: ReportingDocument,
  catalog: ReportingCatalog,
  run: (query: ReportingQuery) => Promise<readonly ReportingResultRow[]>,
  options: ReportingSnapshotOptions = {},
): Promise<ReportingWidget> {
  const sources = new Map<string, {
    id: string;
    tiles: ReportingTile[];
    result: Promise<{ rows: ReportingRow[]; error?: string }>;
  }>();
  const children = document.tiles.map(async (tile, index) => {
    if (options.includeTile && !options.includeTile(tile)) return undefined;
    const { dataset, groupBy } = tile.query;
    const data = catalog.datasets.find(item => item.id === dataset);
    const effective = normalizeReportingQuery(tile.query, data?.inputs);
    const key = reportingQueryKey(effective);
    let source = sources.get(key);
    if (!source) {
      const result = Promise.resolve().then(() => run(effective)).then(rows => ({
        rows: rows.map(({ fields, label, value }, position) => ({
          x: position + 1, date: groupBy === 'day' ? label : null, ...fields, label, value,
        })),
      })).catch((error: unknown) => ({
        rows: [], error: options.describeError?.(error) ?? 'The reporting query failed.',
      }));
      source = { id: 'source-' + sources.size, tiles: [], result };
      sources.set(key, source);
    }
    source.tiles.push(tile);
    const dimension = data?.dimensions.find(field => field.id === groupBy);
    const { error } = await source.result;
    return new ReportingWidget(tile.title, options.tileAction?.(tile, index) ?? 'report-result-' + index, tile.view, {
      settings: { dataSource: source.id, columns: dimension?.columns, dateField: dimension?.dateField, presentation: tile.presentation },
      filterField: tile.view === 'filter' ? 'label' : undefined,
      error,
    });
  });

  const resolved = await Promise.all(children);
  const rowsBySource: Record<string, ReportingRow[]> = {};
  const filters: ReportingWidget[] = [];
  for (const { id, result, tiles } of sources.values()) {
    const { rows } = await result;
    rowsBySource[id] = rows;
    if (!document.filters && rows.length > 1 && tiles.length > 1 && !tiles.some(tile => tile.view === 'filter')) {
      filters.push(new ReportingWidget(options.filterLabel?.(tiles[0]) ?? 'Filter ' + tiles[0].title, '', 'filter', {
        settings: { dataSource: id }, filterField: 'label',
      }));
    }
  }

  return new ReportingWidget(document.title, '', 'dashboard', {
    settings: {
      categoryField: 'label', valueField: 'value', xField: 'x', dateField: 'date',
      columns: [{ field: 'label', label: 'Group' }, { field: 'value', label: 'Value' }],
    },
    sources: rowsBySource,
    children: [...filters, ...resolved.filter(child => child !== undefined)],
  });
}
