const store = createComponent({
  state: {
    className: 'dsfdsf',
    data: ['1'],
    counter: 0
  }
})

const button = inc => createComponent({
  _type: 'button',
  onclick () {
    store.state.counter += inc
  },
  children: [{ _type: 'text', content: inc > 0 ? 'INC' : 'DEC' }]
})

const span = createComponent({
  _type: 'span',
  children: [
    button(1),
    button(-1),
    {
      _type: 'text',
      __content: () => store.state.counter
    }
  ]
}, store)


const div = createComponent({
  _type: 'div',
  __className: () => store.state.className,
  __children: () => store.state.data.map(id => ({
    _type: 'span',
    className: id,
    children: [
      {
        _type: 'text',
        content: id
      }
    ]
  }))
}, store)


setTimeout(() => {
  store.state.data = [1, 2, 3, 4, 5]
}, 2000)


const container = document.querySelector('#root')
renderApp(container, [div, span])
