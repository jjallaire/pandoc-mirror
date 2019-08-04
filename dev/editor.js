

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


// function to initialize editor given a parent
function initEditor(parent) {
  // create editor
  let editor = new PandocMirror.Editor({
    parent, 
    pandoc,
    ui,
    options: {
      autoFocus: true
    },
    hooks
  });

  // get content and load it into the editor
  axios.get('content.md') .then(result => {
    editor.setContent(result.data)
  })
}

$('#layout').w2layout({
  name: 'layout',
  panels: [{ 
    type: 'main', 
    overflow: 'scroll',
    toolbar: {
      items: [
        { type: 'button',  id: 'item5',  caption: 'Item 5', icon: 'w2ui-icon-check', hint: 'Hint for item 5' }
      ]
    }, 
    content: {
      render: function() {
        const container = $("<div id='container'></div>")
        $(this.box).append(container);
        initEditor(container.get(0))
      }
    }
  },
  ]
});

