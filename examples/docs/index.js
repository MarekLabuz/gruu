const prettyHTML = html => {
  let counter = 0
  const tab = '   '
  return html
    .replace(/>/g, '>\n')
    .replace(/</g, '\n<')
    .replace(/\n\n/g, '\n')
    .split(/\n/)
    .slice(1, -1)
    .map((v) => {
      const r1 = /<[^(>|/)]*>/.test(v)
      const r2 = /<\/[^(>)]*>/.test(v)
      counter += r1 ? 1 : 0
      const a = `${Array(!r1 && !r2 ? counter + 1 : counter).fill(tab).join('')}${v}`
      counter -= (r2 || v === '<input>') ? 1 : 0
      return a
    })
    .join('\n')
}

const general = createComponent({
  _type: 'section',
  children: [
    {
      _type: 'div',
      className: 'title',
      children: [
        { _type: 'img', src: '/examples/docs/images/gruu2.png' },
        { _type: 'span', textContent: 'Gruu' }
      ]
    },
    {
      _type: 'div',
      className: 'heading',
      textContent: 'JavaScript framework for creating Single Page Applications'
    }
  ]
})

const component = createComponent({
  _type: 'section',
  children: [
    { _type: 'h2', textContent: 'Component' },
    {
      _type: 'p',
      textContent: `Components are simple JavaScript objects. Gruu is highly composable.
      Using components you can describe simple and complex parts of html. Example components are given below. 
      Beside there is a html code that is going to be genereted as a result of the rendering of the components.`
    },
    {
      _type: 'div',
      className: 'code-example',
      children: [
        {
          _type: 'div',
          innerHTML: exmpleComponents
        },
        {
          _type: 'div',
          children: [{
            _type: 'pre',
            textContent: exmpleComponentsHTML
          }]
        }
      ]
    },
    {
      _type: 'p',
      textContent: `Component container is a div with a class "container". It contains component hello which is
        a span with id "hello-world" and content "Hello World!". Component container also contains a component which is 
        a paragraph with text "Hello Again :)".`
    },
    {
      _type: 'p',
      textContent: `As you may have noticed a tag name is passed to componentes as a property _type. There are a few
        kinds of properties that components can have:`
    },
    {
      _type: 'table',
      className: 'properties-table',
      children: [
        {
          _type: 'thead',
          children: [{
            _type: 'tr',
            children: [
              { _type: 'th', textContent: 'Property', style: { width: '25%' } },
              { _type: 'th', textContent: 'Description' },
            ]
          }]
        },
        {
          _type: 'tbody',
          children: [
            {
              _type: 'tr',
              children: [
                { _type: 'td', textContent: '_type' },
                {
                  _type: 'td',
                  innerHTML: `Tag name. The only exception is _type: "text" which renders plain text instead of
                  a html tag. Plain text can also be achieved by passing a simple string as a component.
                  It will be parsed into {&nbsp;_type:&nbsp;"text",&nbsp;textContent:&nbsp;someText&nbsp;}.
                  Any property starting with "_" is a property for Gruu internal usage.`
                },
              ]
            },
            {
              _type: 'tr',
              children: [
                { _type: 'td', textContent: 'children' },
                {
                  _type: 'td',
                  textContent: 'Array of components that are going to be rendered inside the given component.'
                },
              ]
            },
            {
              _type: 'tr',
              children: [
                { _type: 'td', textContent: 'state' },
                {
                  _type: 'td',
                  textContent: 'Internal state of the component.'
                },
              ]
            },
            {
              _type: 'tr',
              children: [
                { _type: 'td', textContent: '*all properties starting with $' },
                {
                  _type: 'td',
                  textContent: 'Properties that are calculated dynamically. See more in section Subscriptions.'
                },
              ]
            },
            {
              _type: 'tr',
              children: [
                { _type: 'td', textContent: '*all other properties' },
                {
                  _type: 'td',
                  textContent: `Properties like innerHTML, textContent, className etc. are going to be assigned to 
                    the HTML Element.`
                },
              ]
            }
          ]
        }
      ]
    }
  ]
})

const componentsComparision = createComponent({
  _type: 'section',
  children: [
    { _type: 'h2', textContent: 'DOM vs Phantom Components' },
    {
      _type: 'p',
      innerHTML: `There are two kinds of components: <b>DOM Components</b> and <b>Phantom Components</b>.
        All component that don't have _type property are Phantom.`
    },
    {
      _type: 'p',
      className: 'dom-vs-phantom',
      children: [
        {
          _type: 'div',
          innerHTML: `
            <span>DOM Components</span>
            <p>They have their representaion in the HTML DOM.</p>
            ${domComponentExample}
          `
        },
        {
          _type: 'div',
          innerHTML: `
            <span>Phantom Components</span>
            <p>They exist in Gruu Virtual DOM, but are transparent for the HTML DOM.</p>
            ${phantomComponentExample}
          `
        }
      ]
    },
    {
      _type: 'p',
      textContent: `Phantom Components are transparent for the HTML DOM meaning that its children HTML Elements 
        are going to be appended to the closest parent (HTML Element) that is a DOM Component.
        Using DOM and Phantom Component allows to build complex HTML structures consisting of many elements.`
    }
  ]
})

