import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { FileUploadWidget } from '@bbq-chat/widgets';
import { CustomWidgetComponent } from '../custom-widget-renderer.types';

@Component({
  selector: 'bbq-fileupload-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="bbq-widget bbq-file-upload" 
      [attr.data-widget-type]="'fileupload'">
      <label class="bbq-file-label" [attr.for]="inputId">
        {{ fileUploadWidget.label }}
      </label>
      <input 
        type="file" 
        [id]="inputId"
        class="bbq-file-input" 
        [attr.data-action]="fileUploadWidget.action"
        [accept]="fileUploadWidget.accept || ''"
        [attr.data-max-bytes]="fileUploadWidget.maxBytes"
        (change)="onFileChange($event)" />
    </div>
  `,
  styles: []
})
export class FileUploadWidgetComponent implements CustomWidgetComponent, OnInit {
  @Input() widget!: any;
  widgetAction?: (actionName: string, payload: unknown) => void;
  
  inputId = '';

  get fileUploadWidget(): FileUploadWidget {
    return this.widget as FileUploadWidget;
  }

  ngOnInit() {
    this.inputId = `bbq-${this.fileUploadWidget.action.replace(/\s+/g, '-').toLowerCase()}-file`;
  }

  onFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      if (this.widgetAction) {
        this.widgetAction(this.fileUploadWidget.action, { file });
      }
    }
  }
}
