

const editLink = function(link) {
  
  return new Promise(resolve => {

    // show dialog
    showDialog({
      id: 'linkDialog', 
      title: 'Edit Link', 
      html: `
        <div class="w2ui-page page-0">
          <div class="w2ui-field">
            <label>URL:</label>
            <div>
              <input name="href" type="text" style="width: 250px">
            </div>
          </div>
          <div class="w2ui-field">
            <label>Title:</label>
            <div>
              <input name="title" type="text" style="width: 250px">
            </div>
          </div>         
        </div>
        <div class="w2ui-buttons">
          <button class="w2ui-btn" name="remove" style="margin-right: 40px;">Remove Link</button>
          <button class="w2ui-btn" name="cancel">Cancel</button>
          <button class="w2ui-btn" name="save">OK</button>
        </div>
      `,
      fields: [
        { field: 'href', type: 'text', required: true },
        { field: 'title', type: 'text' }
      ],
      record: link, 
      actions: {
        save: record => {
          resolve({
            action: 'edit',
            link: record
          })
        },
        remove: () => {
          resolve({
            action: 'remove'
          })
        }
      }
    });
  })
}


const editImage = function(image) {

  return new Promise(resolve => {



  })
}

// based on http://w2ui.com/web/demos/#!forms/forms-8
function showDialog( { id, title, html, fields, record, actions, options } ) {

  // create the dialog if need be
  if (!w2ui[id]) {
    $().w2form({
      name: id,
      style: 'border: 0px; background-color: transparent;',
      formHTML: html,
      fields: fields
    });
  }

  // helper to close dialog
  function closeDialog() { $('#' + id).w2popup('close'); }

  // populate data
  const dialog = w2ui[id]
  dialog.record = record

  // hookup standard actions
  dialog.actions = {
    save: function () { 
      if (this.validate().length === 0) {
        closeDialog();
        actions.save(this.record)
      } 
    }.bind(dialog),

    cancel: closeDialog
  }

  // hookup custom actions
  Object.keys(actions).filter(action => action !== "save").forEach(action => {
    dialog.actions[action] = function() {
      closeDialog()
      actions[action](this.record)
    }.bind(dialog)
  })


  $().w2popup('open', {
    title   : title,
    body    : `<div id="${id}" style="width: 100%; height: 100%;"></div>`,
    style   : 'padding: 15px 0px 0px 0px',
    width   : 500,
    height  : 300, 
    showMax : false,
    onToggle: function (event) {
      $(w2ui[id].box).hide();
      event.onComplete = function () {
        $(w2ui[id].box).show();
        w2ui[id].resize();
      }
    },
    onOpen: function (event) {
      event.onComplete = function () {
        $('#' + id).w2render(id);
      }
    },
    ...options
  });
}

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

