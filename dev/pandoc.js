

const pandocEngine = {
  
  markdownToAst(format, markdown) {
    return axios.post("/pandoc/ast", { format , markdown })
      .then(result => {
      return result.data.ast;
    })
  },
  
  astToMarkdown(format, ast) {
    return axios.post("/pandoc/markdown", { format, ast } )
      .then(result => {
        return result.data.markdown;
    })
  }
  
}

