import { RenderFn } from './SsrWidgetRenderer';

function escapeHtml(value: string | undefined): string {
  if (!value) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return value.replace(/[&<>"']/g, (char) => map[char]);
}

function generateIdFromAction(action: string | undefined): string {
  const a = action ?? '';
  return `bbq-${escapeHtml(a).replace(/\s+/g, '-').toLowerCase()}`;
}

export const renderImage: RenderFn = (widget: any) => {
  const action = escapeHtml(widget.action);
  const label = escapeHtml(widget.label);
  const id = generateIdFromAction(widget.action);
  const imageUrl = escapeHtml(widget.imageUrl);
  const alt = escapeHtml(widget.alt || widget.label || '');

  const width = widget.width ? ` width="${widget.width}"` : '';
  const height = widget.height ? ` height="${widget.height}"` : '';

  // Match Blazor `ImageWidgetComponent.razor`
  let html = `<div class="bbq-widget bbq-image-widget" data-widget-id="${id}" data-widget-type="image" data-action="${action}">`;
  html += `<figure class="bbq-image-figure">`;
  html += `<img class="bbq-image" src="${imageUrl}" alt="${alt}" loading="lazy"${width}${height} style="cursor: pointer; max-width: 100%; height: auto;" />`;

  if (alt) {
    html += `<figcaption class="bbq-image-caption">${alt}</figcaption>`;
  } else if (label) {
    html += `<figcaption class="bbq-image-caption">${label}</figcaption>`;
  }

  html += `</figure></div>`;
  return html;
};

export const renderImageCollection: RenderFn = (widget: any) => {
  const action = escapeHtml(widget.action);
  const id = generateIdFromAction(widget.action);

  const images = Array.isArray(widget.images) ? widget.images : [];

  // Match Blazor `ImageCollectionWidgetComponent.razor`
  const items = images
    .map((img: any) => {
      const imageUrl = escapeHtml(img.imageUrl);
      const alt = escapeHtml(img.alt || '');
      const itemAction = escapeHtml(img.action || widget.action);

      // Keep payload in a data attribute for click handling.
      // (Do NOT call ctx.escape here; this renderer is framework-agnostic and must be safe standalone.)
      const payloadJson = escapeHtml(JSON.stringify({ imageUrl: img.imageUrl }));

      return (
        `<div class="bbq-image-collection-item" data-action="${itemAction}" data-payload="${payloadJson}">` +
        `<img class="bbq-image" src="${imageUrl}" alt="${alt}" loading="lazy" />` +
        (alt ? `<div class="bbq-image-caption">${alt}</div>` : '') +
        `</div>`
      );
    })
    .join('');

  return (
    `<div class="bbq-widget bbq-image-collection-widget" data-widget-id="${id}" data-widget-type="imagecollection" data-action="${action}">` +
    `<div class="bbq-image-collection-grid">${items}</div>` +
    `</div>`
  );
};
