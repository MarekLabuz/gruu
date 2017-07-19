const store = createComponent({
  id: 'store',
  state: {
    counter: 0
  }
})

const div = counter => createComponent({
  _type: 'div',
  id: 'div',
  $children: () => [{ _type: 'span', textContent: store.state.counter + counter }]
})

const main = createComponent({
  _type: 'div',
  id: 'main',
  state: {
    counter: 0
  },
  $children () {
    return [div(this.state.counter)]
  }
})

const button1 = createComponent({
  _type: 'button',
  textContent: 'store',
  onclick () {
    store.state.counter += 1
  }
})

const button2 = createComponent({
  _type: 'button',
  textContent: 'main',
  onclick () {
    main.state.counter += 1
  }
})

const container = document.querySelector('#root')
renderApp(container, [main, button1, button2])

