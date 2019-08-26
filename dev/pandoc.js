

const pandocEngine = {
  
  markdownToAst(markdown, format) {
    return axios.post("/pandoc/ast", { markdown, format })
      .then(result => {
        if (result.data.ast)
          return result.data.ast;
        else
          return Promise.reject(new Error(result.data.error))
      })
  },
  
  astToMarkdown(ast, format, options) {
    return axios.post("/pandoc/markdown", { ast, format, options } )
      .then(result => {
        if (result.data.markdown)
          return result.data.markdown;
        else
          return Promise.reject(new Error(result.data.error));
      })
  }
  
}

