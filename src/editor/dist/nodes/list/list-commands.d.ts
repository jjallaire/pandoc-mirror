import { NodeType, Schema } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { NodeCommand, Command } from 'editor/api/command';
import { EditorUI } from 'editor/api/ui';
export declare class ListCommand extends NodeCommand {
    constructor(name: string, keymap: string[] | null, listType: NodeType, listItemType: NodeType);
}
export declare class TightListCommand extends Command {
    constructor(schema: Schema);
    isActive(state: EditorState): boolean;
}
export declare class OrderedListEditCommand extends Command {
    constructor(schema: Schema, ui: EditorUI);
}
