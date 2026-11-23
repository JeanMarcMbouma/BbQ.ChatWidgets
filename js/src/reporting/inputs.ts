import type { ReportingCatalog, ReportingDocument, ReportingQuery, ReportingWorkspaceAction } from './api';
import type { ReportingCell } from './types';
import { reportingWorkspaceInputs } from './filters';

export type ReportingInputValue = string | number | boolean;
export type ReportingInputRole = 'Filter' | 'Parameter';
export type ReportingInputType = 'Text' | 'Integer' | 'Boolean';

export interface ReportingInputOption {
  value: ReportingInputValue;
  label: string;
}

export interface ReportingInput {
  id: string;
  label: string;
  role: ReportingInputRole;
  type: ReportingInputType;
  /** Omit to resolve choices using the reporting options endpoint. */
  options?: ReportingInputOption[];
  defaultValue?: ReportingInputValue;
}

export interface ReportingInputSelection {
  id: string;
  value: ReportingInputValue;
}

export interface ReportingDateRange {
  /** Inclusive ISO calendar date. */
  from: string;
  /** Inclusive ISO calendar date. */
  to: string;
}

export interface ReportingCalendar {
  maxDays: number;
  label?: string;
  /** The source's current ISO calendar date, which can differ from the browser date. */
  today?: string;
}

export interface ReportingInputOptionsRequest extends ReportingDateRange {
  dataset: string;
  input: string;
}

export interface ReportingState {
  dates?: ReportingDateRange;
  inputs?: readonly ReportingInputSelection[];
}

export interface ReportingSelection {
  kind: 'preset' | 'saved';
  id: string;
}

export interface ReportingInputBinding {
  input: string;
  field: string;
}

/** Tests the advertised scalar type without coercing values returned by a chart or grid. */
export function isReportingInputValue(value: unknown, type: ReportingInputType): value is ReportingInputValue {
  switch (type) {
    case 'Text': return typeof value === 'string' && value.trim().length > 0 && value.length <= 160;
    case 'Integer': return typeof value === 'number' && Number.isSafeInteger(value);
    case 'Boolean': return typeof value === 'boolean';
  }
}

function compareId(a: ReportingInputSelection, b: ReportingInputSelection): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Applies advertised defaults and puts explicit input selections in stable order. */
export function normalizeReportingQuery(query: ReportingQuery, definitions?: readonly ReportingInput[]): ReportingQuery {
  const inputs = [...query.inputs ?? []];
  const selected = new Set(inputs.map(input => input.id));
  for (const input of definitions ?? []) {
    if (!selected.has(input.id) && input.defaultValue !== undefined) {
      inputs.push({ id: input.id, value: input.defaultValue });
    }
  }

  if (!inputs.length && query.inputs === undefined) return query;
  return { ...query, inputs: inputs.length ? inputs.sort(compareId) : undefined };
}

/** A stable identity for a report query, including optional dataset defaults for composition. */
export function reportingQueryKey(query: ReportingQuery, definitions?: readonly ReportingInput[]): string {
  const effective = normalizeReportingQuery(query, definitions);
  return JSON.stringify([effective.dataset, effective.metric, effective.groupBy, effective.from, effective.to,
    effective.inputs?.map(input => [input.id, input.value]) ?? []]);
}

/**
 * Applies shared dates and the inputs advertised by each tile's dataset.
 * Explicit tile selections remain the baseline when a shared selection is cleared.
 */
export function applyReportingState(document: ReportingDocument, catalog: ReportingCatalog,
  state: ReportingState): ReportingDocument {
  if (!state.dates && !state.inputs?.length) return document;

  const visible = new Set(reportingWorkspaceInputs(document, catalog).map(input => input.id));
  const shared = new Map(state.inputs?.filter(input => visible.has(input.id)).map(input => [input.id, input.value]));
  return {
    ...document,
    tiles: document.tiles.map(tile => {
      const supported = catalog.datasets.find(dataset => dataset.id === tile.query.dataset)?.inputs ?? [];
      const inputs = new Map(tile.query.inputs?.map(input => [input.id, input.value]));
      for (const input of supported) {
        const value = shared.get(input.id);
        if (value !== undefined && isReportingInputValue(value, input.type)) inputs.set(input.id, value);
      }

      return {
        ...tile,
        query: {
          ...tile.query, ...state.dates,
          inputs: inputs.size ? [...inputs].map(([id, value]) => ({ id, value })).sort(compareId) : undefined,
        },
      };
    }),
  };
}

/** Sets or clears a shared input using its advertised type and fixed choices. */
export function setReportingInput(state: ReportingState, input: ReportingInput,
  value: ReportingInputValue | undefined): ReportingState {
  if (value !== undefined && (!isReportingInputValue(value, input.type) ||
      (input.options && !input.options.some(option => option.value === value)))) return state;

  const next = (state.inputs ?? []).filter(selection => selection.id !== input.id);
  if (value !== undefined) next.push({ id: input.id, value });
  return { ...state, inputs: next.length ? next.sort(compareId) : undefined };
}

/** Applies an authored chart or grid binding to shared input state. */
export function applyReportingAction(state: ReportingState, action: ReportingWorkspaceAction,
  binding: ReportingInputBinding, dataset: { inputs?: readonly ReportingInput[] }): ReportingState {
  const input = dataset.inputs?.find(definition => definition.id === binding.input && definition.role === 'Filter');
  if (!input) return state;
  const { payload } = action;
  let value: ReportingCell | undefined;
  if (payload.kind === 'select') {
    if (payload.group?.field === binding.field) value = payload.group.value;
    else if (payload.row && Object.prototype.hasOwnProperty.call(payload.row, binding.field)) value = payload.row[binding.field];
  } else if (payload.kind === 'activate') {
    if ('rowKey' in payload) {
      const { row } = payload;
      value = binding.field === 'label' || binding.field === 'value' ? row[binding.field]
        : row.fields && Object.prototype.hasOwnProperty.call(row.fields, binding.field) ? row.fields[binding.field] : undefined;
    } else if (Object.prototype.hasOwnProperty.call(payload.row, binding.field)) value = payload.row[binding.field];
  }

  return isReportingInputValue(value, input.type) ? setReportingInput(state, input, value) : state;
}

/** Computes a relative inclusive range in the advertised calendar, independent of the browser zone. */
export function reportingDatePreset(calendar: ReportingCalendar, days: number): ReportingDateRange | undefined {
  const today = calendar.today;
  if (!today || !/^\d{4}-\d{2}-\d{2}$/.test(today) || today < '0001-01-01' ||
      !Number.isSafeInteger(days) || days < 1 || days > calendar.maxDays) return undefined;
  const date = new Date(today + 'T00:00:00Z');
  if (!Number.isFinite(date.valueOf()) || date.toISOString().slice(0, 10) !== today) return undefined;
  date.setUTCDate(date.getUTCDate() + 1 - days);
  if (date.getUTCFullYear() < 1) return undefined;
  return { from: date.toISOString().slice(0, 10), to: today };
}
