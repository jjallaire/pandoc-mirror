

import { Schema } from 'prosemirror-model'


import { IEditorExtension, IEditorMark, IEditorNode, IEditorCommand } from './api'

import markStrong from './marks/strong'

export class ExtensionManager {

  public static create() : ExtensionManager {
    const manager = new ExtensionManager();
    manager.register(markStrong);
    return manager;
  }

  private extensions: IEditorExtension[];

  private constructor() {
    this.extensions = [];
  }

  public register(extension: IEditorExtension) : void {
    this.extensions.push(extension);
  }

  public marks() : IEditorMark[] {
    return this.collect<IEditorMark>((extension: IEditorExtension) => extension.marks)
  }

  public nodes() : IEditorNode[] {
    return this.collect<IEditorNode>((extension: IEditorExtension) => extension.nodes)  
  }

  public commands(schema: Schema): IEditorCommand[] {
    return this.collect<IEditorCommand>((extension: IEditorExtension) => {
      if (extension.commands) {
        return extension.commands(schema)
      } else {
        return undefined;
      }
    })
  }


  private collect<T>(collector: (extension: IEditorExtension) => T[] | undefined) {
    let items : T[] = [];
    this.extensions.forEach(extension => {
      const collected : T[] | undefined = collector(extension)
      if (collected !== undefined) {
        items = items.concat(collected);
      }
    });
    return items; 
  }
}