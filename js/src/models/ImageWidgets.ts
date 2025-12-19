import { ChatWidget } from './ChatWidget';

export class ImageWidget extends ChatWidget {
  constructor(
    label: string,
    action: string,
    readonly imageUrl: string,
    readonly alt?: string,
    readonly width?: number,
    readonly height?: number
  ) {
    super('image', label, action);
  }

  toObject() {
    return {
      type: this.type,
      label: this.label,
      action: this.action,
      imageUrl: this.imageUrl,
      alt: this.alt,
      width: this.width,
      height: this.height,
    };
  }
}

export interface ImageItem {
  imageUrl: string;
  alt?: string;
  action?: string;
  width?: number;
  height?: number;
}

export class ImageCollectionWidget extends ChatWidget {
  constructor(label: string, action: string, readonly images: ImageItem[]) {
    super('imagecollection', label, action);
  }

  toObject() {
    return {
      type: this.type,
      label: this.label,
      action: this.action,
      images: this.images,
    };
  }
}
