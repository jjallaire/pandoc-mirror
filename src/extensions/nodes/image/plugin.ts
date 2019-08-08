import { Node, NodeType } from 'prosemirror-model';
import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { IImageEditor } from '../../api/ui';
import { imageDialog } from './dialog';



export function imagePlugin(nodeType: NodeType, onEditImage: IImageEditor) {
  return new Plugin({
    key: new PluginKey('image'),
    props: {
      handleDoubleClickOn: doubleClickOn(nodeType, onEditImage),
      handleDOMEvents: {
        drop: drop(nodeType),
      },
    },
  });
}

function doubleClickOn(nodeType: NodeType, onEditImage: IImageEditor) {
  return (view: EditorView, pos: number, node: Node) => {
    if (node.type === nodeType) {
      imageDialog(node, nodeType, view.state, view.dispatch, onEditImage);
      return true;
    } else {
      return false;
    }
  };
}

function drop(nodeType: NodeType) {
  return (view: EditorView, event: Event) => {
    // alias to drag event so typescript knows about event.dataTransfer
    const dragEvent = event as DragEvent;

    // ensure we have data transfer
    if (!dragEvent.dataTransfer) {
      return false;
    }

    // ensure the drop coordinates map to an editor position
    const coordinates = view.posAtCoords({
      left: dragEvent.clientX,
      top: dragEvent.clientY,
    });
    if (!coordinates) {
      return false;
    }

    // see if this is a drag of image uris
    const uriList = dragEvent.dataTransfer.getData('text/uri-list');
    const html = dragEvent.dataTransfer.getData('text/html');
    if (!uriList || !html) {
      return false;
    }

    // see if we can pull an image out of the html
    const regex = /<img.*?src=["'](.*?)["']/;
    const match = regex.exec(html);
    if (!match) {
      return false;
    }

    // indicate that we can handle this drop
    event.preventDefault();

    // insert the images
    uriList.split('\r?\n').forEach(src => {
      const node = nodeType.create({ src });
      const transaction = view.state.tr.insert(coordinates.pos, node);
      view.dispatch(transaction);
    });

    return true;
  };
}
