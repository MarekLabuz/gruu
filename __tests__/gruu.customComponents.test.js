const { createComponent, renderApp } = require('../src/gruu') // eslint-disable-line

describe('explicit operations', () => {
  let main

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    const div = createComponent({
      _type: 'div',
      children: [{
        children: [{
          children: [{ _type: 'text', content: 'test' }]
        }]
      }]
    })

    main = createComponent({
      children: [div]
    })

    const container = document.querySelector('#root')
    renderApp(container, [main])
  })

  test('renders correctly', () => {
    expect(document.body.innerHTML).toBe('<div id="root"><div><div>test</div></div></div>')
  })

  test('content changes explicitly', () => {
    main.children[0].children[0].children[0].children[0].content = 'test is done'
    expect(document.body.innerHTML).toBe('<div id="root"><div><div>test is done</div></div></div>')
  })
})

describe('implicity operations', () => {
  let main

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    const button = createComponent({
      _type: 'button',
      id: 'button',
      state: {
        counter: 0
      },
      __children () {
        return [{ _type: 'text', content: this.state.counter }]
      },
      onclick () {
        button.state.counter += 1
      }
    })

    main = createComponent({
      __children () {
        return [{
          children: [{ _type: 'text', content: button.state.counter }]
        }]
      }
    }, button)

    const container = document.querySelector('#root')
    renderApp(container, [main, button])
  })

  test('renders correctly', () => {
    expect(document.body.innerHTML).toBe('<div id="root"><div><div>0</div><button id="button">0</button></div></div>')
  })

  test('content changes implicitly', (done) => {
    document.querySelector('#button').click()
    setTimeout(() => {
      expect(document.body.innerHTML).toBe('<div id="root"><div><div>0</div><button id="button">1</button></div></div>')
      done()
    }, 50)
  }, 100)
})
