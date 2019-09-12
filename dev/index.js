

// initialize layout
const layout = initLayout()

// create editor
let editor = new PandocMirror.Editor({
  parent: layout.editor, 
  pandoc: pandocEngine,
  ui: editorUI,
  options: {
    autoFocus: true,
    codemirror: true
  },
  hooks: {
    applyDevTools: ProseMirrorDevTools.applyDevTools
  }
});

// create codemirror instance for preview
let cm = new CodeMirror(layout.markdown, {
  mode: 'markdown'
});

// initialize toolbar
initToolbar(layout.w2layout, editor)


// update markdown when editor is updated
editor.subscribe(PandocMirror.kEventUpdate, () => {
  editor.getMarkdown()
    .then(markdown => {
      cm.replaceRange(
        markdown,
        { line: cm.firstLine(), ch: 0 },
        { line: cm.lastLine(), ch: cm.getLine(cm.lastLine()).length } 
      );
    })
    .catch(error => {
      editorUI.alert(error.message)
    })
})

// get content and load it into the editor
axios.get('content/content.md') .then(result => {
  editor.setMarkdown(result.data)
    .catch(error => {
      editorUI.alert(error.message)
    })
})





