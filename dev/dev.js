


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





