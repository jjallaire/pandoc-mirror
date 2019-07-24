

//   UI framework for demo: 
//     https://github.com/vitmalina/w2ui/
//     http://w2ui.com/web/demos/#!toolbar/toolbar-1


const Editor = PandocMirror.Editor;

let editor = new Editor(document.getElementById('editor'), 
  { 
    autoFocus: true
  },
  { 
    isEditable: () =>  true,
    onUpdate() {
      console.log("updated!")
    },
    onSelectionChange(type) {
      console.log("selection changed: " + type)
    }
  }
  );





