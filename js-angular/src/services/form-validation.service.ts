import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface FormValidationEvent {
  formId: string;
  valid: boolean;
  errors: Array<{ field: string; reason?: string }>;
}

@Injectable({ providedIn: 'root' })
export class FormValidationService {
  private subject = new Subject<FormValidationEvent>();

  get validation$(): Observable<FormValidationEvent> {
    return this.subject.asObservable();
  }

  emit(event: FormValidationEvent) {
    try { this.subject.next(event); } catch { }
  }
}
