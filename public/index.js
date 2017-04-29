const container = document.querySelector('#root')
const root = createApp(container, [ // eslint-disable-line no-unused-vars
  {
    _type: 'div',
    style: { display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100vh' },
    state: {
      counter: 3,
      test: { counter: 3 },
      headerClassName: 'green',
      array: [1, 2, 3, 4, 5],
      data: [{ name: 'sdfsdfsd', surname: 'dfsdf', age: 29 }]
    },
    children: []
  }
])

const header = {
  _type: 'div',
  _updateWith: { className: 'root[0].state.headerClassName' },
  className: className => `center ${className}`,
  children: [
    { _type: 'div', innerHTML: 'dsfsdf' }
  ]
}

const question = {
  _type: 'div',
  className: 'center',
  children: [
    {
      _type: 'div',
      className: 'question-container',
      children: [
        { _type: 'text', content: 'Pytanie' },
        ...([1, 2, 3, 4].map(questionId => ({
          _type: 'label',
          style: { display: 'flex', alignItems: 'center' },
          children: [
            {
              _type: 'input',
              type: 'radio',
              name: 'answer',
              onchange () {
                // root[0].state.test = { counter: root[0].state.test.counter + 1 }
                // this.parent.parent.parent.node.className = 'left'
                // root[0].children[1].className = 'left'
                // root[0].state.test.counter += 1
                root[0].state.counter += 1
                // root[0].state.headerClassName = root[0].state.headerClassName === 'green' ? 'red' : 'green'
                // root[0].state.array = [...root[0].state.array, 5]
                // root[0].state.array.push(5)
              }
            },
            {
              _type: 'span',
              style: { paddingLeft: '10px' },
              children: [{
                _type: 'text',
                _updateWith: { content: 'root[0].children[1].className' },
                content: className => `Odpowiedź ${questionId} ${className}`
              }]
            }
          ]
        })))
      ]
    }
  ]
}

const buttons = {
  _type: 'div',
  style: { display: 'flex', justifyContent: 'space-around' },
  children: [
    {
      _type: 'button',
      children: [{ _type: 'text', content: '<' }]
    },
    {
      _type: 'button',
      children: [{ _type: 'text', content: '>' }]
    }
  ]
}

const ul = {
  _type: 'ul',
  _updateWith: { children: 'root[0].state.counter' },
  children: counter => Array(counter).fill(1).map(() => ({
    _type: 'li',
    children: [
      {
        _type: 'text',
        _updateWith: { content: 'root[0].state.counter' },
        content: v => v
      }
    ]
  }))
}

const table = {
  _type: 'table',
  children: [
    {
      _type: 'thead',
      children: [
        {
          _type: 'tr',
          children: Array(5).fill(1).map(() => ({
            _type: 'th',
            children: [
              { _type: 'text', content: 'text' }
            ]
          }))
        }
      ]
    },
    {
      _type: 'tbody',
      children: Array(5).fill(1).map(() => ({
        _type: 'tr',
        children: Array(5).fill(1).map(() => ({
          _type: 'td',
          children: [
            {
              _type: 'text',
              content: 'text'
            }
          ]
        }))
      }))
    }
  ]
}

// root[0].children.push(header, question, buttons, ul, table)
root[0].children.push(header, table)

console.log(root)

