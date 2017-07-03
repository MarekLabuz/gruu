window.__TEST__ = true

const { createComponent, renderApp } = require('../src/gruu')

describe('simple component opperations', () => {
  let main = null

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    main = createComponent({
      _type: 'div',
      className: 'main-class',
      children: [{ _type: 'text', content: 'test' }]
    })

    const container = document.querySelector('#root')
    renderApp(container, [main])
  })

  const html = (className, text) => `<div id="root"><div><div class="${className}">${text}</div></div></div>`

  test('renders simple component', () => {
    expect(document.body.innerHTML).toEqual(html('main-class', 'test'))
  })

  test('text changes explicilty', () => {
    expect(main.children[0].content).toEqual('test')
    main.children[0].content = 'changed text'
    expect(main.children[0].content).toEqual('changed text')
    expect(document.body.innerHTML).toEqual(html('main-class', 'changed text'))
  })

  test('class changes explicilty', () => {
    expect(main.className).toEqual('main-class')
    main.className = 'class-changed'
    expect(main.className).toEqual('class-changed')
    expect(document.body.innerHTML).toEqual(html('class-changed', 'test'))
  })
})

describe('subscription', () => {
  let main = null
  let button = null

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    button = createComponent({
      state: {
        toggle: false
      },
      _type: 'button',
      children: [{ _type: 'text', content: 'click me' }],
      onclick () {
        this.state.toggle = !this.state.toggle
      }
    })

    main = createComponent({
      _type: 'div',
      _id: 'main',
      className: 'main-class',
      __children: () => [{ _type: 'text', content: button.state.toggle ? 'ON' : 'OFF' }]
    }, button)

    const container = document.querySelector('#root')
    renderApp(container, [main, button])
  })

  test('components renders correctly', () => {
    expect(document.body.innerHTML)
      .toEqual('<div id="root"><div><div class="main-class">OFF</div><button>click me</button></div></div>')
  })

  test('text changes on click', (done) => {
    const html = t => `<div id="root"><div><div class="main-class">${t}</div><button>click me</button></div></div>`
    document.querySelector('button').click()
    setTimeout(() => {
      expect(document.body.innerHTML).toEqual(html('ON'))
      document.querySelector('button').click()
      setTimeout(() => {
        expect(document.body.innerHTML).toEqual(html('OFF'))
        done()
      }, 50)
    }, 50)
  })
})

