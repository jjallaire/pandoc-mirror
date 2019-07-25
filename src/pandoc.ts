

export interface IPandoc {
  markdownToAst(markdown: string) : Promise<object>
  astToMarkdown(ast: object) : Promise<string>
}
