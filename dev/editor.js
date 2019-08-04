

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

let ui = {
  onEditLink(link) { 
    console.log(link)
    return Promise.resolve(null) 
  },
  onEditImage(image) { 
    console.log(image)
    return Promise.resolve(null) 
  }
}

let editor = new Editor({
  parent: document.getElementById('editor'), 
  pandoc,
  ui,
  options,
  hooks
});


let content = `
### Heading 

This is **bold** text. 

This is *italic* text.

This is hard break.  
Next line after hard break.

***

- Unordered
- List

1. Ordered
2. List

This is a link to [Google](https://www.google.com)

This is an image:

![](rstudio.png)

\`\`\`r
Here is a code block.

Another line of code.
\`\`\`

> This is a blockquote. See how it runs!

This is \`code\` text.
`;

editor.setContent(content)

