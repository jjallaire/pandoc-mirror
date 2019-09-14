import { InputRule } from 'prosemirror-inputrules';
import { Schema } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';
import { EditorUI } from 'editor/api/ui';
import { Command } from 'editor/api/command';
import { PandocMark } from 'editor/api/mark';
import { PandocNode } from 'editor/api/node';
import { Extension } from 'editor/api/extension';
import { PandocTokenReader, PandocMarkWriter, PandocNodeWriter } from 'editor/api/pandoc';
import { EditorConfig } from 'editor/editor';
export declare function initExtensions(config: EditorConfig): ExtensionManager;
export declare class ExtensionManager {
    private extensions;
    constructor();
    register(extensions: readonly Extension[]): void;
    pandocMarks(): readonly PandocMark[];
    pandocNodes(): readonly PandocNode[];
    pandocReaders(): readonly PandocTokenReader[];
    pandocMarkWriters(): readonly PandocMarkWriter[];
    pandocNodeWriters(): readonly PandocNodeWriter[];
    commands(schema: Schema, ui: EditorUI, mac: boolean): readonly Command[];
    plugins(schema: Schema, ui: EditorUI, mac: boolean): readonly Plugin[];
    inputRules(schema: Schema): InputRule[];
    private collect;
}
