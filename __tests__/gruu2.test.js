const { createComponent, renderApp } = require('../src/gruu') // eslint-disable-line

describe('simple component opperations', () => {
  let main

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    main = createComponent({
      _type: 'div',
      className: 'main-class',
      children: [{ _type: 'text', textContent: 'test' }]
    })

    const container = document.querySelector('#root')
    renderApp(container, [main])
  })

  const html = (className, text) => `<div id="root"><div><div class="${className}">${text}</div></div></div>`

  test('renders correctly', () => {
    expect(document.body.innerHTML).toEqual(html('main-class', 'test'))
  })

  test('text changes explicilty', () => {
    expect(main.children[0].textContent).toEqual('test')
    main.children[0].textContent = 'changed text'
    expect(main.children[0].textContent).toEqual('changed text')
    expect(document.body.innerHTML).toEqual(html('main-class', 'changed text'))
  })

  test('class changes explicilty', () => {
    expect(main.className).toEqual('main-class')
    main.className = 'class-changed'
    expect(main.className).toEqual('class-changed')
    expect(document.body.innerHTML).toEqual(html('class-changed', 'test'))
  })
})

describe('table', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    const tr = num => createComponent({
      _type: 'tr',
      children: [
        { _type: 'td', children: [{ _type: 'text', textContent: num }] },
        { _type: 'td', children: [{ _type: 'text', textContent: num }] },
        { _type: 'td', children: [{ _type: 'text', textContent: num }] },
        { _type: 'td', children: [{ _type: 'text', textContent: num }] },
        { _type: 'td', children: [{ _type: 'text', textContent: num }] }
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
                textContent: td.children[0].textContent + 100
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
        { _type: 'li', children: [{ _type: 'text', textContent: 2 }] },
        { _type: 'li', children: [{ _type: 'text', textContent: 3 }] },
        { _type: 'li', children: [{ _type: 'text', textContent: 4 }] }
      ]
    })

    const container = document.querySelector('#root')
    renderApp(container, [ul])
  })

  test('renderes correclty', () => {
    expect(document.body.innerHTML).toBe('<div id="root"><div><ul><li>2</li><li>3</li><li>4</li></ul></div></div>')
  })

  test('adds new element (pure) with push', () => {
    ul.children.push({ _type: 'li', children: [{ _type: 'text', textContent: 5 }] })
    expect(document.body.innerHTML).toBe('<div id="root"><div><ul>' +
      '<li>2</li><li>3</li><li>4</li><li>5</li></ul></div></div>')
  })

  test('adds new element (component) with push', () => {
    ul.children.push(createComponent({ _type: 'li', children: [{ _type: 'text', textContent: 5 }] }))
    expect(document.body.innerHTML).toBe('<div id="root"><div><ul>' +
      '<li>2</li><li>3</li><li>4</li><li>5</li></ul></div></div>')
  })

  test('adds new element (pure) with assign', () => {
    ul.children = [...ul.children, { _type: 'li', children: [{ _type: 'text', textContent: 5 }] }]
    expect(document.body.innerHTML).toBe('<div id="root"><div><ul>' +
      '<li>2</li><li>3</li><li>4</li><li>5</li></ul></div></div>')
  })

  test('adds new element (component) with assign', () => {
    ul.children = [...ul.children, createComponent({ _type: 'li', children: [{ _type: 'text', textContent: 5 }] })]
    expect(document.body.innerHTML).toBe('<div id="root"><div><ul>' +
      '<li>2</li><li>3</li><li>4</li><li>5</li></ul></div></div>')
  })

  test('removes element with assign', () => {
    ul.children[2] = null
    expect(document.body.innerHTML).toBe('<div id="root"><div><ul><li>2</li><li>3</li></ul></div></div>')
  })
})

describe('phantom components #1', () => {
  let main

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    const div = createComponent({
      _type: 'div',
      children: [{
        children: [{
          children: [{ _type: 'text', textContent: 'test' }]
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
    main.children[0].children[0].children[0].children[0].textContent = 'test is done'
    expect(document.body.innerHTML).toBe('<div id="root"><div><div>test is done</div></div></div>')
  })
})

describe('phantom components #2', () => {
  let ul

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    ul = createComponent({
      _type: 'ul',
      state: {
        counter: 0
      },
      children: [
        { _type: 'li', children: [{ _type: 'text', textContent: 9 }] },
        { _type: 'li', children: [{ _type: 'text', textContent: 8 }] },
        { _type: 'li', children: [{ _type: 'text', textContent: 7 }] },
        { _type: 'li', children: [{ _type: 'text', textContent: 6 }] }
      ]
    })

    const container = document.querySelector('#root')
    renderApp(container, [ul])
  })

  test('renders correctly', () => {
    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><ul><li>9</li><li>8</li><li>7</li><li>6</li></ul></div></div>')
  })

  test('content changes explicitly', () => {
    ul.children = [
      {
        children: [
          { _type: 'li', children: [{ _type: 'text', textContent: 1 }] },
          { _type: 'li', children: [{ _type: 'text', textContent: 2 }] },
          { _type: 'li', children: [{ _type: 'text', textContent: 3 }] },
          { _type: 'li', children: [{ _type: 'text', textContent: 4 }] },
          { _type: 'li', children: [{ _type: 'text', textContent: 5 }] }
        ]
      }
    ]
    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><ul><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li></ul></div></div>')
  })
})
