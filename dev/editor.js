

// notification hooks
let hooks = {
  isEditable: () => true,
  onUpdate() {
    console.log("updated!")
  },
  onSelectionChange(type) {
    console.log("selection changed: " + type)
  }
}

// ui handlers
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

// pandoc ast conversion handlers
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

// create editor container
const container = document.createElement('div')
container.id = 'container'
document.body.append(container)

// create editor
let editor = new PandocMirror.Editor({
  parent: container, 
  pandoc,
  ui,
  options: {
    autoFocus: true
  },
  hooks
});

// layout ui
$('#layout').w2layout({
  name: 'layout',
  panels: [{ 
    type: 'main', 
    overflow: 'scroll',
    toolbar: initToolbar(editor),
    content: {
      render: function() {
        $(container).appendTo($(this.box))
      }
    }
  },
  ]
});

// get content and load it into the editor
axios.get('content.md') .then(result => {
  editor.setContent(result.data)
})



