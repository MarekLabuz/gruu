const store = createComponent({
  state: {
    todo: ['lala']
  }
})

const input = createComponent({
  _type: 'input',
  oninput (e) {
    this.value = e.currentTarget.value
  }
})

const addButton = createComponent({
  _type: 'button',
  textContent: 'ADD',
  onclick () {
    store.state.todo.push(input.value)
    input.value = ''
  }
})

const todo = createComponent({
  _type: 'ul',
  $children: () => store.state.todo.map(item => ({
    _type: 'li',
    textContent: item
  }))
})

const container = createComponent({
  _type: 'div',
  children: [input, addButton, todo]
})

const innerHTML = createComponent({
  _type: 'pre',
  textContent: ''
})

const root = document.querySelector('#root')
renderApp(root, [container, innerHTML])
