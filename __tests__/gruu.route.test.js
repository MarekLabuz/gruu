window.__TEST__ = true // eslint-disable-line

const { createComponent, renderApp, browserHistory, route } = require('../src/gruu')

describe('renders correctly', () => {
  let button1
  let button2
  let button3

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    button1 = createComponent({
      _type: 'button',
      children: [{ _type: 'text', content: 'Page 1' }],
      onclick () {
        browserHistory.state.goTo('/page1')
      }
    })

    button2 = createComponent({
      _type: 'button',
      children: [{ _type: 'text', content: 'Page 2' }],
      onclick () {
        browserHistory.state.goTo('/page2')
      }
    })

    button3 = createComponent({
      _type: 'button',
      children: [{ _type: 'text', content: 'Page 3' }],
      onclick () {
        console.log('click')
        browserHistory.state.goTo('/page3')
      }
    })

    const textComponent = content => createComponent({ _type: 'div', children: [{ _type: 'text', content }] })
    const t1 = textComponent('page 1')
    const t2 = textComponent('page 2')
    const t3 = textComponent('page 3')

    const main = createComponent({
      _type: 'div',
      _id: 'main',
      __children () {
        return [
          route('route1', '/page1', t1),
          route('route2', '/page2', t2),
          route('route3', '/page3', t3)
        ]
      }
    })

    const container = document.querySelector('#root')
    renderApp(container, [button1, button2, button3, main])
  })

  test('', () => {
    // const [b1, b2, b3] = document.getElementsByTagName('button')
    // b3.click()
    // setTimeout(() => {
    //   console.log(document.body.innerHTML)
    //   done()
    // }, 1000)
  })
})
