import { IImageProps, IImageEditor } from '../../api';

import { insertAndSelectNode } from '../../../utils/node';

import { Node, NodeType } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';

export function imageDialog(
  node: Node | null,
  nodeType: NodeType,
  state: EditorState,
  dispatch: (tr: Transaction<any>) => void,
  onEditImage: IImageEditor,
) {
  // if we are being called with an existing node then read it's attributes
  let image: IImageProps = { src: null };
  if (node && node.type === nodeType) {
    image = {
      src: node.attrs.src,
      title: node.attrs.title,
      alt: node.attrs.alt,
      id: node.attrs.id,
      class: node.attrs.class,
    };
  } else {
    image = nodeType.create(image).attrs as IImageProps;
  }

  // edit the image
  onEditImage(image).then(result => {
    if (result) {
      const newImage = nodeType.createAndFill(result);
      if (newImage) {
        insertAndSelectNode(newImage, state, dispatch);
      }
    }
  });
}
