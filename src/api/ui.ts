export interface EditorUI {
  onEditLink: LinkEditorFn;
  onEditImage: ImageEditorFn;
  onEditAttr: AttrEditorFn;
}

export type AttrEditorFn = (attr: AttrProps) => Promise<AttrEditResult | null>;

export type LinkEditorFn = (link: LinkProps) => Promise<LinkEditResult | null>;

export type ImageEditorFn = (image: ImageProps) => Promise<ImageEditResult | null>;

export interface AttrProps {
  id?: string;
  classes?: string[];
  keyvalue?: [[string, string]];
}

export type AttrEditResult = AttrProps;

export interface LinkProps extends AttrProps {
  href: string;
  title?: string;
}

export interface LinkEditResult {
  action: 'edit' | 'remove';
  link: LinkProps;
}

export interface ImageProps extends AttrProps {
  src: string | null;
  title?: string;
  alt?: string;
}

export type ImageEditResult = ImageProps;
