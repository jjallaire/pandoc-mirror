

const editLink = function(link) {
  
  // create the dialog if we need to
  return new Promise(resolve => {
    if (!w2ui.linkDialog) {
      $().w2form({
        name: 'linkDialog',
        style: 'border: 0px; background-color: transparent;',
        formHTML: `
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
      });
    }

    // populate data
    w2ui.linkDialog.record = {
      href: link.href || '',
      title: link.title || ''
    };

    // hookup actions for this promise
    w2ui.linkDialog.actions = {
      "save": function () { 
        if (this.validate().length === 0) {
          closeDialog();
          resolve({
            action: 'edit',
            link: {
              href: this.record.href,
              title: this.record.title
            }
          })
        } 
      }.bind(w2ui.linkDialog),
      "remove": function() {
        closeDialog();
        resolve({
          action: 'remove'
        })
      },
      "cancel": closeDialog
    }

    // helper to close dialog
    function closeDialog() { $('#linkDialog').w2popup('close'); }

    // show dialog
    showDialog('Edit Link', 'linkDialog');
  })



 

}


const editImage = function(image) {
  return Promise.resolve(null) 
}

// based on http://w2ui.com/web/demos/#!forms/forms-8
function showDialog(title, popupId, options) {
  $().w2popup('open', {
    title   : title,
    body    : `<div id="${popupId}" style="width: 100%; height: 100%;"></div>`,
    style   : 'padding: 15px 0px 0px 0px',
    width   : 500,
    height  : 300, 
    showMax : false,
    onToggle: function (event) {
      $(w2ui[popupId].box).hide();
      event.onComplete = function () {
        $(w2ui[popupId].box).show();
        w2ui[popupId].resize();
      }
    },
    onOpen: function (event) {
      event.onComplete = function () {
        $('#' + popupId).w2render(popupId);
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

