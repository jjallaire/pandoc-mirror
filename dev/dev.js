

//   UI framework for demo: 
//     https://github.com/vitmalina/w2ui/
//     http://w2ui.com/web/demos/#!toolbar/toolbar-1


const Editor = PandocMirror.Editor;

let pandoc = {
  markdownToAst(markdown) {
    return axios.post("/pandoc/ast", { format: 'commonmark', markdown })
      .then(result => {
      return result.data.ast;
    })
  },
  astToMarkdown(ast) {
    return axios.post("/pandoc/markdown", { format: 'commonmark', ast: ast })
      .then(result => {
        return result.data.markdown;
    })
  }
};

let options = {
  autoFocus: true
}

let hooks = {
  isEditable: () => true,
  onUpdate() {
    console.log("updated!")
  },
  onSelectionChange(type) {
    console.log("selection changed: " + type)
  }
}

let editor = new Editor({
  parent: document.getElementById('editor'), 
  pandoc,
  options,
  hooks
});


/*
pandoc.markdownToAst('this is some *bold* text')
  .then(ast => {
    console.log(ast);
    return pandoc.astToMarkdown(ast);
  })
  .then(markdown => {
    console.log(markdown);
  });
*/





