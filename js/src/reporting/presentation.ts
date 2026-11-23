export interface ReportingSeries {
  field: string;
  label: string;
}

export type ReportingReferenceLine = { axis: 'X' | 'Y'; label: string } &
  ({ value: number; field?: never } | { field: string; value?: never });

export interface ReportingColor {
  key: string;
  color: string;
  darkColor?: string;
}

/** Native chart settings that can be shared across client frameworks. */
export interface ReportingPresentation {
  categoryField?: string;
  valueField?: string;
  xField?: string;
  dateField?: string;
  dateAxisLabel?: string;
  seriesField?: string;
  series?: readonly ReportingSeries[];
  sizeField?: string;
  pieHole?: number;
  binWidth?: number;
  referenceLines?: readonly ReportingReferenceLine[];
  /** Colors keyed by series field or category value. */
  colors?: readonly ReportingColor[];
}
