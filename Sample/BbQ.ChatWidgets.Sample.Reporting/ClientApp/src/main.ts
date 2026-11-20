import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { ReportingComponent } from './reporting/reporting.component';

bootstrapApplication(ReportingComponent, {
  providers: [provideHttpClient(withInterceptors([
    (request, next) => next(request.url.startsWith('/api/reporting/')
      ? request.clone({ setHeaders: { 'X-Demo-Account': 'demo' } })
      : request),
  ]))],
}).catch(console.error);
