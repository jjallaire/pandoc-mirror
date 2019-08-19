

const pandocEngine = {
  
  markdownToAst(format, markdown) {
    return axios.post("/pandoc/ast", { format , markdown })
      .then(result => {
        if (result.data.ast)
          return result.data.ast;
        else
          return Promise.reject(new Error(result.data.error))
      })
  },
  
  astToMarkdown(format, ast) {
    return axios.post("/pandoc/markdown", { format, ast } )
      .then(result => {
        if (result.data.markdown)
          return result.data.markdown;
        else
          return Promise.reject(new Error(result.data.error));
      })
  }
  
}