const counter = createComponent({
  _type: 'div',
  textContent: 10
})

const button = (text, diff) => createComponent({
  _type: 'button',
  className: 'button',
  textContent: text,
  onclick () {
    counter.textContent += diff
    counterInnerHTML.textContent = prettyHTML(counterApp._node.outerHTML)
  }
})

const buttonInc = button('+', 1)
const buttonDec = button('-', -1)

const counterApp = createComponent({
  _type: 'div',
  className: 'changing-properties-app',
  children: [
    'Counter',
    {
      _type: 'div',
      children: [buttonDec, counter, buttonInc]
    }
  ]
})

const counterInnerHTML = createComponent({
  _type: 'div',
  textContent: ''
})

setTimeout(() => {
  counterInnerHTML.textContent = prettyHTML(counterApp._node.outerHTML)
})

const changingProperties = createComponent({
  _type: 'section',
  children: [
    { _type: 'h2', textContent: 'Changing properties' },
    {
      _type: 'p',
      textContent: `You can manually change all properties of components except those starting with "_".
        The changes will be automatically applied to the HTML Elements. Changing properties that starts with "_" Gruu
        handles internally and automatically.`
    },
    {
      _type: 'div',
      className: 'code-example',
      children: [
        {
          _type: 'div',
          innerHTML: changingPropertiesExample
        },
        {
          _type: 'div',
          children: [
            counterApp,
            {
              _type: 'pre',
              children: [counterInnerHTML]
            }

          ]
        }
      ]
    },
    {
      _type: 'p',
      textContent: `Each time you click a button the textContent is going to be changed by value of diff variable
      (1 or -1). Function button is a factory that creates both buttonInc and buttonDec.`
    }
  ]
})

const store = createComponent({
  state: {
    todo: ['lala']
  }
})

const input = createComponent({
  _type: 'input',
  oninput (e) {
    this.value = e.currentTarget.value
  }
})

const addButton = createComponent({
  _type: 'button',
  textContent: 'ADD',
  onclick () {
    store.state.todo.push(input.value)
    input.value = ''
    setTimeout(() => {
      // todoInnerHTML.textContent = prettyHTML(todoApp._node.outerHTML)
    })
  }
})

const resetButton = createComponent({
  _type: 'button',
  textContent: 'RESET',
  onclick () {
    store.state.todo = []
    store.state.todo.length = 0
    setTimeout(() => {
      // todoInnerHTML.textContent = prettyHTML(todoApp._node.outerHTML)
    })
  }
})

const todo = createComponent({
  _type: 'ul',
  $children: () => store.state.todo.map(item => ({
    _type: 'li',
    textContent: item
  }))
})

const todoApp = createComponent({
  _type: 'div',
  $children: () => [input, store.state.todo.length < 3 && addButton, resetButton, todo]
})

const todoInnerHTML = createComponent({
  _type: 'div',
  textContent: ''
})

setTimeout(() => {
  // todoInnerHTML.textContent = prettyHTML(todoApp._node.outerHTML)
})


const subscriptions = createComponent({
  _type: 'section',
  children: [
    {
      _type: 'h2',
      textContent: 'Subscriptions'
    },
    {
      _type: 'p',
      innerHTML: `Subscriptions are the connections between two components.
      The example below shows two components: <b>store</b> and <b>table</b>.
      <i>Table</i> component uses the <i>store</i> variable (<code>store.state.data</code>) to calculates its children.
      Gruu automatically creates a link between the <i>table</i> 
      component and the <i>store</i> component using a dependency that <code>store.state.data</code> 
      renders <code>table.children</code>. Each time the variable <code>store.state.data</code> changes 
      the <code>table.children</code> is going to be recalculated.`
    },
    {
      _type: 'div',
      className: 'code-example',
      children: [
        {
          _type: 'div',
          innerHTML: subscriptionsExample
        },
        {
          _type: 'div',
          children: [
            todoApp,
            {
              _type: 'pre',
              children: [todoInnerHTML]
            }

          ]
        }
      ]
    },
  ]
})

const playgroundButton = createComponent({
  _type: 'button',
  textContent: 'Go Playground',
  onclick () {
    browserHistory.state.goTo('/examples/docs/playground')
  }
})

const homeButton = createComponent({
  _type: 'button',
  textContent: 'Go Home',
  onclick () {
    browserHistory.state.goTo('/examples/docs')
  }
})

const home = createComponent({
  _type: 'div',
  className: 'home',
  children: [
    general,
    component,
    componentsComparision,
    changingProperties,
    subscriptions
  ]
})

const playground = createComponent({
  _type: 'div',
  children: [
    homeButton
  ]
})

const container = createComponent({
  _type: 'div',
  className: 'container',
  children: [
    route('/examples/docs', home),
    route('/examples/docs/playground', playground)
  ]
})

const root2 = document.querySelector('#root')
renderApp(root2, [container])
