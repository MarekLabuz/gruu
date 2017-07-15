window.__TEST__ = true // eslint-disable-line

const { createComponent, renderApp } = require('../src/gruu')

describe('simple component opperations', () => {
  let main

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
  let main
  let button

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

describe('table', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    const tr = num => createComponent({
      _type: 'tr',
      children: [
        { _type: 'td', children: [{ _type: 'text', content: num }] },
        { _type: 'td', children: [{ _type: 'text', content: num }] },
        { _type: 'td', children: [{ _type: 'text', content: num }] },
        { _type: 'td', children: [{ _type: 'text', content: num }] },
        { _type: 'td', children: [{ _type: 'text', content: num }] }
      ]
    })

    const trs = Array(50).fill(1).map((v, i) => tr(i))

    const table = createComponent({
      _type: 'table',
      children: trs
    })

    const button = createComponent({
      _type: 'button',
      id: 'update',
      onclick () {
        table.children.forEach((v, i) => {
          if (i % 2 === 0) {
            v.children = v.children.map(td => Object.assign({}, td, {
              children: [{
                _type: 'text',
                content: td.children[0].content + 100
              }]
            }))
          }
        })
      }
    })

    const container = document.querySelector('#root')
    renderApp(container, [table, button])
  })

  test('renders correctly', () => {
    const trs = Array.from(document.getElementsByTagName('tr'))
    expect(trs.length).toBe(50)
    trs.forEach((tr, i) => {
      const tds = Array.from(tr.children)
      expect(tds.length).toBe(5)
      tds.forEach((td) => {
        expect(parseInt(td.innerHTML, 10)).toBe(i)
      })
    })
  })

  test('updates every second tr tag', () => {
    document.querySelector('#update').onclick()
    const trs = Array.from(document.getElementsByTagName('tr'))
    trs.forEach((tr, i) => {
      const tds = Array.from(tr.children)
      expect(tds.length).toBe(5)
      tds.forEach((td) => {
        expect(parseInt(td.innerHTML, 10)).toBe(i % 2 === 0 ? i + 100 : i)
      })
    })
  })
})

describe('adding and removing components dynamically', () => {
  let ul

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    ul = createComponent({
      _type: 'ul',
      children: [
        { _type: 'li', children: [{ _type: 'text', content: 2 }] },
        { _type: 'li', children: [{ _type: 'text', content: 3 }] },
        { _type: 'li', children: [{ _type: 'text', content: 4 }] }
      ]
    })

    const container = document.querySelector('#root')
    renderApp(container, [ul])
  })

  test('renderes correclty', () => {
    expect(document.body.innerHTML).toBe('<div id="root"><div><ul><li>2</li><li>3</li><li>4</li></ul></div></div>')
  })

  test('adds new element (pure) with push', () => {
    ul.children.push({ _type: 'li', children: [{ _type: 'text', content: 5 }] })
    expect(document.body.innerHTML).toBe('<div id="root"><div><ul>' +
      '<li>2</li><li>3</li><li>4</li><li>5</li></ul></div></div>')
  })

  test('adds new element (component) with push', () => {
    ul.children.push(createComponent({ _type: 'li', children: [{ _type: 'text', content: 5 }] }))
    expect(document.body.innerHTML).toBe('<div id="root"><div><ul>' +
      '<li>2</li><li>3</li><li>4</li><li>5</li></ul></div></div>')
  })

  test('adds new element (pure) with assign', () => {
    ul.children = [...ul.children, { _type: 'li', children: [{ _type: 'text', content: 5 }] }]
    expect(document.body.innerHTML).toBe('<div id="root"><div><ul>' +
      '<li>2</li><li>3</li><li>4</li><li>5</li></ul></div></div>')
  })

  test('adds new element (component) with assign', () => {
    ul.children = [...ul.children, createComponent({ _type: 'li', children: [{ _type: 'text', content: 5 }] })]
    expect(document.body.innerHTML).toBe('<div id="root"><div><ul>' +
      '<li>2</li><li>3</li><li>4</li><li>5</li></ul></div></div>')
  })

  test('removes element with assign', () => {
    ul.children[2] = null
    expect(document.body.innerHTML).toBe('<div id="root"><div><ul><li>2</li><li>3</li></ul></div></div>')
  })
})
