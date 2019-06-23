const Gruu = require('../src/index')

const timer = () => new Promise(resolve => setTimeout(resolve))

describe('store + counters + ul', () => {
  let store
  let ul
  let main

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    store = Gruu.createComponent({
      state: {
        counter: 0
      }
    })

    main = Gruu.createComponent({
      _type: 'div',
      $children: () => [{ _type: 'text', textContent: store.state.counter }]
    }, store)

    ul = Gruu.createComponent({
      _type: 'ul',
      $children: () => Array(store.state.counter + 1).fill(true).map((v, i) => ({
        _type: 'li',
        children: [{ _type: 'text', textContent: i + 1 }]
      }))
    }, store)

    const button = (name, diff) => Gruu.createComponent({
      _type: 'button',
      children: [{ _type: 'text', textContent: name }],
      onclick () {
        store.state.counter += diff
      }
    })

    const addButton = button('+', 1)
    const minusButtton = button('-', -1)

    const container = document.querySelector('#root')
    Gruu.renderApp(container, [main, addButton, minusButtton, ul])
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
    await timer()
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
    await timer()
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
    await timer()
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

    store = Gruu.createComponent({
      state: {
        counter: 0
      }
    })

    const div = counter => Gruu.createComponent({
      _type: 'div',
      $className: () => store.state.counter,
      $children: () => [{ _type: 'span', textContent: store.state.counter + counter }]
    })

    const main = Gruu.createComponent({
      _type: 'div',
      state: {
        counter: 0
      },
      $children () {
        return [div(this.state.counter)]
      }
    })

    const button1 = Gruu.createComponent({
      _type: 'button',
      textContent: 'store',
      onclick () {
        store.state.counter += 1
      }
    })

    const button2 = Gruu.createComponent({
      _type: 'button',
      textContent: 'main',
      onclick () {
        main.state.counter += 1
      }
    })

    const container = document.querySelector('#root')
    Gruu.renderApp(container, [main, button1, button2])
  })

  const html = (c1, c2) =>
    `<div id="root"><div><div class="${c1}"><span>${c2}</span></div></div><button>store</button>` +
      '<button>main</button></div>'

  const numberOfStoreListeners = () => Object.keys(store._l).length

  test('renders correctly', () => {
    expect(document.body.innerHTML).toBe(html(0, 0))
    expect(numberOfStoreListeners()).toBe(1)
  })

  test('content changes correctly', async (done) => {
    const [storeB, mainB] = document.getElementsByTagName('button')

    storeB.click()
    expect(numberOfStoreListeners()).toBe(1)
    await timer()
    expect(document.body.innerHTML).toBe(html(1, 1))

    mainB.click()
    expect(numberOfStoreListeners()).toBe(1)
    await timer()
    expect(document.body.innerHTML).toBe(html(1, 2))

    mainB.click()
    expect(numberOfStoreListeners()).toBe(1)
    storeB.click()
    expect(numberOfStoreListeners()).toBe(1)
    mainB.click()
    expect(numberOfStoreListeners()).toBe(1)
    await timer()
    expect(document.body.innerHTML).toBe(html(2, 5))

    mainB.click()
    expect(numberOfStoreListeners()).toBe(1)
    storeB.click()
    expect(numberOfStoreListeners()).toBe(1)
    await timer()
    expect(document.body.innerHTML).toBe(html(3, 7))
    expect(numberOfStoreListeners()).toBe(1)

    done()
  }, 125)
})

describe('replacing nodes (dom components)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    const store = Gruu.createComponent({
      state: {
        data: [['john', 'smith', 34], ['michael', 'smith', 34]],
        columns: ['first name', 'last name', 'age', '']
      }
    })

    const addJaneButton = Gruu.createComponent({
      _type: 'div',
      children: [{
        children: [{
          children: [{
            children: [{
              _type: 'button',
              textContent: 'Add Jane',
              onclick () {
                store.state.data = [
                  ...store.state.data,
                  ['Jane', 'Forest', Math.floor(Math.random() * 25) + 20]
                ]
              }
            }]
          }]
        }]
      }]
    })

    const addJaneButton2 = Gruu.createComponent({
      _type: 'div',
      children: [{
        children: [{
          children: [{
            _type: 'button',
            textContent: 'Add Jane 2',
            onclick () {
              store.state.data = [
                ...store.state.data,
                ['Jane', 'Forest', Math.floor(Math.random() * 25) + 100]
              ]
            }
          }]
        }]
      }]
    })

    const app = Gruu.createComponent({
      _type: 'div',
      $children: () => [store.state.data.length % 2 === 0 ? addJaneButton2 : addJaneButton]
    })

    const container = document.querySelector('#root')
    Gruu.renderApp(container, [app])
  })

  const html = text => `<div id="root"><div><div><button>${text}</button></div></div></div>`

  test('renders correctly', () => {
    expect(document.body.innerHTML).toBe(html('Add Jane 2'))
  })

  test('button text changes on click', async (done) => {
    const button = document.getElementsByTagName('button')[0]

    button.click()
    await timer()
    expect(document.body.innerHTML).toBe(html('Add Jane'))

    button.click()
    await timer()
    expect(document.body.innerHTML).toBe(html('Add Jane 2'))

    button.click()
    await timer()
    expect(document.body.innerHTML).toBe(html('Add Jane'))

    done()
  }, 100)
})

