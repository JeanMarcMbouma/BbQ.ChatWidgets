import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SseService {
  private eventSources = new Map<string, EventSource>();

  subscribeToStream(streamId: string): Observable<any> {
    const subject = new Subject<any>();
    const url = `/api/chat/widgets/streams/${streamId}/events`;

    const eventSource = new EventSource(url);
    this.eventSources.set(streamId, eventSource);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        subject.next(data);
      } catch (err) {
        console.error('Failed to parse SSE data:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      subject.error(error);
      this.unsubscribe(streamId);
    };

    return subject.asObservable();
  }

  unsubscribe(streamId: string): void {
    const eventSource = this.eventSources.get(streamId);
    if (eventSource) {
      eventSource.close();
      this.eventSources.delete(streamId);
    }
  }

  unsubscribeAll(): void {
    this.eventSources.forEach((eventSource) => eventSource.close());
    this.eventSources.clear();
  }
}
