import { Component } from '@angular/core';
import type { ReportingCell } from '@bbq-chat/widgets';
import { ReportingComponent, type ReportingWorkspaceAction } from '@bbq-chat/widgets-angular';

@Component({
  selector: 'app-reporting',
  standalone: true,
  imports: [ReportingComponent],
  template: `
    <bbq-reporting [resolveAction]="resolveAction" (reportingAction)="openDetails($event, details)" />
    <dialog #details aria-labelledby="details-title">
      <form method="dialog">
        <header>
          <h2 id="details-title">Report details</h2>
          <button type="submit">Close</button>
        </header>
        <p>{{ detailTitle }}</p>
        <dl>
          @for (field of fields; track $index) {
            <div><dt>{{ field.name }}</dt><dd>{{ field.value ?? '—' }}</dd></div>
          }
        </dl>
      </form>
    </dialog>
  `,
  styles: [`
    dialog { width: min(30rem, calc(100% - 2rem)); box-sizing: border-box; max-height: 85vh;
      border: 1px solid #dbe4e3; border-radius: 1rem; padding: 1.25rem; color: inherit;
      box-shadow: 0 1rem 3rem #18263124; }
    dialog::backdrop { background: #13252d77; }
    header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .75rem; }
    h2, dl { margin: 0; }
    p { margin: .55rem 0 .9rem; color: #52636b; }
    dl div { display: grid; grid-template-columns: minmax(6rem, 2fr) minmax(0, 3fr); gap: 1rem;
      border-top: 1px solid #e4ebe8; padding: .55rem 0; overflow-wrap: anywhere; }
    dt { color: #52636b; }
    dd { margin: 0; font-weight: 600; }
    button { font: inherit; cursor: pointer; border: 1px solid #dbe4e3; border-radius: .45rem;
      background: #fff; color: #12665c; padding: .35rem .7rem; }
    button:focus-visible { outline: 2px solid #12665c; outline-offset: 2px; }
  `],
})
export class ReportingDemoComponent {
  readonly resolveAction = () => 'inspect-report-result';
  detailTitle = '';
  fields: { name: string; value: ReportingCell }[] = [];

  openDetails({ actionName, tile, payload }: ReportingWorkspaceAction, dialog: HTMLDialogElement): void {
    if (actionName !== 'inspect-report-result') return;
    if (payload.kind === 'activate') {
      const row = 'rowKey' in payload
        ? { ...payload.row.fields, label: payload.row.label, value: payload.row.value, orderKey: payload.rowKey }
        : payload.row;
      this.fields = this.detailFields(row);
    } else if (payload.kind === 'select' && tile.view !== 'grid' && tile.view !== 'table') {
      if (payload.group) {
        this.fields = this.detailFields({ [payload.group.field]: payload.group.value, observations: payload.rowIndices.length });
      } else if (payload.row) {
        this.fields = this.detailFields(payload.row);
      } else {
        return;
      }
    } else {
      return;
    }
    this.detailTitle = tile.title;
    if (!dialog.open) dialog.showModal();
  }

  private detailFields(row: Readonly<Record<string, ReportingCell>>): typeof this.fields {
    return Object.entries(row)
      .filter(([name, value]) => name !== 'x' && (name !== 'date' || value !== null))
      .map(([name, value]) => ({ name: name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, char => char.toUpperCase()), value }));
  }
}
