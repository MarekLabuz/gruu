const { createComponent, renderApp } = require('../src/gruu') // eslint-disable-line

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
      .toBe('<div id="root"><div><div>0</div><button>+</button><button>-</button><ul><li>1</li></ul></div></div>')
  })

  test('view changes on +button click', (done) => {
    const addButton = document.getElementsByTagName('button')[0]
    addButton.click()
    expect(store.state.counter).toBe(1)
    setTimeout(() => {
      const ulHtml = document.getElementsByTagName('ul')[0]
      expect(ulHtml.innerHTML).toBe('<li>1</li><li>2</li>')
      expect(ul.children[0].children[0].textContent).toBe(1)
      expect(ul.children[1].children[0].textContent).toBe(2)
      const mainHtml = document.getElementsByTagName('div')[2]
      expect(mainHtml.innerHTML).toBe('1')
      expect(main.children[0].textContent).toBe(1)
      done()
    }, 25)
  }, 50)

  test('view changes on many +button and -button clicks', (done) => {
    const [addButton, minutButton] = document.getElementsByTagName('button')
    addButton.click()
    addButton.click()
    addButton.click()
    addButton.click()
    expect(store.state.counter).toBe(4)
    setTimeout(() => {
      const ulHtml = document.getElementsByTagName('ul')[0]
      expect(ulHtml.innerHTML).toBe('<li>1</li><li>2</li><li>3</li><li>4</li><li>5</li>')
      expect(ul.children[0].children[0].textContent).toBe(1)
      expect(ul.children[1].children[0].textContent).toBe(2)
      expect(ul.children[2].children[0].textContent).toBe(3)
      expect(ul.children[3].children[0].textContent).toBe(4)
      expect(ul.children[4].children[0].textContent).toBe(5)
      const mainHtml = document.getElementsByTagName('div')[2]
      expect(mainHtml.innerHTML).toBe('4')
      expect(main.children[0].textContent).toBe(4)

      minutButton.click()
      minutButton.click()

      setTimeout(() => {
        expect(ulHtml.innerHTML).toBe('<li>1</li><li>2</li><li>3</li>')
        expect(ul.children[0].children[0].textContent).toBe(1)
        expect(ul.children[1].children[0].textContent).toBe(2)
        expect(ul.children[2].children[0].textContent).toBe(3)
        expect(mainHtml.innerHTML).toBe('2')
        expect(main.children[0].textContent).toBe(2)
        done()
      }, 25)
    }, 25)
  }, 100)
})

describe('dynamically render component with subscription', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    const store = createComponent({
      state: {
        counter: 0
      }
    })

    const div = counter => createComponent({
      _type: 'div',
      $textContent: () => store.state.counter + counter
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

  const html = counter =>
    `<div id="root"><div><div><div>${counter}</div></div><button>store</button><button>main</button></div></div>`

  test('renders correctly', () => {
    expect(document.body.innerHTML).toBe(html(0))
  })

  test('content changes correctly', (done) => {
    const [button1, button2] = document.getElementsByTagName('button')
    button1.click()
    setTimeout(() => {
      expect(document.body.innerHTML).toBe(html(1))
      button2.click()
      setTimeout(() => {
        expect(document.body.innerHTML).toBe(html(2))
        button2.click()
        button1.click()
        button2.click()
        setTimeout(() => {
          expect(document.body.innerHTML).toBe(html(5))
          button2.click()
          button1.click()
          setTimeout(() => {
            expect(document.body.innerHTML).toBe(html(7))
            done()
          }, 25)
        }, 25)
      }, 25)
    }, 25)
  }, 150)
})
