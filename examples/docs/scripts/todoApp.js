const store = createComponent({
  state: {
    todo: ['buy milk', 'walk the dog']
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
  $disabled: () => store.state.todo.length > 5,
  onclick () {
    store.state.todo.push(input.value)
    input.value = ''
  }
})

const todo = createComponent({
  _type: 'ul',
  $children: () => store.state.todo
    .map((item, index) => ({
      _type: 'li',
      textContent: item,
      onclick () {
        store.state.todo = [
          ...store.state.todo.slice(0, index),
          ...store.state.todo.slice(index + 1)
        ]
      }
    }))
})

const todoApp = createComponent({
  _type: 'div',
  children: [input, addButton, todo]
})

const todoContainer = document.querySelector('.todo-app')
renderApp(todoContainer, [todoApp])
