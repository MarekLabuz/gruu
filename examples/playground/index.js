const browserHistory = createComponent({
  _id: 'browserHistory',
  state: {
    locationPath: window.location.pathname,
    goTo (path) {
      browserHistory.state.locationPath = path
      window.history.pushState(null, null, path)
    }
  }
})

const isPathCorrect = (path, locationPath) => path === locationPath

const route = (id, path, component) => createComponent({
  _type: 'div',
  _id: id,
  __children () {
    return [
      { _type: 'div', children: [{ _type: 'text', content: `- ${id} ---` }] },
      { _type: 'div', children: [{ _type: 'text', content: `- ${id} ---` }] },
      isPathCorrect(path, browserHistory.state.locationPath) && component,
      { _type: 'div', children: [{ _type: 'text', content: `- ${id} +++` }] },
      { _type: 'div', children: [{ _type: 'text', content: `- ${id} +++` }] },
    ]
  }
}, browserHistory)

const page1 = createComponent({
  _type: 'button',
  children: [{ _type: 'text', content: 'Page 1' }],
  onclick () {
    browserHistory.state.goTo('/examples/playground/page1')
  }
})

const page2 = createComponent({
  _type: 'button',
  children: [{ _type: 'text', content: 'Page 2' }],
  onclick () {
    browserHistory.state.goTo('/examples/playground/page2')
  }
})

const page3 = createComponent({
  _type: 'button',
  state: {
    mainVisible: false
  },
  children: [{ _type: 'text', content: 'Page 3' }],
  onclick () {
    browserHistory.state.goTo('/examples/playground/page3')
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
    console.log('rerender')
    return [
      route('route1', '/examples/playground/page1', t1),
      route('route2', '/examples/playground/page2', t2),
      route('route3', '/examples/playground/page3', t3)
    ]
  }
})


const container = document.querySelector('#root')
renderApp(container, [page1, page2, page3, main])

console.log(main)
