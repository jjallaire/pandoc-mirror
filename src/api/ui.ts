export interface EditorUI {
  onEditLink: LinkEditorFn;
  onEditImage: ImageEditorFn;
}

export type LinkEditorFn = (link: LinkProps) => Promise<LinkEditResult | null>;

export type ImageEditorFn = (image: ImageProps) => Promise<ImageEditResult | null>;

export interface LinkProps {
  href: string;
  title?: string;
}

export interface LinkEditResult {
  action: 'edit' | 'remove';
  link: LinkProps;
}

export interface ImageProps {
  src: string | null;
  title?: string;
  alt?: string;
  id?: string;
  classes?: string[];
}

export type ImageEditResult = ImageProps;
