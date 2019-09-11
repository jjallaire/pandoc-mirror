import { Plugin, PluginKey, TextSelection, EditorState, Transaction, Selection } from "prosemirror-state";
import { Schema, Node as ProsemirrorNode } from "prosemirror-model";
import { EditorView, NodeView } from "prosemirror-view";
import { undo, redo } from "prosemirror-history";
import { exitCode } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";

import CodeMirror from "codemirror";
import 'codemirror/lib/codemirror.css';

import { Extension } from "api/extension";

import './codemirror.css';

const plugin = new PluginKey('codemirror');

const extension: Extension = {

  plugins: (schema: Schema) => {
    return [
      // embedded code editor
      new Plugin({
        key: plugin,
        props: {
          nodeViews: {
            code_block(node: ProsemirrorNode, view: EditorView, getPos: () => number) {
              return new CodeBlockNodeView(node, view, getPos);
            }
          }
        },
      }),
      // arrow in and out of editor
      keymap({
        ArrowLeft: arrowHandler("left"),
        ArrowRight: arrowHandler("right"),
        ArrowUp: arrowHandler("up"),
        ArrowDown: arrowHandler("down")
      })
    ];
  },

};

// https://github.com/ProseMirror/website/blob/master/example/codemirror/index.js
class CodeBlockNodeView implements NodeView {

  public readonly dom: HTMLElement;
  private readonly view: EditorView;
  private readonly getPos: () => number;
  private readonly cm: CodeMirror.Editor;

  private node: ProsemirrorNode;
  private incomingChanges: boolean;
  private updating: boolean;

  constructor(node: ProsemirrorNode, view: EditorView, getPos: () => number) {
    
    // Store for later
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.incomingChanges = false;

    // Create a CodeMirror instance
    
    this.cm = CodeMirror(null!, {
      value: this.node.textContent,
      lineNumbers: true,
      extraKeys: this.codeMirrorKeymap()
    });

    // The editor's outer node is our DOM representation
    this.dom = this.cm.getWrapperElement();
    // CodeMirror needs to be in the DOM to properly initialize, so
    // schedule it to update itself
    setTimeout(() => this.cm.refresh(), 20);

    // This flag is used to avoid an update loop between the outer and
    // inner editor
    this.updating = false;
    // Track whether changes are have been made but not yet propagated
    this.cm.on("beforeChange", () => this.incomingChanges = true);
    // Propagate updates from the code editor to ProseMirror
    this.cm.on("cursorActivity", () => {
      if (!this.updating && !this.incomingChanges) {
         this.forwardSelection();
      }
    });
    this.cm.on("changes", () => {
      if (!this.updating) {
        this.valueChanged();
        this.forwardSelection();
      }
      this.incomingChanges = false;
    });
    this.cm.on("focus", () => this.forwardSelection());
  }

  public update(node: ProsemirrorNode) {
    if (node.type !== this.node.type) {
      return false;
    }
    this.node = node;
    const change = this.computeChange(this.cm.getValue(), node.textContent);
    if (change) {
      this.updating = true;
      const cmDoc = this.cm.getDoc();
      cmDoc.replaceRange(change.text, cmDoc.posFromIndex(change.from), cmDoc.posFromIndex(change.to));
      this.updating = false;
    }
    return true;
  }

  public setSelection(anchor: number, head: number) {
    this.cm.focus();
    this.updating = true;
    const cmDoc = this.cm.getDoc();
    cmDoc.setSelection(cmDoc.posFromIndex(anchor), cmDoc.posFromIndex(head));
    this.updating = false;
  }

  public selectNode() { 
    this.cm.focus(); 
  }

  public stopEvent() {
    return true;
  }

  private forwardSelection() {
    if (!this.cm.hasFocus()) { 
      return;
    }

    const state = this.view.state;
    const selection = this.asProseMirrorSelection(state.doc);
    if (!selection.eq(state.selection)) {
      this.view.dispatch(state.tr.setSelection(selection));
    }
  }

