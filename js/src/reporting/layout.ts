import type { ReportingDocument } from './api';

export interface ReportingVariant {
  id: string;
  label: string;
  tileIds: string[];
}

export interface ReportingPlacement {
  id: string;
  region?: string;
  columnSpan?: number;
  rowSpan?: number;
  tileIds?: string[];
  variants?: ReportingVariant[];
  defaultVariantId?: string;
}

export interface ReportingMode {
  id: string;
  label: string;
  placements: ReportingPlacement[];
}

export interface ReportingLayout {
  modes: ReportingMode[];
  defaultModeId?: string;
}

/** Runtime state for a mode and its card variants. Hosts can store it in their routes. */
export interface ReportingLayoutState {
  modeId?: string;
  variants?: Readonly<Record<string, string>>;
}

export interface ResolvedReportingPlacement {
  placement: ReportingPlacement;
  tileIndices: number[];
  variantId?: string;
}

export interface ResolvedReportingLayout {
  mode: ReportingMode;
  placements: ResolvedReportingPlacement[];
}

/** Resolves visible cards using stable IDs. Unknown selections fall back to authored defaults. */
export function resolveReportingLayout(
  document: ReportingDocument,
  state?: ReportingLayoutState
): ResolvedReportingLayout | undefined {
  const layout = document.layout;
  if (!layout?.modes.length) return undefined;
  const mode =
    layout.modes.find((item) => item.id === state?.modeId) ??
    layout.modes.find((item) => item.id === layout.defaultModeId) ??
    layout.modes[0];
  const indices = new Map(
    document.tiles.flatMap((tile, index) => (tile.id ? [[tile.id, index] as const] : []))
  );
  return {
    mode,
    placements: mode.placements.map((placement) => {
      const variants = placement.variants;
      const chosen =
        state?.modeId === mode.id &&
        state.variants &&
        Object.prototype.hasOwnProperty.call(state.variants, placement.id)
          ? state.variants[placement.id]
          : undefined;
      const variant =
        variants?.find((item) => item.id === chosen) ??
        variants?.find((item) => item.id === placement.defaultVariantId) ??
        variants?.[0];
      const tileIndices = (variant?.tileIds ?? placement.tileIds ?? []).flatMap((id) => {
        const index = indices.get(id);
        return index === undefined ? [] : [index];
      });
      return { placement, variantId: variant?.id, tileIndices };
    }),
  };
}
