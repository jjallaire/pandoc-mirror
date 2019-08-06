

const editLink = function(link) {
  
  return new Promise(resolve => {

    showDialog({
      id: 'linkDialog', 
      title: 'Edit Link', 
      fields: [
        { field: 'href', type: 'text', required: true },
        { field: 'title', type: 'text' }
      ],
      buttons: [
        { name: 'remove', text: 'Remove Link', style: 'margin-right: 40px;' }
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

    showDialog({
      id: 'imageDialog', 
      title: 'Edit Image', 
      fields: [
        { field: 'src', type: 'text', required: true },
        { field: 'title', type: 'text' },
        { field: 'alt', type: 'text' },
        { field: 'id', type: 'text' },
        { field: 'class', type: 'text' },
      ],
      buttons: null,
      record: image, 
      actions: {
        save: resolve,
      },
      options: {
        height: 320
      }
    });

  })
}


// based on http://w2ui.com/web/demos/#!forms/forms-8
function showDialog( { id, title, fields, buttons, record, actions, options } ) {

  // create the dialog if need be
  if (!w2ui[id]) {

    // generate html from fields/buttons
    const fieldsHTML = fields.reduce((html, field) => {
      const fieldHTML = `
        <div class="w2ui-field">
          <label>${field.field}</label>
          <div>
            <input name="${field.field}" type="${field.type}" style="width: 250px">
          </div>
        </div>
      `
      return html + fieldHTML;
    }, '');
    const buttonsHTML = (buttons || []).reduce((html, button) => {
      const buttonHTML = `
        <button class="w2ui-btn" name="${button.name}" style="${button.style}">${button.text}</button>
      `;
      return html + buttonHTML;
    }, '');

    let html = `
      <div class="w2ui-page page-0">
        ${fieldsHTML}
      </div>
      <div class="w2ui-buttons">
        ${buttonsHTML}
        <button class="w2ui-btn" name="cancel">Cancel</button>
        <button class="w2ui-btn" name="save">OK</button>
      </div>
    `

    $().w2form({
      name: id,
      style: 'border: 0px; background-color: transparent;',
      formHTML: html,
      fields: fields
    });
  }

  // helper to close dialog
  function closeDialog() { $('#' + id).w2popup('close'); }

  // helper to clean null fields from record
  function cleanRecord(record) {
    return Object.keys(record).reduce((cleaned, key) => {
      const value = record[key];
      if (value)
        cleaned[key] = value;
      return cleaned;
    }, {})
  }

  // populate data
  const dialog = w2ui[id]
  dialog.record = record

  // hookup standard actions
  dialog.actions = {
    save: function () { 
      if (this.validate().length === 0) {
        closeDialog();
        actions.save(cleanRecord(this.record))
      } 
    }.bind(dialog),

    cancel: closeDialog
  }

  // hookup custom actions
  Object.keys(actions).filter(action => action !== "save").forEach(action => {
    dialog.actions[action] = function() {
      closeDialog()
      actions[action](cleanRecord(this.record))
    }.bind(dialog)
  })

  $().w2popup('open', {
    title   : title,
    body    : `<div id="${id}" style="width: 100%; height: 100%;"></div>`,
    style   : 'padding: 15px 0px 0px 0px',
    width   : 500,
    height  : 280, 
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