  private asProseMirrorSelection(doc: ProsemirrorNode) {
    const offset = this.getPos() + 1;
    const cmDoc = this.cm.getDoc();
    const anchor = cmDoc.indexFromPos(cmDoc.getCursor("anchor")) + offset;
    const head = cmDoc.indexFromPos(cmDoc.getCursor("head")) + offset;
    return TextSelection.create(doc, anchor, head);
  }

  private valueChanged() {
    const change = this.computeChange(this.node.textContent, this.cm.getValue());
    if (change) {
      const start = this.getPos() + 1;
      const tr = this.view.state.tr.replaceWith(
        start + change.from, start + change.to,
        change.text ? this.node.type.schema.text(change.text) : null);
      this.view.dispatch(tr);
    }
  }

  private codeMirrorKeymap() {
    const view = this.view;
    const mod = /Mac/.test(navigator.platform) ? "Cmd" : "Ctrl";
    // note: normalizeKeyMap not declared in CodeMirror types
    return (CodeMirror as any).normalizeKeyMap({
      Up: () => this.maybeEscape("line", -1),
      Left: () => this.maybeEscape("char", -1),
      Down: () => this.maybeEscape("line", 1),
      Right: () => this.maybeEscape("char", 1),
      [`${mod}-Z`]: () => undo(view.state, view.dispatch),
      [`Shift-${mod}-Z`]: () => redo(view.state, view.dispatch),
      [`${mod}-Y`]: () => redo(view.state, view.dispatch),
      "Ctrl-Enter": () => {
        if (exitCode(view.state, view.dispatch)) {
          view.focus();
        }
      }
    });
  }

  private maybeEscape(unit: string, dir: number) {
    const cmDoc = this.cm.getDoc();
    const pos = cmDoc.getCursor();
    if (cmDoc.somethingSelected() ||
        pos.line !== (dir < 0 ? cmDoc.firstLine() : cmDoc.lastLine()) ||
        (unit === "char" &&
          pos.ch !== (dir < 0 ? 0 : cmDoc.getLine(pos.line).length))) {
      return CodeMirror.Pass;
    }
    this.view.focus();
    const targetPos = this.getPos() + (dir < 0 ? 0 : this.node.nodeSize);
    const selection = Selection.near(this.view.state.doc.resolve(targetPos), dir);
    this.view.dispatch(this.view.state.tr.setSelection(selection).scrollIntoView());
    this.view.focus();
  }

  private computeChange(oldVal: string, newVal: string) {
    if (oldVal === newVal) {
      return null;
    } 
    let start = 0;
    let oldEnd = oldVal.length;
    let newEnd = newVal.length;
    while (start < oldEnd && oldVal.charCodeAt(start) === newVal.charCodeAt(start)) {
      ++start;
    }
    while (oldEnd > start && newEnd > start &&
            oldVal.charCodeAt(oldEnd - 1) === newVal.charCodeAt(newEnd - 1)) {
      oldEnd--; 
      newEnd--; 
    }
    return {
      from: start, 
      to: oldEnd, 
      text: newVal.slice(start, newEnd)
    };
  }
}


function arrowHandler(dir: "up" | "down" | "left" | "right" | "forward" | "backward") {
  return (state: EditorState, dispatch?: (tr: Transaction<any>) => void, view?: EditorView) => {

    if (state.selection.empty && view && view.endOfTextblock(dir)) {
      const side = dir === "left" || dir === "up" ? -1 : 1;
      const $head = state.selection.$head;
      const nextPos = Selection.near(state.doc.resolve(side > 0 ? $head.after() : $head.before()), side);
      if (nextPos.$head && nextPos.$head.parent.type.name === "code_block") {
        if (dispatch) {
          dispatch(state.tr.setSelection(nextPos));
        }
        return true;
      }
    }
    return false;
  };
}

export default extension;