describe('replacing nodes (phantom components)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    const store = Gruu.createComponent({
      state: {
        data: [['john', 'smith', 34], ['michael', 'smith', 34]],
        columns: ['first name', 'last name', 'age', '']
      }
    })

    const addJaneButton = Gruu.createComponent({
      children: [{
        children: [{
          children: [{
            children: [{
              _type: 'button',
              textContent: 'Add Jane',
              onclick () {
                store.state.data = [
                  ...store.state.data,
                  ['Jane', 'Forest', Math.floor(Math.random() * 25) + 20]
                ]
              }
            }]
          }]
        }]
      }]
    })

    const addJaneButton2 = Gruu.createComponent({
      children: [{
        children: [{
          children: [{
            _type: 'button',
            textContent: 'Add Jane 2',
            onclick () {
              store.state.data = [
                ...store.state.data,
                ['Jane', 'Forest', Math.floor(Math.random() * 25) + 100]
              ]
            }
          }]
        }]
      }]
    })

    const app = Gruu.createComponent({
      _type: 'div',
      $children: () => [store.state.data.length % 2 === 0 ? addJaneButton2 : addJaneButton]
    })

    const container = document.querySelector('#root')
    Gruu.renderApp(container, [app])
  })

  const html = text => `<div id="root"><div><button>${text}</button></div></div>`

  test('renders correctly', () => {
    expect(document.body.innerHTML).toBe(html('Add Jane 2'))
  })

  test('button text changes on click', async (done) => {
    const button = document.getElementsByTagName('button')[0]

    button.click()
    await timer()
    expect(document.body.innerHTML).toBe(html('Add Jane'))

    button.click()
    await timer()
    expect(document.body.innerHTML).toBe(html('Add Jane 2'))

    button.click()
    await timer()
    expect(document.body.innerHTML).toBe(html('Add Jane'))

    done()
  }, 100)
})

