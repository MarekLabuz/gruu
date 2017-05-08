const input = createComponent({
  _type: 'input',
  value: '',
  onkeydown (e) {
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

const div = createComponent({
  _type: 'div',
  children: [{
    _type: 'div',
    children: [{
      _id: 'inputText',
      _type: 'text',
      __content: () => `Input: ${input.value}`
    }]
  }]
}, input)

const table = createComponent({
  _type: 'table',
  state: {
    data: [[]]
  },
  __children () {
    return this.state.data.map((row, i) => ({
      _type: 'tr',
      onclick () {
        this.style = { backgroundColor: 'red' }
      },
      children: row.map((col, j) => ({
        _type: 'td',
        children: [createComponent({ _id: `${i}-${j}`, _type: 'text', __content: () => input.value || col }, input)]
      }))
    }))
  }
})

setTimeout(() => {
  const start = +new Date()
  console.log(start)
  const array = []
  for (let i = 0; i < 1000; i++) {
    array.push([`test ${i}`, `test ${i}`, `test ${i}`, `test ${i}`, `test ${i}`, `test ${i}`, `test ${i}`])
  }
  table.state.data = array

  setTimeout(() => {
    console.log('sdfsdf', +new Date() - start)
    // console.log('teraz')
    // const start = +new Date()
    // table.state.data = []
    // for(let i = 0; i < 1000; i += 10) {
    //   table.state.data[i] = ['sfsdfsdf', 'sfsdfsdf', 'sfsdfsdf', 'sfsdfsdf', 'sfsdfsdf', 'sfsdfsdf', 'sfsdfsdf']
    // }
    // console.log(+new Date() - start)
  })
  // setTimeout(() => {
  //   const start2 = +new Date()
  //   console.log(start)
  //   const row = table.state.data[0]
  //   table.state.data[0] = table.state.data[10]
  //   table.state.data[10] = row
  //   console.log(+new Date() - start2)
  // }, 2000)

})


const container = document.querySelector('#root')
renderApp(container, [input, add, div, ul, table])
