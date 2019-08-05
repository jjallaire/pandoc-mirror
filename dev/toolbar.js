
const initToolbar = function(toolbar, editor) {

  // functions for creating toolbar buttons and menus
  const commands = editor.commands()
  function button(command, icon) {
    let cmd = commands[command]
    return {
      type: 'button',
      id: cmd.name,
      icon: 'fa ' + icon,
      onClick: () => {
        cmd.execute()
        editor.focus()
      }
    }
  }
  function menuRadio(id, items) {
    return {
      id,
      type: 'menu-radio',
      text: function(item) {
        const el = toolbar.get(id + ':' + item.selected)
        return el.text
      },
      selected: 'paragraph',
      style: 'min-width: 65px',
      items
    }
  }
  function syncMenuRadio(id) {
    let menu = toolbar.get(id)
    for (let i = 0; i<menu.items.length; ++i) {
      const menuItem = menu.items[i];
      const isActive = commands[menuItem.id].isActive()
      if (isActive) {
        menu.selected = menuItem.id
        toolbar.refresh(menu.id)
        break
      }
    }
  }
  function menuItem(command, text) {
    let cmd = commands[command]
    return {
      id: cmd.name,
      text
    }
  }

  // initialize toolbar
  const kBreak = [ { type: 'break' } ]
  toolbar.add(button('undo', 'fa-undo'))
  toolbar.add(button('redo', 'fa-repeat'))
  toolbar.add(kBreak)
  toolbar.add(menuRadio('block_type', [
    menuItem('paragraph', 'Normal'),
    menuItem('heading1', 'Heading 1'),
    menuItem('heading2', 'Heading 2'),
    menuItem('heading3', 'Heading 3'),
    menuItem('heading4', 'Heading 4'),
    menuItem('code_block', 'Code Block'),
  ]))
  toolbar.add(kBreak)
  toolbar.add(button('strong', 'fa-bold'))
  toolbar.add(button('em', 'fa-italic'))
  toolbar.add(button('code', 'fa-code'))
  toolbar.add(button('link', 'fa-link'))
  toolbar.add(kBreak)
  toolbar.add(button('bullet_list', 'fa-list-ul'))
  toolbar.add(button('ordered_list', 'fa-list-ol'))
  toolbar.add(button('blockquote', 'fa-quote-right')),
  toolbar.add(kBreak)
  toolbar.add(button('image', 'fa-image'))

  // click handlers for radio menus
  toolbar.onClick = (event) => {
    if (event.item.type === "menu-radio" && event.subItem) {
      commands[event.subItem.id].execute()
      editor.focus()
    }
  }
  
  // sync toolbar to editor state changes
  editor.subscribe(PandocMirror.kEventSelectionChange, () => {
    
    // sync toolbar buttons
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

    // sync block menu
    syncMenuRadio('block_type')
  })
  

}
