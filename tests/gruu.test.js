const { createComponent, renderApp } = require('../src/index')

const timer = () => new Promise(resolve => setTimeout(resolve))

describe('new component while assigning', () => {
  let main

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    main = createComponent({
      _type: 'div',
      children: [{
        _type: 'div',
        textContent: 'red?',
        style: {
          backgroundColor: 'red'
        }
      }]
    })

    const container = document.querySelector('#root')
    renderApp(container, [main])
  })

  test('renders correctly', () => {
    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><div style="background-color: red;">red?</div></div></div>')
  })

  test('overwrites all properties', () => {
    main.children[0] = { _type: 'div', textContent: 'not red!' }
    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><div>not red!</div></div></div>')
  })
})

describe('text as a component', () => {
  let main

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    main = createComponent({
      children: [createComponent('test')]
    })

    const container = document.querySelector('#root')
    renderApp(container, [main])
  })

  test('renders correctly', () => {
    expect(document.body.innerHTML).toBe('<div id="root">test</div>')
  })

  test('changes correctly', () => {
    main.children[0].textContent = 'test #2'
    expect(document.body.innerHTML).toBe('<div id="root">test #2</div>')

    main.children[0] = 'test #3'
    expect(document.body.innerHTML).toBe('<div id="root">test #3</div>')

    main.children[0] = ''
    expect(document.body.innerHTML).toBe('<div id="root"></div>')

    main.children[0].textContent = 'test #4'
    expect(document.body.innerHTML).toBe('<div id="root">test #4</div>')
  })
})

describe('number as a component', () => {
  let main

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    main = createComponent({
      children: [createComponent(5235)]
    })

    const container = document.querySelector('#root')
    renderApp(container, [main])
  })

  test('renders correctly', () => {
    expect(document.body.innerHTML).toBe('<div id="root">5235</div>')
  })

  test('changes correctly', () => {
    main.children[0].textContent = 3412412
    expect(document.body.innerHTML).toBe('<div id="root">3412412</div>')

    main.children[0] = 6557
    expect(document.body.innerHTML).toBe('<div id="root">6557</div>')

    main.children[0] = 0
    expect(document.body.innerHTML).toBe('<div id="root">0</div>')

    main.children[0].textContent = 23123
    expect(document.body.innerHTML).toBe('<div id="root">23123</div>')
  })
})

describe('mixing numbers and texts as components', () => {
  let main

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    main = createComponent({
      children: [createComponent(5235), createComponent('test')]
    })

    const container = document.querySelector('#root')
    renderApp(container, [main])
  })

  test('renders correctly', () => {
    expect(document.body.innerHTML).toBe('<div id="root">5235test</div>')
  })

  test('changes correctly', () => {
    main.children[0].textContent = 'test #2'
    expect(document.body.innerHTML).toBe('<div id="root">test #2test</div>')

    main.children = [0, 0]
    expect(document.body.innerHTML).toBe('<div id="root">00</div>')

    main.children = ['test #3', 234]
    expect(document.body.innerHTML).toBe('<div id="root">test #3234</div>')

    main.children = [1234, '']
    expect(document.body.innerHTML).toBe('<div id="root">1234</div>')

    main.children = ['', 0]
    expect(document.body.innerHTML).toBe('<div id="root">0</div>')

    main.children = [0, 24234]
    expect(document.body.innerHTML).toBe('<div id="root">024234</div>')

    main.children = ['13123', '', 4235]
    expect(document.body.innerHTML).toBe('<div id="root">131234235</div>')

    main.children = [23523]
    expect(document.body.innerHTML).toBe('<div id="root">23523</div>')

    main.children = ['', 999, 'test']
    expect(document.body.innerHTML).toBe('<div id="root">999test</div>')
  })
})

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
      textContent: 'tests #2'
    })

    const container = document.querySelector('#root')
    renderApp(container, [main, divComponent])
  })

  const html = (className, text, style = ' style="height: 100px; width: 100px;"') =>
    `<div id="root"><div class="${className}">${text}</div><div class="div-class"${style}>tests #2</div></div>`

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

    divComponent.style = {}
    expect(document.body.innerHTML).toBe(html('main-class', 'test', ' style=""'))

    divComponent.style = { backgroundColor: 'red' }
    expect(document.body.innerHTML).toBe(html('main-class', 'test', ' style="background-color: red;"'))


    divComponent.style = { backgroundColor: 'blue' }
    expect(document.body.innerHTML).toBe(html('main-class', 'test', ' style="background-color: blue;"'))

    divComponent.style = { backgroundColor: 'blue', position: 'absolute' }
    expect(document.body.innerHTML)
      .toBe(html('main-class', 'test', ' style="background-color: blue; position: absolute;"'))

    divComponent.style = undefined
    expect(document.body.innerHTML)
      .toBe(html('main-class', 'test', ''))
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
    main.children[0].children[0].children[0].children[0].textContent = 'tests is done'
    expect(document.body.innerHTML).toBe('<div id="root"><div>tests is done</div></div>')
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
    await timer()
    expect(document.body.innerHTML).toEqual(html('ON'))
    document.querySelector('button').click()
    await timer()
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
    await timer()
    expect(document.body.innerHTML).toBe('<div id="root">1<button id="button">1</button></div>')
    done()
  }, 50)
})

