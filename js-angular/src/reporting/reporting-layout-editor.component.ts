import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  ReportingDocument,
  ReportingMode,
  ReportingPlacement,
  ReportingVariant,
} from '@bbq-chat/widgets';

export function nextReportingId(items: readonly { id?: string }[], prefix: string): string {
  const used = new Set(items.map((item) => item.id));
  let index = items.length + 1;
  while (used.has(prefix + '-' + index)) index++;
  return prefix + '-' + index;
}

@Component({
  selector: 'bbq-reporting-layout-editor',
  imports: [FormsModule],
  templateUrl: './reporting-layout-editor.component.html',
  styles: [
    `
      :host {
        display: block;
        margin-block: 0.75rem;
      }
      fieldset {
        border: 1px solid var(--bbq-reporting-line, #d0d6dc);
        margin: 0.65rem 0;
      }
      details,
      label {
        display: block;
        margin-block: 0.45rem;
      }
      .buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }
      select[multiple] {
        display: block;
        inline-size: 100%;
      }
      input[type='number'] {
        inline-size: 5rem;
      }
    `,
  ],
})
export class ReportingLayoutEditorComponent {
  @Input({ required: true }) definition!: ReportingDocument;
  @Output() readonly changed = new EventEmitter<void>();
  @Output() readonly captureDefaults = new EventEmitter<void>();

  enable(): void {
    const { tiles } = this.definition;
    tiles.forEach((tile) => {
      tile.id ??= nextReportingId(tiles, 'tile');
    });
    this.definition.layout = {
      modes: [
        {
          id: 'overview',
          label: 'Overview',
          placements: tiles.map((tile, index) => ({
            id: 'card-' + (index + 1),
            tileIds: [tile.id!],
          })),
        },
      ],
    };
    this.changed.emit();
  }

  addMode(): void {
    const modes = this.definition.layout!.modes;
    modes.push({
      id: nextReportingId(modes, 'mode'),
      label: 'Display mode ' + (modes.length + 1),
      placements: [{ id: 'card-1', tileIds: [this.definition.tiles[0].id!] }],
    });
    this.changed.emit();
  }

  removeMode(index: number): void {
    const layout = this.definition.layout!;
    const [mode] = layout.modes.splice(index, 1);
    if (layout.defaultModeId === mode.id) layout.defaultModeId = undefined;
    this.changed.emit();
  }

  addCard(mode: ReportingMode): void {
    mode.placements.push({
      id: nextReportingId(mode.placements, 'card'),
      tileIds: [this.definition.tiles[0].id!],
    });
    this.changed.emit();
  }

  addVariants(card: ReportingPlacement): void {
    const label = (id: string | undefined) =>
      this.definition.tiles.find((tile) => tile.id === id)?.title || 'Tile';
    const first = card.tileIds ?? [this.definition.tiles[0].id!];
    const other = this.definition.tiles.find((tile) => !first.includes(tile.id!))?.id ?? first[0];
    card.variants = [
      { id: 'primary', label: label(first[0]), tileIds: first },
      { id: 'alternative', label: label(other), tileIds: [other] },
    ];
    card.tileIds = undefined;
    this.changed.emit();
  }

  addVariant(card: ReportingPlacement): void {
    const variants = card.variants!;
    variants.push({
      id: nextReportingId(variants, 'variant'),
      label: 'Variant ' + (variants.length + 1),
      tileIds: [this.definition.tiles[0].id!],
    });
    this.changed.emit();
  }

  removeVariant(card: ReportingPlacement, index: number): void {
    const variants = card.variants!;
    const [removed] = variants.splice(index, 1);
    if (variants.length === 1) {
      card.tileIds = variants[0].tileIds;
      card.variants = undefined;
      card.defaultVariantId = undefined;
    } else if (card.defaultVariantId === removed.id) card.defaultVariantId = undefined;
    this.changed.emit();
  }

  move(
    items: ReportingMode[] | ReportingPlacement[] | ReportingVariant[],
    index: number,
    delta: number
  ): void {
    const group: (ReportingMode | ReportingPlacement | ReportingVariant)[] = items;
    [group[index], group[index + delta]] = [group[index + delta], group[index]];
    this.changed.emit();
  }

  assign(item: ReportingPlacement | ReportingVariant, values: string[]): void {
    if (values.length && values.length <= 4) item.tileIds = values;
    this.changed.emit();
  }
}
