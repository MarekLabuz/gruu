const store = createComponent({
  state: {
    className: 'dsfdsf',
    data: ['1'],
    counter: 0
  }
})

const button = createComponent({
  _type: 'button',
  state: {
    counter: 0
  },
  onclick () {
    this.state.counter += 1
  },
  children: [{ _type: 'text', content: 'INC' }]
})

const span = createComponent({
  _type: 'span',
  children: [
    {
      _type: 'text',
      __content: () => button.state.counter
    }
  ]
}, button)


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
      },
      button
    ]
  }))
}, store)

const input = createComponent({
  _type: 'input',
  value: '',
  onchange (e) {
    this.value = e.target.value
  }
})

const add = createComponent({
  _type: 'button',
  onclick () {
    console.log(input.value)
    ul.state.values.push(input.value)
    input.value = ''
  },
  children: [{ _type: 'text', content: 'ADD' }]
})

const ul = createComponent({
  _type: 'ul',
  state: {
    values: []
  },
  __children () {
    return this.state.values.map(v => ({
      _type: 'li',
      children: [{ _type: 'text', content: v }]
    }))
  }
})

const root = createComponent({
  _type: 'div',
  children: [
    input,
    add,
    ul
  ]
})

const container = document.querySelector('#root')
renderApp(container, [root])
