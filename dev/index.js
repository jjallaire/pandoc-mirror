

// initialize layout
const layout = initLayout()

// create editor
let editor = new PandocMirror.Editor({
  parent: layout.editor, 
  pandoc: pandocEngine,
  ui: editorUI,
  options: {
    autoFocus: true
  },
  hooks: {
    applyDevTools: ProseMirrorDevTools.applyDevTools
  }
});

// initialize toolbar
initToolbar(layout.toolbar, editor)

// update markdown when editor is updated
editor.subscribe(PandocMirror.kEventUpdate, () => {
  editor.getMarkdown().then(markdown => {
    $(layout.markdown).text(markdown)
  })
})

// get content and load it into the editor
axios.get('content/content.md') .then(result => {
  editor.setMarkdown(result.data)
})





