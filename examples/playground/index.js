// const browserHistory = createComponent({
//   _id: 'browserHistory',
//   state: {
//     locationPath: window.location.pathname,
//     goTo (path) {
//       browserHistory.state.locationPath = path
//       window.history.pushState(null, null, path)
//     }
//   }
// })
//
// const isPathCorrect = (path, locationPath) => path === locationPath
//
// const route = (id, path, component) => createComponent({
//   _type: 'div',
//   _id: id,
//   __children () {
//     return [
//       { _type: 'div', children: [{ _type: 'text', content: `- ${id} ---` }] },
//       { _type: 'div', children: [{ _type: 'text', content: `- ${id} ---` }] },
//       isPathCorrect(path, browserHistory.state.locationPath) && component,
//       { _type: 'div', children: [{ _type: 'text', content: `- ${id} +++` }] },
//       { _type: 'div', children: [{ _type: 'text', content: `- ${id} +++` }] },
//     ]
//   }
// }, browserHistory)
//
// const page1 = createComponent({
//   _type: 'button',
//   children: [{ _type: 'text', content: 'Page 1' }],
//   onclick () {
//     browserHistory.state.goTo('/examples/playground/page1')
//   }
// })
//
// const page2 = createComponent({
//   _type: 'button',
//   children: [{ _type: 'text', content: 'Page 2' }],
//   onclick () {
//     browserHistory.state.goTo('/examples/playground/page2')
//   }
// })
//
// const page3 = createComponent({
//   _type: 'button',
//   state: {
//     mainVisible: false
//   },
//   children: [{ _type: 'text', content: 'Page 3' }],
//   onclick () {
//     browserHistory.state.goTo('/examples/playground/page3')
//   }
// })
//
// const textComponent = content => createComponent({ _type: 'div', children: [{ _type: 'text', content }] })
// const t1 = textComponent('page 1')
// const t2 = textComponent('page 2')
// const t3 = textComponent('page 3')
//
// const main = createComponent({
//   _type: 'div',
//   _id: 'main',
//   __children () {
//     console.log('rerender')
//     return [
//       route('route1', '/examples/playground/page1', t1),
//       route('route2', '/examples/playground/page2', t2),
//       route('route3', '/examples/playground/page3', t3)
//     ]
//   }
// })





const ul = createComponent({
  _type: 'ul',
  state: {
    counter: 0
  },
  children: [
    { _type: 'li', children: [{ _type: 'text', textContent: 9 }] },
    { _type: 'li', children: [{ _type: 'text', textContent: 9 }] },
    { _type: 'li', children: [{ _type: 'text', textContent: 9 }] },
    { _type: 'li', children: [{ _type: 'text', textContent: 9 }] },
    // {
    //   children: [
    //     {
    //       children: [
    //         { _type: 'li', children: [{ _type: 'text', textContent: 9 }] },
    //         { _type: 'li', children: [{ _type: 'text', textContent: 9 }] },
    //         { _type: 'li', children: [{ _type: 'text', textContent: 9 }] },
    //         { _type: 'li', children: [{ _type: 'text', textContent: 9 }] },
    //       ]
    //     }
    //   ]
    // }
  ]
  // $children () {
  //   return [
  //     { _type: 'li', children: [{ _type: 'text', textContent: this.state.counter }] }
  //   ]
  // }
})
const div = createComponent({
  _type: 'div',
  children: [{
    children: [{
      children: [{ _type: 'text', textContent: 'test' }]
    }]
  }]
})

const main = createComponent({
  children: [div]
})

const container = document.querySelector('#root')
renderApp(container, [main])

console.log(main)

setTimeout(() => {
  // ul.state.counter = 10
  // document.querySelector('#update').onclick()

  // console.log(ul.children[0].children[0].children)
  // ul.children[0].children[0].children[2] = { _type: 'li', children: [{ _type: 'text', textContent: 8 }] }
  // ul.children[0].children[0].children[2].textContent = 8

  // ul.children = [
  //   { _type: 'li', children: [{ _type: 'text', textContent: 1 }] },
  //   { _type: 'li', children: [{ _type: 'text', textContent: 2 }] },
  //   { _type: 'li', children: [{ _type: 'text', textContent: 3 }] },
  //   { _type: 'li', children: [{ _type: 'text', textContent: 4 }] },
  //   { _type: 'li', children: [{ _type: 'text', textContent: 5 }] },
  //   { _type: 'li', children: [{ _type: 'text', textContent: 6 }] },
  //   { _type: 'li', children: [{ _type: 'text', textContent: 7 }] }
  // ]
  // main.children[0].textContent = 'changed text'

  // ul.children = [
  //   {
  //     children: [
  //       { _type: 'li', children: [{ _type: 'text', textContent: 1 }] },
  //       { _type: 'li', children: [{ _type: 'text', textContent: 2 }] },
  //       { _type: 'li', children: [{ _type: 'text', textContent: 3 }] },
  //       { _type: 'li', children: [{ _type: 'text', textContent: 4 }] },
  //       { _type: 'li', children: [{ _type: 'text', textContent: 5 }] },
  //       { _type: 'li', children: [{ _type: 'text', textContent: 6 }] },
  //       { _type: 'li', children: [{ _type: 'text', textContent: 7 }] }
  //     ]
  //   }
  // ]
  // ul.children[1] = null
}, 100)


// setTimeout(() => {
//   // const t = ({ _type: 'li', children: [{ _type: 'text', content: 5 }] })
//   ul.children[1] = null
//   console.log('done')
// }, 1000)

// const container = document.querySelector('#root')
// renderApp(container, [main])

// console.log(main)
