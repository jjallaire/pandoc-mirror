export interface IPandocEngine {
  markdownToAst(markdown: string): Promise<object>;
  astToMarkdown(ast: object): Promise<string>;
}
