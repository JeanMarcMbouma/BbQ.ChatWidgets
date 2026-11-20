import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';

export type ReportKind = 'report' | 'dashboard';
export type ReportView = 'table' | 'bar';
export interface ReportField { id: string; label: string }
export interface ReportDataset { id: string; label: string; metrics: ReportField[]; dimensions: ReportField[] }
export interface ReportQuery { dataset: string; metric: string; groupBy: string | null; from: string; to: string }
export interface ReportRow { label: string; value: number }
export interface ReportTile { title: string; view: ReportView; query: ReportQuery }
export interface ReportDefinition { title: string; kind: ReportKind; tiles: ReportTile[] }
export interface SavedReport { id: string; definition: ReportDefinition }
export interface ReportCatalog { datasets: ReportDataset[]; presets: SavedReport[] }

export const REPORTING_API = new InjectionToken<string>('Reporting API URL', {
  providedIn: 'root',
  factory: () => '/api/reporting',
});

@Injectable({ providedIn: 'root' })
export class ReportingApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(REPORTING_API).replace(/\/$/, '');

  catalog() { return this.http.get<ReportCatalog>(this.base + '/catalog'); }
  list() { return this.http.get<SavedReport[]>(this.base + '/saved'); }
  run(query: ReportQuery) { return this.http.post<ReportRow[]>(this.base + '/run', query); }
  create(definition: ReportDefinition) { return this.http.post<SavedReport>(this.base + '/saved', definition); }
  update(id: string, definition: ReportDefinition) {
    return this.http.put<void>(this.base + '/saved/' + encodeURIComponent(id), definition);
  }
  remove(id: string) {
    return this.http.delete<void>(this.base + '/saved/' + encodeURIComponent(id));
  }
}
