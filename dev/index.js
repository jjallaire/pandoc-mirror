

// initialize layout
const layout = initLayout()

// create editor
let editor = new PandocMirror.Editor({
  parent: layout.container, 
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
  $(layout.markdown).text((editor.getMarkdown()));
})

// get content and load it into the editor
axios.get('content.md') .then(result => {
  editor.setMarkdown(result.data)
})





