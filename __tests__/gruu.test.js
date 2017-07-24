const { createComponent, renderApp } = require('../src/gruu') // eslint-disable-line

const timer = async (time) => {
  await new Promise(resolve => setTimeout(resolve, time))
}

describe('simple component opperations', () => {
  let main
  let divComponent

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    main = createComponent({
      _type: 'div',
      className: 'main-class',
      children: [{ _type: 'text', textContent: 'test' }]
    })

    divComponent = createComponent({
      _type: 'div',
      className: 'div-class',
      style: {
        height: '100px',
        width: '100px'
      },
      textContent: 'test #2'
    })

    const container = document.querySelector('#root')
    renderApp(container, [main, divComponent])
  })

  const html = (className, text) =>
    `<div id="root"><div class="${className}">${text}</div><div class="div-class" ` +
      'style="height: 100px; width: 100px;">test #2</div></div>'

  test('renders correctly', () => {
    expect(document.body.innerHTML).toEqual(html('main-class', 'test'))
  })

  test('text changes explicilty', () => {
    expect(main.children[0].textContent).toEqual('test')
    main.children[0].textContent = 'changed text'
    expect(main.children[0].textContent).toEqual('changed text')
    expect(document.body.innerHTML).toEqual(html('main-class', 'changed text'))
  })

  test('class changes explicitly', () => {
    expect(main.className).toEqual('main-class')
    main.className = 'class-changed'
    expect(main.className).toEqual('class-changed')
    expect(document.body.innerHTML).toEqual(html('class-changed', 'test'))
  })

  test('style changes explicitly', () => {
    const div = Array.from(document.getElementsByClassName('div-class'))[0]
    expect(div.style.height).toBe('100px')
    divComponent.style.height = '200px'
    expect(div.style.height).toBe('200px')
    divComponent.style = { height: '300px', width: '150px' }
    expect(div.style.height).toBe('300px')
    expect(div.style.width).toBe('150px')
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
        table.children = table.children.map((v, i) => Object.assign({}, v, i % 2 !== 0 ? {} : {
          children: v.children.map(td => Object.assign({}, td, {
            children: [{
              _type: 'text',
              textContent: td.children[0].textContent + 100
            }]
          }))
        }))
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
    expect(document.body.innerHTML).toBe('<div id="root"><ul><li>2</li><li>3</li><li>4</li></ul></div>')
  })

  test('adds new element (pure) with push', () => {
    ul.children.push({ _type: 'li', children: [{ _type: 'text', textContent: 5 }] })
    expect(document.body.innerHTML).toBe('<div id="root"><ul><li>2</li><li>3</li><li>4</li><li>5</li></ul></div>')
  })

  test('adds new element (component) with push', () => {
    ul.children.push(createComponent({ _type: 'li', children: [{ _type: 'text', textContent: 5 }] }))
    expect(document.body.innerHTML).toBe('<div id="root"><ul><li>2</li><li>3</li><li>4</li><li>5</li></ul></div>')
  })

  test('adds new element (pure) with assign', () => {
    ul.children = [...ul.children, { _type: 'li', children: [{ _type: 'text', textContent: 5 }] }]
    expect(document.body.innerHTML).toBe('<div id="root"><ul><li>2</li><li>3</li><li>4</li><li>5</li></ul></div>')
  })

  test('adds new element (component) with assign', () => {
    ul.children = [...ul.children, createComponent({ _type: 'li', children: [{ _type: 'text', textContent: 5 }] })]
    expect(document.body.innerHTML).toBe('<div id="root"><ul><li>2</li><li>3</li><li>4</li><li>5</li></ul></div>')
  })

  test('removes element with assign', () => {
    ul.children[2] = null
    expect(document.body.innerHTML).toBe('<div id="root"><ul><li>2</li><li>3</li></ul></div>')
  })
})

describe('phantom components', () => {
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
    expect(document.body.innerHTML).toBe('<div id="root"><div>test</div></div>')
  })

  test('content changes explicitly', () => {
    main.children[0].children[0].children[0].children[0].textContent = 'test is done'
    expect(document.body.innerHTML).toBe('<div id="root"><div>test is done</div></div>')
  })
})

describe('dom components => phantom components', () => {
  let ul

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    ul = createComponent({
      _type: 'ul',
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
      .toBe('<div id="root"><ul><li>9</li><li>8</li><li>7</li><li>6</li></ul></div>')
  })

  test('content changes explicitly (more elements)', () => {
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
      .toBe('<div id="root"><ul><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li></ul></div>')
  })

  test('content changes explicitly (less elements)', () => {
    ul.children = [
      {
        children: [
          { _type: 'li', children: [{ _type: 'text', textContent: 1 }] },
          { _type: 'li', children: [{ _type: 'text', textContent: 2 }] },
        ]
      }
    ]
    expect(document.body.innerHTML)
      .toBe('<div id="root"><ul><li>1</li><li>2</li></ul></div>')
  })
})

