const input = createComponent({
  _type: 'input',
  value: '',
  onchange (e) {
    this.value = e.target.value
  }
})

const ul = createComponent({
  _type: 'ul',
  state: {
    values: []
  },
  __children () {
    return this.state.values.map((v, i) => ({
      _type: 'li',
      children: [
        { _type: 'text', content: v },
        {
          _type: 'button',
          onclick: () => ul.state.values.splice(i, 1),
          children: [{ _type: 'text', content: 'x' }]
        }
      ]
    }))
  }
})

const add = createComponent({
  _type: 'button',
  onclick () {
    ul.state.values.push(input.value)
    input.value = ''
  },
  children: [{ _type: 'text', content: 'ADD' }]
})

const container = document.querySelector('#root')
renderApp(container, [input, add, ul])
