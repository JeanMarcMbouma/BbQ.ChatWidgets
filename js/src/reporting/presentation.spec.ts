import { describe, expect, it, vi } from 'vitest';
import type { ReportingDefinition } from './types';
import { mountReporting } from './engine';

function hostFor(definition: ReportingDefinition) {
  const host = document.createElement('div');
  const emit = vi.fn();
  const cleanup = mountReporting(host, definition, emit);
  return { host, emit, cleanup };
}

describe('reporting presentation', () => {
  it('renders value-field series, field-based references and keyboard actions', () => {
    const { host, emit, cleanup } = hostFor({
      type: 'reporting', kind: 'bar', label: 'Results', action: 'select-region',
      rows: [{ name: '<West>', regionId: 7, actual: 22, expected: 25, target: 20 }],
      settings: { presentation: {
        categoryField: 'name', series: [{ field: 'actual', label: 'Actual' }, { field: 'expected', label: 'Expected' }],
        referenceLines: [{ axis: 'X', label: 'Target <', field: 'target' }],
      } },
    });
    expect(host.querySelectorAll('svg g[role="button"]')).toHaveLength(2);
    expect(host.querySelectorAll('[data-report-reference]')).toHaveLength(1);
    expect(host.textContent).toContain('<West> (Actual): 22');
    expect(host.textContent).toContain('Target <: 20');
    const mark = host.querySelector('svg g[role="button"]')!;
    mark.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(emit).toHaveBeenCalledWith('select-region', expect.objectContaining({ row: expect.objectContaining({ regionId: 7 }) }));
    cleanup();
  });

  it('places dated series side by side and keeps sparse series in consistent slots', () => {
    const { host, cleanup } = hostFor({
      type: 'reporting', kind: 'time-column', label: 'Daily', action: 'open',
      rows: [
        { day: '2026-11-01', status: 'First', value: 5 },
        { day: '2026-11-01', status: 'Second', value: 8 },
        { day: '2026-11-02', status: 'Second', value: 4 },
      ],
      settings: { presentation: { dateField: 'day', seriesField: 'status', dateAxisLabel: 'Local calendar' } },
    });
    const [first, second, next] = host.querySelectorAll('rect[data-report-command="point"]');
    expect(first.getAttribute('fill')).not.toEqual(second.getAttribute('fill'));
    expect(next.getAttribute('fill')).toEqual(second.getAttribute('fill'));
    expect(next.getAttribute('width')).toEqual(second.getAttribute('width'));
    expect(host.textContent).toContain('Local calendar');
    cleanup();
  });

  it('renders safe proportional bubbles with reference lines and a real pie hole', () => {
    const { host, cleanup } = hostFor({
      type: 'reporting', kind: 'dashboard', label: 'Results', action: '',
      children: [
        { kind: 'scatter', label: 'Spread', action: '',
          rows: [{ x: 1, value: 2, share: .2 }, { x: 3, value: 4, share: .8 }],
          settings: { presentation: { sizeField: 'share', referenceLines: [
            { axis: 'X', label: 'Boundary', value: 2 }, { axis: 'Y', label: 'Threshold', value: 3 },
          ] } } },
        { kind: 'pie', label: 'Share', action: '', rows: [{ label: 'Complete', value: 2 }],
          settings: { presentation: { pieHole: .5 } } },
      ],
    });
    const circles = host.querySelectorAll('.bbq-report-scatter svg circle');
    expect(Number(circles[0].getAttribute('r'))).toBeLessThan(Number(circles[1].getAttribute('r')));
    expect(host.querySelectorAll('[data-report-reference]')).toHaveLength(2);
    expect(host.querySelector('.bbq-report-pie path[fill-rule="evenodd"] title')?.textContent).toContain('100%');
    expect(host.querySelector('.bbq-report-pie details li')?.textContent).toBe('Complete: 2 (100%)');
    cleanup();
  });

  it('plots pre-aggregated bin counts proportional to their weights', () => {
    const { host, cleanup } = hostFor({
      type: 'reporting', kind: 'histogram', label: 'Distribution', action: '',
      settings: { presentation: { xField: 'from', binWidth: 2, referenceLines: [{ axis: 'X', label: 'Target', value: 5 }] } },
      rows: [{ from: 0, value: 5 }, { from: 2, value: 15 }, { from: 4, value: 2.5 }],
    });
    const bars = host.querySelectorAll('rect');
    expect(bars).toHaveLength(2);
    expect(Number(bars[1].getAttribute('height'))).toBeCloseTo(Number(bars[0].getAttribute('height')) * 3);
    expect(host.textContent).toContain('2 to <4: 15');
    expect(host.textContent).toContain('Target: 5');
    cleanup();
  });
});