describe('phantom components => dom components', () => {
  let ul

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    ul = createComponent({
      _type: 'ul',
      children: [
        {
          children: [
            { _type: 'li', children: [{ _type: 'text', textContent: 9 }] },
            { _type: 'li', children: [{ _type: 'text', textContent: 8 }] },
            { _type: 'li', children: [{ _type: 'text', textContent: 7 }] }
          ]
        }
      ]
    })

    const container = document.querySelector('#root')
    renderApp(container, [ul])
  })

  test('renders correctly', () => {
    expect(document.body.innerHTML)
      .toBe('<div id="root"><ul><li>9</li><li>8</li><li>7</li></ul></div>')
  })

  test('content changes explicilty (more elements)', () => {
    ul.children = [
      { _type: 'li', children: [{ _type: 'text', textContent: 1 }] },
      { _type: 'li', children: [{ _type: 'text', textContent: 2 }] },
      { _type: 'li', children: [{ _type: 'text', textContent: 3 }] },
      { _type: 'li', children: [{ _type: 'text', textContent: 4 }] }
    ]
    expect(document.body.innerHTML)
      .toBe('<div id="root"><ul><li>1</li><li>2</li><li>3</li><li>4</li></ul></div>')
  })

  test('content changes explicilty (less elements)', () => {
    ul.children = [
      { _type: 'li', children: [{ _type: 'text', textContent: 1 }] },
      { _type: 'li', children: [{ _type: 'text', textContent: 2 }] }
    ]
    expect(document.body.innerHTML)
      .toBe('<div id="root"><ul><li>1</li><li>2</li></ul></div>')
  })
})

describe('mixed phantom and dom components', () => {
  let ul

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    ul = createComponent({
      _type: 'ul',
      children: [
        { _type: 'li', children: [{ _type: 'text', textContent: 1 }] },
        {
          children: [
            { _type: 'li', children: [{ _type: 'text', textContent: 2 }] },
            { _type: 'li', children: [{ _type: 'text', textContent: 3 }] }
          ]
        },
        { _type: 'li', children: [{ _type: 'text', textContent: 4 }] }
      ]
    })

    const container = document.querySelector('#root')
    renderApp(container, [ul])
  })

  test('renders correctly', () => {
    expect(document.body.innerHTML)
      .toBe('<div id="root"><ul><li>1</li><li>2</li><li>3</li><li>4</li></ul></div>')
  })

  test('content changes explicitly', () => {
    ul.children = [
      {
        children: [
          { _type: 'li', children: [{ _type: 'text', textContent: 9 }] },
          { _type: 'li', children: [{ _type: 'text', textContent: 8 }] }
        ]
      },
      { _type: 'li', children: [{ _type: 'text', textContent: 7 }] },
      { _type: 'li', children: [{ _type: 'text', textContent: 6 }] }
    ]

    expect(document.body.innerHTML)
      .toBe('<div id="root"><ul><li>9</li><li>8</li><li>7</li><li>6</li></ul></div>')
  })
})

describe('components with different _types', () => {
  let main

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    main = createComponent({
      _type: 'div',
      children: [
        { _type: 'div', textContent: 4 },
        {
          children: [
            { _type: 'span', children: [{ _type: 'text', textContent: 2 }] },
            { _type: 'div', textContent: 3 }
          ]
        },
        { _type: 'span', children: [{ _type: 'text', textContent: 4 }] }
      ]
    })

    const container = document.querySelector('#root')
    renderApp(container, [main])
  })

  test('renders correctly', () => {
    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><div>4</div><span>2</span><div>3</div><span>4</span></div></div>')
  })

  test('content changes explicitly', () => {
    main.children = [
      {
        children: [
          { _type: 'span', children: [{ _type: 'text', textContent: 9 }] },
          { _type: 'div', textContent: 8 }
        ]
      },
      { _type: 'span', children: [{ _type: 'text', textContent: 7 }] },
      { _type: 'div', textContent: 6 }
    ]

    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><span>9</span><div>8</div><span>7</span><div>6</div></div></div>')
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
      children: [{ _type: 'text', textContent: 'click me' }],
      onclick () {
        this.state.toggle = !this.state.toggle
      }
    })

    main = createComponent({
      _type: 'div',
      className: 'main-class',
      $children: () => [{ _type: 'text', textContent: button.state.toggle ? 'ON' : 'OFF' }]
    })

    const container = document.querySelector('#root')
    renderApp(container, [main, button])
  })

  test('components renders correctly', () => {
    expect(document.body.innerHTML)
      .toEqual('<div id="root"><div class="main-class">OFF</div><button>click me</button></div>')
  })

  test('text changes on click', async (done) => {
    const html = t => `<div id="root"><div class="main-class">${t}</div><button>click me</button></div>`
    document.querySelector('button').click()
    await timer(25)
    expect(document.body.innerHTML).toEqual(html('ON'))
    document.querySelector('button').click()
    await timer(25)
    expect(document.body.innerHTML).toEqual(html('OFF'))
    done()
  }, 75)
})

describe('phantom components + subscriptions', () => {
  let main

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    const button = createComponent({
      _type: 'button',
      id: 'button',
      state: {
        counter: 0
      },
      $children () {
        return [{ _type: 'text', textContent: this.state.counter }]
      },
      onclick () {
        this.state.counter += 1
      }
    })

    main = createComponent({
      $children () {
        return [{
          children: [{ _type: 'text', textContent: button.state.counter }]
        }]
      }
    })

    const container = document.querySelector('#root')
    renderApp(container, [main, button])
  })

  test('renders correctly', () => {
    expect(document.body.innerHTML).toBe('<div id="root">0<button id="button">0</button></div>')
  })

  test('content changes implicitly', async (done) => {
    document.querySelector('#button').click()
    await timer(25)
    expect(document.body.innerHTML).toBe('<div id="root">1<button id="button">1</button></div>')
    done()
  }, 50)
})
