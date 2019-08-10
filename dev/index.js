

// behavior hooks
let hooks = {
  isEditable: () => true
}

// ui handlers
let ui = {
  onEditLink: editLink, 
  onEditImage: editImage
}

// pandoc ast conversion handlers
let pandoc = {
  markdownToAst(markdown) {
    return axios.post("/pandoc/ast", { format: 'markdown', markdown })
      .then(result => {
      return result.data.ast;
    })
  },
  astToMarkdown(ast) {
    return axios.post("/pandoc/markdown", { format: 'markdown', ast: ast })
      .then(result => {
        return result.data.markdown;
    })
  }
};

// create editor container
const container = document.createElement('div')
container.id = 'container'
document.body.append(container)

// create markdown container
const markdown = document.createElement('pre')
markdown.id = 'markdown'
document.body.append(markdown)

// create editor
let editor = new PandocMirror.Editor({
  parent: container, 
  pandoc,
  ui,
  options: {
    autoFocus: true
  },
  hooks,
  devtools: window.ProseMirrorDevTools
});

// layout ui
const layout = $('#layout').w2layout({
  name: 'layout',
  padding: 0,
  panels: [
    { 
      type: 'main', 
      overflow: 'scroll',
      toolbar: { items: [] },
      content: {
        render: function() {
          $(container).appendTo($(this.box))
        }
      }
    },
    {
      type: 'right',
      size: 400,
      style: 'border-left: 1px solid silver; background-color: #fafafa;',
      resizable: true,
      overflow: 'scroll',
      content: {
        render: function() {
          $(markdown).appendTo($(this.box))
        }
      },
      toolbar: { 
        items: [
          { type: 'break '},
          { type: 'html',
            html: '&nbsp;Markdown' },
          { type: 'spacer' },
          { type: 'button',
            icon: 'fa fa-close' },
        ],
        style: 'border-left: 1px solid silver;'
      },
    }
  ]
});

// initialize toolbar
const toolbar = layout.get('main').toolbar
initToolbar(toolbar, editor)

// update markdown when editor is updated
editor.subscribe(PandocMirror.kEventUpdate, () => {
  $(markdown).text((editor.getMarkdown()));
})

// get content and load it into the editor
axios.get('content.md') .then(result => {
  editor.setMarkdown(result.data)
})





