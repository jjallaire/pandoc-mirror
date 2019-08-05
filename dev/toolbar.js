
var initToolbar = function(toolbar, editor) {

  // functions for creating toolbar buttons and menus
  const commands = editor.commands()
  function button(command, icon) {
    let cmd = commands[command]
    return {
      type: 'button',
      id: cmd.name,
      icon: 'fa ' + icon,
      onClick: cmd.execute
    }
  }
  
  // initialize toolbar
  const kBreak = [ { type: 'break' } ]
  toolbar.add(button('undo', 'fa-undo'))
  toolbar.add(button('redo', 'fa-repeat'))
  toolbar.add(kBreak)
  toolbar.add(button('strong', 'fa-bold'))
  toolbar.add(button('em', 'fa-italic'))
  toolbar.add(button('code', 'fa-code'))
  toolbar.add(kBreak)

 
  // sync toolbar to editor state changes
  editor.subscribe(PandocMirror.kEventSelectionChange, () => {
    Object.keys(commands).forEach(command => {
      let cmd = commands[command]
      if (cmd) {
        if (cmd.isActive())
          toolbar.check(command)
        else
          toolbar.uncheck(command)
        if (cmd.isEnabled())
          toolbar.enable(command)
        else
          toolbar.disable(command)
      }
    })
  })
  

}
