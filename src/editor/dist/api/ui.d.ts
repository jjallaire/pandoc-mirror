export interface EditorUI {
    alert: AlertFn;
    editLink: LinkEditorFn;
    editImage: ImageEditorFn;
    editOrderedList: OrderedListEditorFn;
    editAttr: AttrEditorFn;
}
export declare type AlertFn = (message: string, title?: string) => Promise<void>;
export declare type AttrEditorFn = (attr: AttrProps) => Promise<AttrEditResult | null>;
export declare type LinkEditorFn = (link: LinkProps) => Promise<LinkEditResult | null>;
export declare type ImageEditorFn = (image: ImageProps) => Promise<ImageEditResult | null>;
export declare type OrderedListEditorFn = (list: OrderedListProps) => Promise<OrderedListEditResult | null>;
export interface AttrProps {
    readonly id?: string;
    readonly classes?: string[];
    readonly keyvalue?: [[string, string]];
}
export declare type AttrEditResult = AttrProps;
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
export declare type ImageEditResult = ImageProps;
export interface OrderedListProps {
    readonly tight: boolean;
    readonly start: number;
    readonly number_style: string;
    readonly number_delim: string;
}
export declare type OrderedListEditResult = OrderedListProps;
