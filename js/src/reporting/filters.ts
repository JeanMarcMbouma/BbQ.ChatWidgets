import type { ReportingCatalog, ReportingDocument, ReportingQuery } from './api';
import type { ReportingInput, ReportingInputOption } from './inputs';

/** An authored control referencing a filter advertised by the authorized catalog. */
export interface ReportingFilter {
  input: string;
  label?: string;
}

/** Returns inputs with a consistent type and role across the datasets used by the report. */
export function reportingAvailableInputs(document: ReportingDocument, catalog: ReportingCatalog): ReportingInput[] {
  const inputs = new Map<string, ReportingInput>();
  const conflicts = new Set<string>();
  for (const id of new Set(document.tiles.map(tile => tile.query.dataset))) {
    for (const input of catalog.datasets.find(dataset => dataset.id === id)?.inputs ?? []) {
      const earlier = inputs.get(input.id);
      if (!earlier) inputs.set(input.id, input);
      else if (earlier.type !== input.type || earlier.role !== input.role) conflicts.add(input.id);
    }
  }
  return [...inputs.values()].filter(input => !conflicts.has(input.id));
}

/** Resolves the report's filter controls and labels. Parameters keep their catalog settings. */
export function reportingWorkspaceInputs(document: ReportingDocument, catalog: ReportingCatalog): ReportingInput[] {
  const inputs = reportingAvailableInputs(document, catalog);
  if (!document.filters) return inputs;

  return [
    ...document.filters.flatMap(filter => {
      const input = inputs.find(item => item.id === filter.input && item.role === 'Filter');
      return input ? [{ ...input, label: filter.label ?? input.label }] : [];
    }),
    ...inputs.filter(input => input.role === 'Parameter'),
  ];
}

/** Gets the authored list, materializing inherited filters for editing when needed. */
export function reportingEditableFilters(document: ReportingDocument, catalog: ReportingCatalog): ReportingFilter[] {
  return document.filters ?? reportingWorkspaceInputs(document, catalog)
    .filter(input => input.role === 'Filter').map(input => ({ input: input.id }));
}

/** Updates the authoring list and clears saved tile values for filters the author removed. */
export function withReportingFilters(document: ReportingDocument, catalog: ReportingCatalog, filters: ReportingFilter[]): ReportingDocument {
  const retained = new Set(filters.map(filter => filter.input));
  const removed = new Set(reportingEditableFilters(document, catalog).map(filter => filter.input)
    .filter(input => !retained.has(input)));
  const tiles = removed.size ? document.tiles.map(tile => {
    const values = tile.query.inputs?.filter(selection => !removed.has(selection.id));
    if (!values || values.length === tile.query.inputs?.length) return tile;
    return { ...tile, query: { ...tile.query, inputs: values.length ? values : undefined } };
  }) : document.tiles;
  return { ...document, filters, tiles };
}

/** Removes saved controls whose input is no longer present after a tile or dataset is changed. */
export function pruneReportingFilters(document: ReportingDocument, catalog: ReportingCatalog): ReportingDocument {
  if (!document.filters) return document;
  const available = new Set(reportingAvailableInputs(document, catalog)
    .filter(input => input.role === 'Filter').map(input => input.id));
  const valid = document.filters.filter(filter => available.has(filter.input));
  return valid.length === document.filters.length ? document : withReportingFilters(document, catalog, valid);
}

/** Resolves choices for each visible control across the report's authorized query contexts. */
export async function resolveReportingControls(document: ReportingDocument, catalog: ReportingCatalog,
  options: (query: ReportingQuery, input: string) => Promise<readonly ReportingInputOption[]>): Promise<ReportingInput[]> {
  return Promise.all(reportingWorkspaceInputs(document, catalog).map(async input => {
    const contexts = new Set<string>();
    const choices = document.tiles.flatMap(({ query }) => {
      const source = catalog.datasets.find(dataset => dataset.id === query.dataset)?.inputs?.find(item => item.id === input.id);
      if (!source) return [];
      const key = JSON.stringify([query.dataset, query.from, query.to]);
      if (contexts.has(key)) return [];
      contexts.add(key);
      return [source.options ?? options(query, input.id)];
    });
    const [first = [], ...others] = await Promise.all(choices);
    return { ...input, options: first.filter(option => others.every(items => items.some(item => item.value === option.value))) };
  }));
}
