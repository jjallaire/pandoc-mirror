

import { IEditorExtension, IEditorMark, IEditorNode } from './api'

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


  private collect<T>(collector: (extension: IEditorExtension) => T[] | undefined) {
    const items : T[] = [];
    this.extensions.forEach(extension => {
      const collected : T[] | undefined = collector(extension)
      if (collected !== undefined) {
        items.concat(collected);
      }
    });
    return items; 
  }
}