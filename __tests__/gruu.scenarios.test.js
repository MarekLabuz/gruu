const { createComponent, renderApp, browserHistory, route } = require('../src/gruu') // eslint-disable-line

const timer = async (time) => {
  await new Promise(resolve => setTimeout(resolve, time))
}

describe('store + counters + ul', () => {
  let store
  let ul
  let main

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    store = createComponent({
      state: {
        counter: 0
      }
    })

    main = createComponent({
      _type: 'div',
      $children: () => [{ _type: 'text', textContent: store.state.counter }]
    }, store)

    ul = createComponent({
      _type: 'ul',
      $children: () => Array(store.state.counter + 1).fill(true).map((v, i) => ({
        _type: 'li',
        children: [{ _type: 'text', textContent: i + 1 }]
      }))
    }, store)

    const button = (name, diff) => createComponent({
      _type: 'button',
      children: [{ _type: 'text', textContent: name }],
      onclick () {
        store.state.counter += diff
      }
    })

    const addButton = button('+', 1)
    const minusButtton = button('-', -1)

    const container = document.querySelector('#root')
    renderApp(container, [main, addButton, minusButtton, ul])
  })

  test('renders correctly', () => {
    expect(store.state.counter).toBe(0)
    expect(document.body.innerHTML)
      .toBe('<div id="root"><div>0</div><button>+</button><button>-</button><ul><li>1</li></ul></div>')
  })

  test('view changes on +button click', async (done) => {
    const addButton = document.getElementsByTagName('button')[0]

    addButton.click()
    expect(store.state.counter).toBe(1)
    await timer(25)
    const ulHtml = document.getElementsByTagName('ul')[0]
    expect(ulHtml.innerHTML).toBe('<li>1</li><li>2</li>')
    expect(ul.children[0].children[0].textContent).toBe(1)
    expect(ul.children[1].children[0].textContent).toBe(2)
    const mainHtml = document.getElementsByTagName('div')[1]
    expect(mainHtml.innerHTML).toBe('1')
    expect(main.children[0].textContent).toBe(1)
    done()
  }, 50)

  test('view changes on many +button and -button clicks', async (done) => {
    const [addButton, minutButton] = document.getElementsByTagName('button')

    addButton.click()
    addButton.click()
    addButton.click()
    addButton.click()
    expect(store.state.counter).toBe(4)
    await timer(25)
    const ulHtml = document.getElementsByTagName('ul')[0]
    expect(ulHtml.innerHTML).toBe('<li>1</li><li>2</li><li>3</li><li>4</li><li>5</li>')
    expect(ul.children[0].children[0].textContent).toBe(1)
    expect(ul.children[1].children[0].textContent).toBe(2)
    expect(ul.children[2].children[0].textContent).toBe(3)
    expect(ul.children[3].children[0].textContent).toBe(4)
    expect(ul.children[4].children[0].textContent).toBe(5)
    const mainHtml = document.getElementsByTagName('div')[1]
    expect(mainHtml.innerHTML).toBe('4')
    expect(main.children[0].textContent).toBe(4)

    minutButton.click()
    minutButton.click()
    await timer(25)
    expect(ulHtml.innerHTML).toBe('<li>1</li><li>2</li><li>3</li>')
    expect(ul.children[0].children[0].textContent).toBe(1)
    expect(ul.children[1].children[0].textContent).toBe(2)
    expect(ul.children[2].children[0].textContent).toBe(3)
    expect(mainHtml.innerHTML).toBe('2')
    expect(main.children[0].textContent).toBe(2)
    done()
  }, 75)
})

describe('dynamically render component with subscription', () => {
  let store

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    store = createComponent({
      state: {
        counter: 0
      }
    })

    const div = counter => createComponent({
      _type: 'div',
      $className: () => store.state.counter,
      $children: () => [{ _type: 'span', textContent: store.state.counter + counter }]
    })

    const main = createComponent({
      _type: 'div',
      state: {
        counter: 0
      },
      $children () {
        return [div(this.state.counter)]
      }
    })

    const button1 = createComponent({
      _type: 'button',
      textContent: 'store',
      onclick () {
        store.state.counter += 1
      }
    })

    const button2 = createComponent({
      _type: 'button',
      textContent: 'main',
      onclick () {
        main.state.counter += 1
      }
    })

    const container = document.querySelector('#root')
    renderApp(container, [main, button1, button2])
  })

  const html = (c1, c2) =>
    `<div id="root"><div><div class="${c1}"><span>${c2}</span></div></div><button>store</button>` +
      '<button>main</button></div>'

  const numberOfStoreListeners = () => Object.keys(store._listeners).length

  test('renders correctly', () => {
    expect(document.body.innerHTML).toBe(html(0, 0))
    expect(numberOfStoreListeners()).toBe(1)
  })

  test('content changes correctly', async (done) => {
    const [storeB, mainB] = document.getElementsByTagName('button')

    storeB.click()
    expect(numberOfStoreListeners()).toBe(1)
    await timer(25)
    expect(document.body.innerHTML).toBe(html(1, 1))

    mainB.click()
    expect(numberOfStoreListeners()).toBe(1)
    await timer(25)
    expect(document.body.innerHTML).toBe(html(1, 2))

    mainB.click()
    expect(numberOfStoreListeners()).toBe(1)
    storeB.click()
    expect(numberOfStoreListeners()).toBe(1)
    mainB.click()
    expect(numberOfStoreListeners()).toBe(1)
    await timer(25)
    expect(document.body.innerHTML).toBe(html(2, 5))

    mainB.click()
    expect(numberOfStoreListeners()).toBe(1)
    storeB.click()
    expect(numberOfStoreListeners()).toBe(1)
    await timer(25)
    expect(document.body.innerHTML).toBe(html(3, 7))
    expect(numberOfStoreListeners()).toBe(1)

    done()
  }, 125)
})

describe('routing advanced', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    const page = text => createComponent({
      _type: 'div',
      textContent: text
    })

    const router = createComponent({
      _type: 'div',
      children: [
        {
          children: [
            route('/examples/playground', page('main')),
            {
              _type: 'div',
              children: [
                route('/examples/playground/page1', page('page1'))
              ]
            },
            page('page3'),
            route('/examples/playground/page2', page('page2'))
          ]
        }
      ]
    })

    const button = path => createComponent({
      _type: 'button',
      id: path,
      textContent: path,
      onclick () {
        browserHistory.state.goTo(path)
      }
    })

    const container = document.querySelector('#root')
    renderApp(container, [
      router,
      button('/examples/playground'),
      button('/examples/playground/page1'),
      button('/examples/playground/page2')
    ])
  })

  test('renders correctly', (done) => {
    done()
  })
})
