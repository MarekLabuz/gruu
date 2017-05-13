const button = createComponent({
  _type: 'button',
  onclick () {
    console.log('click')
  },
  children: [{ _type: 'text', content: 'NEXT' }]
})

const container = document.querySelector('#root')
renderApp(container, [button])
