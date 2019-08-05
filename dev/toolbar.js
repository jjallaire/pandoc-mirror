
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
  toolbar.add(button('strong', 'fa-bold'))
  toolbar.add(button('em', 'fa-italic'))
 
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
          toolbar.disable
      }
    })
  })
  

}
