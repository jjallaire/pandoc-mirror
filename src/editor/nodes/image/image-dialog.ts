import { Node, NodeType } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';

import { insertAndSelectNode } from 'editor/api/node';
import { ImageEditorFn, ImageProps } from 'editor/api/ui';
import { EditorView } from 'prosemirror-view';

export function imageDialog(
  node: Node | null,
  nodeType: NodeType,
  state: EditorState,
  dispatch: (tr: Transaction<any>) => void,
  view: EditorView | undefined,
  onEditImage: ImageEditorFn,
) {
  // if we are being called with an existing node then read it's attributes
  let image: ImageProps = { src: null };
  if (node && node.type === nodeType) {
    image = node.attrs as ImageProps;
  } else {
    image = nodeType.create(image).attrs as ImageProps;
  }

  // edit the image
  onEditImage({ ...image }).then(result => {
    if (result) {
      const newImage = nodeType.createAndFill(result);
      if (newImage) {
        insertAndSelectNode(newImage, state, dispatch);
      }
    }

    if (view) {
      view.focus();
    }
  });
}