describe('excesive list generator', () => {
  const init = () => {
    const render1 = jest.fn()
    const render2 = jest.fn()
    const render3 = jest.fn()

    document.body.innerHTML = '<div id="root"></div>'

    const div = Gruu.createComponent({
      _type: 'div',
      textContent: 'div'
    })

    const store = Gruu.createComponent({
      state: {
        counter: 0
      }
    })

    const ul = Gruu.createComponent({
      _type: 'ul',
      $children: () => {
        render1()
        return Array(store.state.counter).fill(true).map(() => Gruu.createComponent({
          _type: 'li',
          $children: () => {
            render2()
            return Array(store.state.counter).fill(true).map(() => Gruu.createComponent({
              _type: 'div',
              $textContent: () => {
                render3()
                return store.state.counter
              }
            }))
          }
        }))
      }
    })

    const button = Gruu.createComponent({
      _type: 'button',
      state: {
        toggle: true
      },
      textContent: 'TOGGLE',
      onclick () {
        this.state.toggle = !this.state.toggle
      }
    })

    const main = Gruu.createComponent({
      _type: 'div',
      $children: () => [button.state.toggle ? div : ul]
    })

    const container = document.querySelector('#root')
    Gruu.renderApp(container, [button, main])

    return { store, render1, render2, render3 }
  }

  const divHTMl = '<div id="root"><button>TOGGLE</button><div><div>div</div></div></div>'

  test('renders correctly', () => {
    const { render1, render2, render3 } = init()
    expect(document.body.innerHTML).toBe(divHTMl)
    expect(render1.mock.calls.length).toBe(0)
    expect(render2.mock.calls.length).toBe(0)
    expect(render3.mock.calls.length).toBe(0)
  })

  const ulHTML = n => `<div id="root"><button>TOGGLE</button><div><ul>${
    Array(n).fill(`<li>${Array(n).fill(`<div>${n}</div>`).join('')}</li>`).join('')
  }</ul></div></div>`

  test('state toggles div and ul', async (done) => {
    const { store, render1, render2, render3 } = init()
    const buttonElem = document.getElementsByTagName('button')[0]

    buttonElem.click()
    await timer()

    expect(document.body.innerHTML).toBe(ulHTML(0))
    expect(render1.mock.calls.length).toBe(1)
    expect(render2.mock.calls.length).toBe(0)
    expect(render3.mock.calls.length).toBe(0)

    store.state.counter += 1
    await timer()
    expect(document.body.innerHTML).toBe(ulHTML(1))
    expect(render1.mock.calls.length).toBe(2)
    expect(render2.mock.calls.length).toBe(1)
    expect(render3.mock.calls.length).toBe(1)

    store.state.counter += 1
    store.state.counter += 1
    store.state.counter += 1
    await timer()
    expect(document.body.innerHTML).toBe(ulHTML(4))
    expect(render1.mock.calls.length).toBe(3)
    expect(render2.mock.calls.length).toBe(6)
    expect(render3.mock.calls.length).toBe(26)

    buttonElem.click()
    await timer()
    expect(document.body.innerHTML).toBe(divHTMl)
    expect(render1.mock.calls.length).toBe(3)
    expect(render2.mock.calls.length).toBe(6)
    expect(render3.mock.calls.length).toBe(26)

    store.state.counter += 1
    store.state.counter += 1
    await timer()
    expect(document.body.innerHTML).toBe(divHTMl)
    expect(render1.mock.calls.length).toBe(3)
    expect(render2.mock.calls.length).toBe(10)
    expect(render3.mock.calls.length).toBe(66)

    buttonElem.click()
    await timer()
    expect(document.body.innerHTML).toBe(ulHTML(6))
    expect(render1.mock.calls.length).toBe(4)
    expect(render2.mock.calls.length).toBe(16)
    expect(render3.mock.calls.length).toBe(126)

    buttonElem.click()
    await timer()
    buttonElem.click()
    await timer()
    buttonElem.click()
    await timer()
    buttonElem.click()
    await timer()
    buttonElem.click()
    await timer()
    buttonElem.click()
    await timer()
    expect(document.body.innerHTML).toBe(ulHTML(6))
    expect(render1.mock.calls.length).toBe(7)
    expect(render2.mock.calls.length).toBe(34)
    expect(render3.mock.calls.length).toBe(342)

    done()
  }, 300)
})

describe('rendered components inside Gruu.createComponent as a dynamic children', () => {
  const init = () => {
    const render = jest.fn()

    document.body.innerHTML = '<div id="root"></div>'

    const store = Gruu.createComponent({
      state: {
        toggle: true
      }
    })

    const loader = Gruu.createComponent({
      _type: 'div',
      children: Gruu.createComponent({
        _type: 'div',
        $textContent: () => {
          render()
          return 'loader'
        }
      })
    })

    const div = Gruu.createComponent({
      _type: 'div',
      $children: () => store.state.toggle && (
        Gruu.createComponent({
          _type: 'div',
          children: [
            loader
          ]
        })
      )
    })

    const container = document.querySelector('#root')
    Gruu.renderApp(container, [div])

    return { render, store }
  }

  test('renders correctly', () => {
    init()
    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><div><div><div>loader</div></div></div></div></div>')
  })

  test('toggle does not rerender loader', async (done) => {
    const { render, store } = init()
    expect(document.body.innerHTML).toBe('<div id="root"><div><div><div><div>loader</div></div></div></div></div>')
    expect(render.mock.calls.length).toBe(1)

    store.state.toggle = !store.state.toggle
    await timer()

    expect(document.body.innerHTML).toBe('<div id="root"><div></div></div>')
    expect(render.mock.calls.length).toBe(1)

    store.state.toggle = !store.state.toggle
    await timer()

    expect(document.body.innerHTML).toBe('<div id="root"><div><div><div><div>loader</div></div></div></div></div>')
    expect(render.mock.calls.length).toBe(1)

    store.state.toggle = !store.state.toggle
    await timer()

    expect(document.body.innerHTML).toBe('<div id="root"><div></div></div>')
    expect(render.mock.calls.length).toBe(1)

    store.state.toggle = !store.state.toggle
    store.state.toggle = !store.state.toggle
    store.state.toggle = !store.state.toggle
    await timer()

    expect(document.body.innerHTML).toBe('<div id="root"><div><div><div><div>loader</div></div></div></div></div>')
    expect(render.mock.calls.length).toBe(1)

    done()
  }, 150)
})
