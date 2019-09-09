import { Plugin, PluginKey, Transaction, EditorState, TextSelection } from "prosemirror-state";
import { Extension } from "api/extension";
import { NodeWithPos, findParentNodeOfType, findChildrenByType, findParentNodeOfTypeClosestToPos } from "prosemirror-utils";
import { Schema, Node as ProsemirrorNode } from "prosemirror-model";
import { transactionsHaveChange } from "api/transaction";
import { Decoration, DecorationSet } from "prosemirror-view";
import { nodeDecoration } from "api/decoration";
import { wrappingInputRule, InputRule } from "prosemirror-inputrules";


// TODO: nested task lists?

// TODO: tweak selection after list input rule

// TODO: insert command for task


const kCheckedChar = '☒';
const kUncheckedChar = '☐';

const plugin = new PluginKey('task_lists');

const extension: Extension = {

  plugins: (schema: Schema) => {
    return [
      new Plugin({
        key: plugin,
        props: {
          decorations: taskListItemDecorations(schema)
        },
        appendTransaction: taskListAppendTransaction(schema),
      }),
    ];
  },

  inputRules: (schema: Schema) => {
    return [
      taskListInputRule(schema),
      taskInputRule(schema)
    ];
  },
};


// Pandoc represents task lists by just inserting a '☒' or '☐' character at the beginning of the list item. 
// Here we define a node decorator that looks for list items w/ those characters at the beginning, then positions
// a check box over that character. The check box then listens for change events and creates a transaction to 
// toggle the character underneath it. This decorator also adds css classes to ul/ol/li tags to indicate that
// they are task lists (no special styling is applied by default)
function taskListItemDecorations(schema: Schema) {
  
  return (state: EditorState) => {

    // decorations
    const decorations: Decoration[] = [];

    // find all list items
    const listItems = findChildrenByType(state.doc, schema.nodes.list_item);
    listItems.forEach(nodeWithPos => {
      const status = taskStatus(nodeWithPos);
     
      if (status !== TaskStatus.None) {
        
        // position a checkbox over the first character
        decorations.push(Decoration.widget(nodeWithPos.pos+2, 
          (view, getPos: () => number) => {
            const input = window.document.createElement("input");
            input.setAttribute('type', 'checkbox');
            input.checked = status === TaskStatus.Checked;
            input.addEventListener("mousedown", (ev: Event) => {
              ev.preventDefault(); // don't steal focus
            });
            input.addEventListener("change", (ev: Event) => {
              const pos = getPos();
              const tr = view.state.tr;
              const char = input.checked ?  kCheckedChar : kUncheckedChar;
              tr.replaceRangeWith(pos, pos+1, schema.text(char));
              view.dispatch(tr);
            });
            return input;
          }));
        // mark the item as a task item
        decorations.push(nodeDecoration(nodeWithPos, { class: 'task-item' }));
        // mark the parent list w/ css class indicating it's a task list
        const parentList = findParentNodeOfTypeClosestToPos(
          state.doc.resolve(nodeWithPos.pos), 
          schema.nodes.bullet_list
        );
        if (parentList) {
          decorations.push(nodeDecoration(parentList, { class: 'task-list' }));
        }
      }
      
    });

    return DecorationSet.create(state.doc, decorations);
  };
}


// monitor editor transactions and automatically insert a checkbox at the beginning of new 
// list items that are created by splitting off from list items that have a check mark
function taskListAppendTransaction(schema: Schema) {

  const checkboxRegex = new RegExp(`[${kCheckedChar}${kUncheckedChar}]`);
  const checkboxChange = (node: ProsemirrorNode) => node.isText && checkboxRegex.test(node.textContent);

  return (transactions: Transaction[], oldState: EditorState, newState: EditorState) => {

    // if this was a mutating transaction (as opposed to a selection-only transaction)
    if (transactions.some(transaction => transaction.docChanged)) {
      
      // mask out removal of checkboxes (if we don't do this then removing the checkbox at the
      // beginning of a line isn't possible)
      if (transactionsHaveChange(transactions, oldState, newState, checkboxChange, "removed")) {
        return null;
      }

      // if the old state was a selection inside a checked list item
      const oldListItem = findParentNodeOfType(schema.nodes.list_item)(oldState.selection);
      if (oldListItem && taskStatus(oldListItem) !== TaskStatus.None) {

        // if the new state is at the beginning of a list item
        const newListItem = findParentNodeOfType(schema.nodes.list_item)(newState.selection);
        if (newListItem && (newListItem.pos + 2) === newState.selection.from) {

          const tr = newState.tr;

          // if the previous item is empty save for a check mark, then exit the list
          if (oldListItem.node.textContent.length === 2) {

            // remove the old and new list items
            tr.delete(newListItem.pos, newListItem.pos + newListItem.node.nodeSize);
            tr.delete(oldListItem.pos, oldListItem.pos + oldListItem.node.nodeSize);
          
          // othewise insert a check box
          } else {
            tr.insertText(kUncheckedChar + ' ');
          }

          // return transaction
          return tr;

        }
      
      }
    }
  };
}


// allow users to type [x] or [ ] to insert a task checkbox within a list item
function taskInputRule(schema: Schema) {
  return new InputRule(/\[([ x])\]\s$/, (state: EditorState, match: string[], start: number, end: number) => {

    if (findParentNodeOfType(schema.nodes.list_item)(state.selection)) {

      // delete entered text
      const tr = state.tr;
      tr.delete(start,end);

      // insert checkbox
      return insertCheckbox(tr, match[1]);

    } else {
      return null;
    }
  });
}


// allow users to begin a new task list by typing [x] or [ ] at the beginning of a line
function taskListInputRule(schema: Schema) {

  // regex to match checked list at the beginning of a line
  const regex = /^\s*\[([ x])\]\s$/;

  // we are going to steal the handler from the base bullet list wrapping input rule
  const baseInputRule: any = wrappingInputRule(regex, schema.nodes.bullet_list);

  return new InputRule(regex, (state: EditorState, match: string[], start: number, end: number) => {

    // call the base handler to create the bullet list
    const tr = baseInputRule.handler(state, match, start, end);
    if (tr) {
    
      // insert the checkbox 
      insertCheckbox(tr, match[1]);

      // set selection


      return tr;


    } else {
      return null;
    }
  });
}

// insert a checkbox based on matching input of [x] or [ ]
function insertCheckbox(tr: Transaction, match: string) { 
  const checkText = match === 'x' ? kCheckedChar : kUncheckedChar;
  tr.insertText(checkText + ' ');
  return tr;
}

// determine the task status of the passed node (checks the first character for [x] or [ ])

enum TaskStatus {
  None,
  Checked,
  Unchecked
}

function taskStatus(nodeWithPos: NodeWithPos) {
  const item = nodeWithPos.node;
  if (item.nodeSize >= 2) {
    const firstChar = item.textBetween(1, 2);
    switch(firstChar) {
      case kCheckedChar:
        return TaskStatus.Checked;
      case kUncheckedChar:
        return TaskStatus.Unchecked;
      default:
        return TaskStatus.None;
    }
  } else {
    return TaskStatus.None;
  }
}

export default extension;


