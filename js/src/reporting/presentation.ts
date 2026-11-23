export interface ReportingSeries {
  field: string;
  label: string;
}

export type ReportingReferenceLine = { axis: 'X' | 'Y'; label: string } &
  ({ value: number; field?: never } | { field: string; value?: never });

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
}
