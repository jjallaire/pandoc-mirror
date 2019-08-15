
function initLayout() {

  // create editor container
  const container = document.createElement('div')
  container.id = 'container'
  document.body.append(container)

  // create markdown container
  const markdown = document.createElement('pre')
  markdown.id = 'markdown'
  document.body.append(markdown)

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
        size: 450,
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
              id: 'markdown_caption',
              style: 'color: rgb(54, 55, 85); font-weight: 600;',
              html: '&nbsp;Preview' },
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

  // return layout components
  return {
    toolbar: layout.get('main').toolbar,
    container: container,
    markdown: markdown
  }
}

