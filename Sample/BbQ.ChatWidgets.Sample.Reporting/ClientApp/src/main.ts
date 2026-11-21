import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { REPORTING_INITIAL_PRESET } from '@bbq-chat/widgets-angular';
import { ReportingDemoComponent } from './reporting-demo.component';

bootstrapApplication(ReportingDemoComponent, {
  providers: [
    { provide: REPORTING_INITIAL_PRESET, useValue: 'order-overview' },
    provideHttpClient(withInterceptors([
      (request, next) => next(request.url.startsWith('/api/reporting/')
        ? request.clone({ setHeaders: { 'X-Demo-Account': 'demo' } })
        : request),
    ])),
  ],
}).catch(console.error);
