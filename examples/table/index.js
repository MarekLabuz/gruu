const input = createComponent({
  _type: 'input',
  onkeyup (e) {
    this.value = e.target.value
  }
})

const ul = createComponent({
  _type: 'ul',
  state: {
    values: []
  },
  $children () {
    return this.state.values.map((v, i) => ({
      _type: 'li',
      children: [
        { _type: 'input', value: v },
        {
          _type: 'button',
          onclick: () => ul.state.values.splice(i, 1),
          children: [{ _type: 'text', textContent: 'x' }]
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
  children: [{ _type: 'text', textContent: 'ADD' }]
})

const div = createComponent({
  _type: 'div',
  children: [{
    _type: 'div',
    children: [{
      _id: 'inputText',
      _type: 'text',
      $textContent: () => `Input: ${input.value || ''}`
    }]
  }]
})

const table = createComponent({
  _type: 'table',
  state: {
    data: [[]]
  },
  $children () {
    return this.state.data.map((row, i) => ({
      _type: 'tr',
      onclick () {
        this.style = this.style && this.style.backgroundColor === 'red' ? {} : { backgroundColor: 'red' }
      },
      children: (row || []).map((col, j) => ({
        _type: 'td',
        children: [
          createComponent({ _id: `${i}-${j}`, _type: 'text', $textContent: () => input.value || col })
        ]
      }))
    }))
  }
})

setTimeout(() => {
  for (let i = 0; i < 1000; i += 1) {
    table.state.data[i] = [`test ${i}`, `test ${i}`, `test ${i}`, `test ${i}`, `test ${i}`, `test ${i}`, `test ${i}`]
  }

  // setTimeout(() => {
  //   table.state.data = []
  // }, 1500)
  //
  // setTimeout(() => {
  //   for (let i = 0; i < 1000; i += 10) {
  //     table.state.data[i] = ['sfsdfsdf', 'sfsdfsdf', 'sfsdfsdf', 'sfsdfsdf', 'sfsdfsdf', 'sfsdfsdf', 'sfsdfsdf']
  //   }
  // }, 3000)
  //
  // setTimeout(() => {
  //   table.state.data[27] = ['aaaaaaa', 'aaaaaaa', 'aaaaaaa', 'aaaaaaa', 'aaaaaaa', 'aaaaaaa', 'aaaaaaa']
  // }, 4500)
}, 1000)

const container = document.querySelector('#root')
renderApp(container, [input, add, div, ul, table])
