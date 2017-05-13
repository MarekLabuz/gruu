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
  __children () {
    return this.state.values.map((v, i) => ({
      _type: 'li',
      children: [
        { _type: 'input', value: v },
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

const div = createComponent({
  _type: 'div',
  children: [{
    _type: 'div',
    children: [{
      _id: 'inputText',
      _type: 'text',
      __content: () => `Input: ${input.value || ''}`
    }]
  }]
}, input)

const table = createComponent({
  _type: 'table',
  state: {
    data: [[]]
  },
  __children () {
    // console.log(this.state.data.map((v, i) => (v || []).map(t => t)))
    return this.state.data.map((row, i) => ({
      _type: 'tr',
      onclick () {
        this.style = { backgroundColor: 'red' }
      },
      children: (row || []).map((col, j) => ({
        _type: 'td',
        children: [
          createComponent({ _id: `${i}-${j}`, _type: 'text', __content: () => input.value || col }, input)
        ]
      }))
    }))
  }
})

setTimeout(() => {
  const start = +new Date()
  console.log(start)
  // const array = []
  for (let i = 0; i < 1000; i += 1) {
    table.state.data[i] = [`test ${i}`, `test ${i}`, `test ${i}`, `test ${i}`, `test ${i}`, `test ${i}`, `test ${i}`]
  }
  // table.state.data = array

  setTimeout(() => {
    table.state.data = []
  }, 1500)

  setTimeout(() => {
    console.log('teraz')
    const start2 = +new Date()
    for (let i = 0; i < 1000; i += 10) {
      table.state.data[i] = ['sfsdfsdf', 'sfsdfsdf', 'sfsdfsdf', 'sfsdfsdf', 'sfsdfsdf', 'sfsdfsdf', 'sfsdfsdf']
    }
    console.log(+new Date() - start2)
  }, 3000)

  setTimeout(() => {
    table.state.data[27] = ['aaaaaaa', 'aaaaaaa', 'aaaaaaa', 'aaaaaaa', 'aaaaaaa', 'aaaaaaa', 'aaaaaaa']
  }, 4500)
})


const container = document.querySelector('#root')
renderApp(container, [input, add, div, ul, table])
