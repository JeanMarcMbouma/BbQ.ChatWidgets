import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import type {
  ReportingCatalog, ReportingDocument, ReportingGridPage, ReportingGridPageRequest, ReportingQuery, ReportingResultRow,
  SavedReportingDefinition,
} from '@bbq-chat/widgets';

/** Base URL of the host's ChatWidgets reporting API. */
export const REPORTING_API = new InjectionToken<string>('Reporting API URL', {
  providedIn: 'root',
  factory: () => '/api/reporting',
});

/** Uses the host's Angular HttpClient, including its interceptors. */
@Injectable({ providedIn: 'root' })
export class ReportingApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(REPORTING_API).replace(/\/+$/, '');

  catalog() { return this.http.get<ReportingCatalog>(this.base + '/catalog'); }
  list() { return this.http.get<SavedReportingDefinition[]>(this.base + '/saved'); }
  run(query: ReportingQuery) { return this.http.post<ReportingResultRow[]>(this.base + '/run', query); }
  page(request: ReportingGridPageRequest) { return this.http.post<ReportingGridPage>(this.base + '/page', request); }
  create(definition: ReportingDocument) { return this.http.post<SavedReportingDefinition>(this.base + '/saved', definition); }
  update(id: string, definition: ReportingDocument) {
    return this.http.put<void>(this.base + '/saved/' + encodeURIComponent(id), definition);
  }
  remove(id: string) {
    return this.http.delete<void>(this.base + '/saved/' + encodeURIComponent(id));
  }
}
