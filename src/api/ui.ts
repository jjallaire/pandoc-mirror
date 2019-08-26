export interface EditorUI {
  alert: AlertFn;
  editLink: LinkEditorFn;
  editImage: ImageEditorFn;
  editOrderedList: OrderedListEditorFn;
  editAttr: AttrEditorFn;
}

export type AlertFn = (message: string, title?: string) => Promise<void>;

export type AttrEditorFn = (attr: AttrProps) => Promise<AttrEditResult | null>;

export type LinkEditorFn = (link: LinkProps) => Promise<LinkEditResult | null>;

export type ImageEditorFn = (image: ImageProps) => Promise<ImageEditResult | null>;

export type OrderedListEditorFn = (list: OrderedListProps) => Promise<OrderedListEditResult | null>;

export interface AttrProps {
  readonly id?: string;
  readonly classes?: string[];
  readonly keyvalue?: [[string, string]];
}

export type AttrEditResult = AttrProps;

export interface LinkProps extends AttrProps {
  readonly href: string;
  readonly title?: string;
}

export interface LinkEditResult {
  readonly action: 'edit' | 'remove';
  readonly link: LinkProps;
}

export interface ImageProps extends AttrProps {
  readonly src: string | null;
  readonly title?: string;
  readonly alt?: string;
}

export type ImageEditResult = ImageProps;

export interface OrderedListProps {
  readonly start: number;
  readonly number_style: string;
  readonly number_delim: string;
}

export type OrderedListEditResult = OrderedListProps;