describe('dynamic subcription change (property change)', () => {
  let store
  let render

  beforeEach(() => {
    render = jest.fn()
    document.body.innerHTML = '<div id="root"></div>'

    store = createComponent({
      state: {}
    })

    const div = createComponent({
      _type: 'div',
      $children () {
        render()
        const { selectedState: { prop1, prop2 = '', prop3 } = {} } = store.state
        return [
          { _type: 'div', textContent: prop1 },
          { _type: 'div', textContent: prop2.text || prop2 },
          { _type: 'div', textContent: prop3 }
        ]
      }
    })

    const container = document.querySelector('#root')
    renderApp(container, [div])
  })

  test('renders correctly', () => {
    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><div></div><div></div><div></div></div></div>')
    expect(render.mock.calls.length).toBe(1)
  })

  test('changes subscription dynamically', async (done) => {
    store.state.selectedState = {
      prop1: 'prop1 #1',
      prop2: 'prop2 #1',
      prop3: 'prop3 #1'
    }

    await timer()
    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><div>prop1 #1</div><div>prop2 #1</div><div>prop3 #1</div></div></div>')
    expect(render.mock.calls.length).toBe(2)

    store.state.selectedState.prop2 = 'prop2 #2'
    await timer()
    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><div>prop1 #1</div><div>prop2 #2</div><div>prop3 #1</div></div></div>')
    expect(render.mock.calls.length).toBe(3)

    store.state.selectedState.prop2 = { text: 'prop2 #3' }
    await timer()
    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><div>prop1 #1</div><div>prop2 #3</div><div>prop3 #1</div></div></div>')
    expect(render.mock.calls.length).toBe(4)

    store.state.selectedState.prop2.text = 'prop2 #4'
    await timer()
    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><div>prop1 #1</div><div>prop2 #4</div><div>prop3 #1</div></div></div>')
    expect(render.mock.calls.length).toBe(5)

    store.state.selectedState = {
      prop1: 'prop1 #2',
      prop2: 'prop2 #5',
      prop3: 'prop3 #2'
    }
    await timer()
    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><div>prop1 #2</div><div>prop2 #5</div><div>prop3 #2</div></div></div>')
    expect(render.mock.calls.length).toBe(6)

    done()
  }, 125)
})

