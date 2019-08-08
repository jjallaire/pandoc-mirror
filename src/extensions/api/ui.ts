export interface IEditorUI {
  onEditLink: ILinkEditor;
  onEditImage: IImageEditor;
}

export type ILinkEditor = (link: ILinkProps) => Promise<ILinkEditResult | null>;

export type IImageEditor = (image: IImageProps) => Promise<IImageEditResult | null>;

export interface ILinkProps {
  href: string;
  title?: string;
}

export interface ILinkEditResult {
  action: 'edit' | 'remove';
  link: ILinkProps;
}

export interface IImageProps {
  src: string | null;
  title?: string;
  alt?: string;
  id?: string;
  class?: string;
}

export type IImageEditResult = IImageProps;
