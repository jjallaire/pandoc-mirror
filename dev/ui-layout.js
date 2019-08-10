
function initLayout(container, markdown) {

  // layout ui
  const layout = $('#layout').w2layout({
    name: 'layout',
    padding: 0,
    panels: [
      { 
        type: 'main', 
        overflow: 'scroll',
        toolbar: { items: [] },
        content: {
          render: function() {
            $(container).appendTo($(this.box))
          }
        }
      },
      {
        type: 'right',
        hidden: true,
        size: 400,
        style: 'border-left: 1px solid silver; background-color: #fafafa;',
        resizable: true,
        overflow: 'scroll',
        content: {
          render: function() {
            $(markdown).appendTo($(this.box))
          }
        },
        toolbar: { 
          items: [
            { type: 'break '},
            { type: 'html',
              html: '&nbsp;Markdown' },
            { type: 'spacer' },
            { type: 'button',
              icon: 'fa fa-angle-double-right',
              onClick: () => { 
                layout.hide('right')
                layout.get('main').toolbar.show('show_markdown')
              }
             },
          ],
          style: 'border-left: 1px solid silver;'
        },
      }
    ]
  });

  // return layout
  return layout
}