describe('dynamic subcription change (children change)', () => {
  const init1 = () => {
    const render = jest.fn()
    document.body.innerHTML = '<div id="root"></div>'

    const store = createComponent({
      state: {}
    })

    const store2 = createComponent({
      state: {}
    })

    const main = createComponent({
      _type: 'div',
      children: [{
        _type: 'div',
        $children () {
          render()
          const { selectedState: { prop1, prop2 = '', prop3 } = {} } = store.state
          return [
            { _type: 'div', textContent: prop1 },
            { _type: 'div', textContent: prop2.text || prop2 },
            { _type: 'div', textContent: prop3 }
          ]
        }
      }]
    })

    const container = document.querySelector('#root')
    renderApp(container, [main])

    return { store, store2, main, render }
  }

  test('renders correctly #1', () => {
    const { render } = init1()
    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><div><div></div><div></div><div></div></div></div></div>')
    expect(render.mock.calls.length).toBe(1)
  })

  test('changes subscription dynamically with explicit children change', async (done) => {
    const { store, store2, main, render } = init1()
    const render2 = jest.fn()
    main.children[0] = {
      _type: 'div',
      $children () {
        render2()
        const { selectedState: { prop1, prop2 = '', prop3 } = {} } = store2.state
        return [
          { _type: 'div', textContent: prop1 },
          { _type: 'div', textContent: prop2.text || prop2 },
          { _type: 'div', textContent: prop3 }
        ]
      }
    }
    await timer()
    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><div><div></div><div></div><div></div></div></div></div>')
    expect(render.mock.calls.length).toBe(1)
    expect(render2.mock.calls.length).toBe(1)

    store2.state.selectedState = {
      prop1: 'prop1 #1',
      prop2: 'prop2 #1',
      prop3: 'prop3 #1'
    }
    await timer()
    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><div><div>prop1 #1</div><div>prop2 #1</div><div>prop3 #1</div></div></div></div>')
    expect(render.mock.calls.length).toBe(1)
    expect(render2.mock.calls.length).toBe(2)

    store2.state.selectedState.prop2 = 'prop2 #2'
    await timer()
    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><div><div>prop1 #1</div><div>prop2 #2</div><div>prop3 #1</div></div></div></div>')
    expect(render.mock.calls.length).toBe(1)
    expect(render2.mock.calls.length).toBe(3)

    store2.state.selectedState.prop2 = { text: 'prop2 #3' }
    await timer()
    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><div><div>prop1 #1</div><div>prop2 #3</div><div>prop3 #1</div></div></div></div>')
    expect(render.mock.calls.length).toBe(1)
    expect(render2.mock.calls.length).toBe(4)

    store2.state.selectedState.prop2.text = 'prop2 #4'
    await timer()
    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><div><div>prop1 #1</div><div>prop2 #4</div><div>prop3 #1</div></div></div></div>')
    expect(render.mock.calls.length).toBe(1)
    expect(render2.mock.calls.length).toBe(5)

    store.state.selectedState = {
      prop1: 'prop1 #2',
      prop2: 'prop2 #5',
      prop3: 'prop3 #2'
    }
    await timer()
    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><div><div>prop1 #1</div><div>prop2 #4</div><div>prop3 #1</div></div></div></div>')
    expect(render.mock.calls.length).toBe(1)
    expect(render2.mock.calls.length).toBe(5)

    done()
  }, 125)

  const init2 = () => {
    const render1 = jest.fn()
    const render2 = jest.fn()

    document.body.innerHTML = '<div id="root"></div>'

    const button = createComponent({
      _type: 'button',
      state: {
        toggle: true
      },
      textContent: 'TOGGLE',
      onclick () {
        store1.state.counter += 1
        store2.state.counter += 2
        this.state.toggle = !this.state.toggle
      }
    })

    const store1 = createComponent({
      state: {
        counter: 10
      }
    })

    const store2 = createComponent({
      state: {
        counter: 0
      }
    })

    const div1 = createComponent({
      _type: 'div',
      $textContent: () => {
        render1()
        return store1.state.counter
      }
    })

    const div2 = createComponent({
      _type: 'div',
      $textContent: () => {
        render2()
        return store2.state.counter
      }
    })

    const main = createComponent({
      _type: 'div',
      $children: () => [
        button.state.toggle ? div1 : div2
      ]
    })

    const container = document.querySelector('#root')
    renderApp(container, [button, main])

    return { store1, store2, render1, render2, buttonElem: document.getElementsByTagName('button')[0] }
  }

  test('renders correctly #2', () => {
    const { render1, render2 } = init2()
    expect(document.body.innerHTML).toBe('<div id="root"><button>TOGGLE</button><div><div>10</div></div></div>')
    expect(render1.mock.calls.length).toBe(1)
    expect(render2.mock.calls.length).toBe(0)
  })

  test('changes subscription dynamically with implicit children change', async (done) => {
    const { store1, store2, render1, render2, buttonElem } = init2()
    buttonElem.click()
    await timer()

    expect(document.body.innerHTML).toBe('<div id="root"><button>TOGGLE</button><div><div>2</div></div></div>')
    expect(render1.mock.calls.length).toBe(2)
    expect(render2.mock.calls.length).toBe(1)
    expect(store1.state.counter).toBe(11)
    expect(store2.state.counter).toBe(2)

    buttonElem.click()
    await timer()


    expect(document.body.innerHTML).toBe('<div id="root"><button>TOGGLE</button><div><div>12</div></div></div>')
    expect(render1.mock.calls.length).toBe(3)
    expect(render2.mock.calls.length).toBe(2)
    expect(store1.state.counter).toBe(12)
    expect(store2.state.counter).toBe(4)

    store2.state.counter += 3
    store2.state.counter += 3
    await timer()

    expect(document.body.innerHTML).toBe('<div id="root"><button>TOGGLE</button><div><div>12</div></div></div>')
    expect(render1.mock.calls.length).toBe(3)
    expect(render2.mock.calls.length).toBe(2)
    expect(store1.state.counter).toBe(12)
    expect(store2.state.counter).toBe(10)

    store1.state.counter += 5
    store1.state.counter += 5
    store1.state.counter += 5
    await timer()

    expect(document.body.innerHTML).toBe('<div id="root"><button>TOGGLE</button><div><div>27</div></div></div>')
    expect(render1.mock.calls.length).toBe(4)
    expect(render2.mock.calls.length).toBe(2)
    expect(store1.state.counter).toBe(27)
    expect(store2.state.counter).toBe(10)

    buttonElem.click()
    buttonElem.click()
    buttonElem.click()
    await timer()

    expect(document.body.innerHTML).toBe('<div id="root"><button>TOGGLE</button><div><div>16</div></div></div>')
    expect(render1.mock.calls.length).toBe(5)
    expect(render2.mock.calls.length).toBe(3)
    expect(store1.state.counter).toBe(30)
    expect(store2.state.counter).toBe(16)

    done()
  }, 100)

  const init3 = () => {
    const render1 = jest.fn()
    document.body.innerHTML = '<div id="root"></div>'

    const store = createComponent({
      state: {
        counter: 3
      }
    })

    const ul = createComponent({
      _type: 'ul',
      $children: () => {
        render1()
        return Array(store.state.counter).fill(0).map((v, i) => ({ _type: 'li', textContent: i }))
      }
    })

    const main = createComponent({
      _type: 'div',
      children: [ul]
    })

    const container = document.querySelector('#root')
    renderApp(container, [main])

    return { render1, main, ul, store }
  }

  test('renders correctly #3', () => {
    const { render1 } = init3()
    expect(document.body.innerHTML).toBe('<div id="root"><div><ul><li>0</li><li>1</li><li>2</li></ul></div></div>')
    expect(render1.mock.calls.length).toBe(1)
  })

  test('changes subscription dynamically with mixed children change', async () => {
    const { render1, main, ul, store } = init3()
    const render2 = jest.fn()

    const store2 = createComponent({
      state: {
        counter: 5
      }
    })

    main.children[0] = createComponent({
      _type: 'ul',
      $children: () => {
        render2()
        return Array(store2.state.counter).fill(0).map((v, i) => ({ _type: 'li', textContent: i * 10 }))
      }
    })

    expect(render1.mock.calls.length).toBe(1)
    expect(render2.mock.calls.length).toBe(1)
    expect(document.body.innerHTML).toBe('<div id="root"><div><ul><li>0</li><li>10</li><li>20</li><li>30</li>' +
      '<li>40</li></ul></div></div>')
    expect(render1.mock.calls.length).toBe(1)
    expect(render2.mock.calls.length).toBe(1)

    store2.state.counter = 2
    await timer()
    expect(document.body.innerHTML).toBe('<div id="root"><div><ul><li>0</li><li>10</li></ul></div></div>')
    expect(render1.mock.calls.length).toBe(1)
    expect(render2.mock.calls.length).toBe(2)

    main.children[0] = ul
    await timer()

    expect(document.body.innerHTML).toBe('<div id="root"><div><ul><li>0</li><li>1</li><li>2</li></ul></div></div>')
    expect(render1.mock.calls.length).toBe(2)
    expect(render2.mock.calls.length).toBe(2)

    store.state.counter = 4
    await timer()
    store.state.counter = 0
    store.state.counter = 2
    await timer()

    expect(document.body.innerHTML).toBe('<div id="root"><div><ul><li>0</li><li>1</li></ul></div></div>')
    expect(render1.mock.calls.length).toBe(4)
    expect(render2.mock.calls.length).toBe(2)
  })
})

describe('unusual situations', () => {
  test('rendering null component', () => {
    document.body.innerHTML = '<div id="root"></div>'
    let container = document.querySelector('#root')
    renderApp(container, [null])

    expect(document.body.innerHTML).toBe('<div id="root"></div>')

    document.body.innerHTML = '<div id="root"></div>'
    container = document.querySelector('#root')
    renderApp(container, [{
      _type: 'div',
      children: [null, { _type: 'span', textContent: 'hey!' }, undefined, { _type: 'text', textContent: 'ho!' }]
    }])

    expect(document.body.innerHTML).toBe('<div id="root"><div><span>hey!</span>ho!</div></div>')
  })

  test('directly rendering phantom component', () => {
    document.body.innerHTML = '<div id="root"></div>'
    const container = document.querySelector('#root')
    renderApp(container, [{
      children: [{
        children: [{
          children: [{
            _type: 'div',
            children: [
              {
                children: [{
                  _type: 'span',
                  textContent: 'test #1'
                }]
              },
              {
                _type: 'span',
                textContent: 'test #2'
              }
            ]
          }]
        }]
      }]
    }])

    expect(document.body.innerHTML).toBe('<div id="root"><div><span>test #1</span><span>test #2</span></div></div>')
  })
})
