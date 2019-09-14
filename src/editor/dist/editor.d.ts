import { EditorView } from 'prosemirror-view';
import 'prosemirror-view/style/prosemirror.css';
import { EditorUI } from 'editor/api/ui';
import { Extension } from 'editor/api/extension';
import { PandocEngine } from 'editor/api/pandoc';
import './styles/prosemirror.css';
export interface EditorConfig {
    readonly parent: HTMLElement;
    readonly pandoc: PandocEngine;
    readonly ui: EditorUI;
    readonly options: EditorOptions;
    readonly hooks?: EditorHooks;
    readonly keybindings?: EditorKeybindings;
    readonly extensions?: readonly Extension[];
}
export { PandocEngine } from 'editor/api/pandoc';
export * from 'editor/api/ui';
export interface EditorOptions {
    readonly autoFocus?: boolean;
    readonly codemirror?: boolean;
}
export interface EditorHooks {
    isEditable?: () => boolean;
    applyDevTools?: (view: EditorView, stateClass: any) => void;
}
export interface EditorKeybindings {
    [key: string]: string[] | null;
}
export interface EditorCommand {
    readonly name: string;
    isEnabled: () => boolean;
    isActive: () => boolean;
    execute: () => void;
}
export declare const kEventUpdate = "update";
export declare const kEventSelectionChange = "selectionChange";
export declare class Editor {
    private static readonly keybindingsPlugin;
    private readonly parent;
    private readonly ui;
    private readonly options;
    private readonly hooks;
    private readonly schema;
    private readonly view;
    private readonly extensions;
    private readonly pandocConverter;
    private state;
    private events;
    private keybindings;
    constructor(config: EditorConfig);
    destroy(): void;
    subscribe(event: string, handler: VoidFunction): VoidFunction;
    setMarkdown(markdown: string, emitUpdate?: boolean): Promise<void>;
    getMarkdown(): Promise<string>;
    focus(): void;
    blur(): void;
    commands(): {
        [name: string]: EditorCommand;
    };
    setKeybindings(keyBindings: EditorKeybindings): void;
    private dispatchTransaction;
    private emitEvent;
    private initEvents;
    private initSchema;
    private createPlugins;
    private keybindingsPlugin;
    private commandKeys;
    private emptyDoc;
}
