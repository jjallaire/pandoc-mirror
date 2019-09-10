
import { Node as ProsemirrorNode, Schema, Fragment } from 'prosemirror-model';
import { NodeView, EditorView, Decoration, DecorationSet } from "prosemirror-view";
import { EditorState } from 'prosemirror-state';
import { findChildrenByType, findParentNodeOfTypeClosestToPos } from 'prosemirror-utils';
import { nodeDecoration } from 'api/decoration';

const kItemChecked = '☒';
const kItemUnchecked = '☐';

// custom NodeView that accomodates display / interaction with item check boxes
export class ListItemNodeView implements NodeView {
  public readonly dom: HTMLElement;
  public readonly contentDOM: HTMLElement;

  private readonly node: ProsemirrorNode;
  private readonly view: EditorView;
  private readonly getPos: () => number;

  constructor(node: ProsemirrorNode, view: EditorView, getPos: () => number) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    // create root li element
    this.dom = window.document.createElement('li');
    if (node.attrs.tight) {
      this.dom.setAttribute('data-tight', 'true');
    }

    const container = window.document.createElement('div');
    container.classList.add('list-item-container');
    this.dom.appendChild(container);
  
    // add checkbox for checked items
    if (node.attrs.checked !== null) {

      this.dom.setAttribute('data-checked', node.attrs.checked ? 'true' : 'false');

      // checkbox for editing checked state
      const input = window.document.createElement('input');
      input.classList.add('list-item-checkbox');
      input.setAttribute('type', 'checkbox');
      input.checked = node.attrs.checked;
      input.contentEditable = 'false';
      if (!view.props.editable) {
        input.disabled = true;
      }
      input.addEventListener("mousedown", (ev: Event) => {
        ev.preventDefault(); // don't steal focus
      });
      input.addEventListener("change", (ev: Event) => {
        const tr = view.state.tr;
        tr.setNodeMarkup(getPos(), node.type, {
          ...node.attrs,
          checked: (ev.target as HTMLInputElement).checked
        });
        view.dispatch(tr);
        
      });
      container.appendChild(input);

    } 

    // content div 
    const content = window.document.createElement('div');
    content.classList.add('list-item-content');
    this.contentDOM = content;
    container.appendChild(content);

  }
}

// provide css classes for checked list items and the lists that contain them
export function checkedListItemDecorations(schema: Schema) {
  
  return (state: EditorState) => {

    // decorations
    const decorations: Decoration[] = [];

    // find all list items
    const listItems = findChildrenByType(state.doc, schema.nodes.list_item);
    listItems.forEach(nodeWithPos => {
      
      if (nodeWithPos.node.attrs.checked !== null) {
        decorations.push(nodeDecoration(nodeWithPos, { class: 'task-item' }));
        // mark the parent list w/ css class indicating it's a task list
        const parentList = findParentNodeOfTypeClosestToPos(
          state.doc.resolve(nodeWithPos.pos), 
          [schema.nodes.bullet_list, schema.nodes.ordered_list] 
        );
        if (parentList) {
          decorations.push(nodeDecoration(parentList, { class: 'task-list' }));
        }
      }
      
    });

    return DecorationSet.create(state.doc, decorations);
  };
}


// prepend a check mark to the provided fragment
export function fragmentWithCheck(schema: Schema, fragment: Fragment, checked: boolean) {
  const checkedText = schema.text((checked ? kItemChecked : kItemUnchecked) + ' ');
  return Fragment.from(checkedText).append(fragment);
}
