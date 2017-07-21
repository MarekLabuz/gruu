
const page = text => createComponent({
  _type: 'div',
  textContent: text
})

// const main = page('main')
// const page1 = page('page1')
// const page2 = page('page2')
// const page3 = page('page3')

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

setTimeout(() => {
  router.children = [
    page('page3'),
    {
      children: [
        route('/examples/playground', page('main')),
        route('/examples/playground/page2', page('page2'))
      ]
    },
    page('page3'),
    {
      _type: 'div',
      children: [
        route('/examples/playground/page1', page('page1'))
      ]
    }
  ]
}, 2000)


// const people = createComponent({
//   children: []
// })
//
// const main = createComponent({
//   children: [{
//     children: [{
//       children: [{
//         children: [{
//           children: [{
//             children: [{
//               children: [{
//                 children: [people]
//               }]
//             }]
//           }]
//         }]
//       }]
//     }]
//   }]
// })
//
// const container = document.querySelector('#root')
// renderApp(container, [main])
//
// const wait = () => new Promise(resolve => setTimeout(resolve, 1000))
//
// const jack = createComponent({ _type: 'div', textContent: 'jack' })
// const john = createComponent({ _type: 'div', textContent: 'john' })
// const mary = createComponent({ _type: 'div', textContent: 'mary' })
//
// async function test () {
//   await wait()
//   people.children.push(jack)
//   await wait()
//   people.children.push(john)
//   people.children.push(mary)
//
//
//   // people.children = [john]
//   // await wait()
//   // people.children = [jack, john, mary]
//   //
//   // await wait()
//   // people.children = []
//   // people.children = [mary, john]
//   //
//   // await wait()
//   // people.children = []
//   // people.children = [mary]
// }
//
// test()









// const store = createComponent({
//   state: {
//     counter: 0
//   }
// })
//
// const main = createComponent({
//   _type: 'div',
//   textContent: 'Hello World'
// })
//
// const ul = createComponent({
//   _type: 'ul',
//   state: {
//     data: []
//   },
//   $children () {
//     return this.state.data.map((textContent, i) => ({
//       _type: 'li',
//       children: [
//         { _type: 'text', textContent },
//         {
//           _type: 'button',
//           textContent: 'x',
//           onclick () {
//             ul.state.data.splice(i, 1)
//           }
//         }
//       ]
//     }))
//   }
// })
//
// const button = createComponent({
//   _type: 'button',
//   textContent: 'ADD',
//   onclick () {
//     store.state.counter += 1
//     ul.state.data.push(store.state.counter)
//   }
// })
//
// const counter = createComponent({ _type: 'div', textContent: 0 })
//
// const span = text => createComponent({
//   _type: 'span',
//   textContent: text
// })
//
// const div = createComponent({
//   _type: 'div',
//   $children: () => [
//     {
//       _type: 'span',
//       textContent: store.state.counter
//     },
//     span('hi!!!')
//   ]
// })
//
// const navButton = path => createComponent({
//   _type: 'button',
//   textContent: `Go to: ${path}`,
//   onclick () {
//     browserHistory.state.goTo(path)
//   }
// })
//
// const nav = createComponent({
//   _type: 'nav',
//   children: [
//     { _type: 'text', textContent: 'Jesteś na: ' },
//     route('/examples/playground', { _type: 'text', textContent: 'main' }),
//     route('/examples/playground/about', ul),
//     route('/examples/playground/game', main),
//   ]
// })
//
// const container = document.querySelector('#root')
// renderApp(container, [
//   button,
//   div,
//   counter,
//   navButton('/examples/playground'),
//   navButton('/examples/playground/about'),
//   navButton('/examples/playground/game'),
//   nav
// ])


// const button = createComponent({
//   _type: 'button',
//   id: 'button',
//   state: {
//     counter: 0
//   },
//   $children () {
//     return [{ _type: 'text', textContent: this.state.counter }]
//   },
//   onclick () {
//     this.state.counter += 1
//   }
// })
//
// const main = createComponent({
//   $children () {
//     return [{
//       children: [{ _type: 'text', textContent: button.state.counter }]
//     }]
//   }
// })
//
// const container = document.querySelector('#root')
// renderApp(container, [main, button])

















