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
    { _type: 'h2', textContent: 'Component' }
  ]
})

const componentsComparision = createComponent({
  _type: 'section',
  children: [
    { _type: 'h2', textContent: 'DOM vs Phantom Components' },
    {
      _type: 'p',
      innerHTML: `Gruu is highly composable. Using components you can describe simple parts of html as well
        as complex ones. There are two kinds of components: <b>DOM Components</b> and <b>Phantom Components</b>`
    },
    {
      _type: 'p',
      className: 'dom-vs-phantom',
      children: [
        {
          _type: 'div',
          innerHTML: `
            <span>DOM Components</span>
            <p>They are components that have their representaion in the HTML DOM</p>
            ${domComponentExample}
          `
        },
        {
          _type: 'div',
          innerHTML: `
            <span>Phantom Components</span>
            <p>They are components that exist in Gruu Virtual DOM, but are transparent to the HTML DOM</p>
            ${phantomComponentExample}
          `
        }
      ]
    },
    {
      _type: 'p',
      textContent: 'Property _type is where you place a tag name, it determines whether the component is ' +
        'DOM or Phantom.'
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
  }
})

const buttonInc = button('+', 1)
const buttonDec = button('-', -1)

const changingPropertiesApp = createComponent({
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

const changingProperties = createComponent({
  _type: 'section',
  children: [
    { _type: 'h2', textContent: 'Changing properties' },
    {
      _type: 'p',
      textContent: 'You can manually change properties of components. Then the changes will be automatically ' +
        'applied to DOM elements.'
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
          children: [changingPropertiesApp]
        }
      ]
    },
    {
      _type: 'p',
      textContent: `Each time you click a button the textContent of the counter component is going to be increased 
      or decreased - it depends on what button you click. Component button is a factory that creates both 
      buttonInc and buttonDec.`
    }

  ]
})

const store = createComponent({
  state: {
    data: [['john', 'smith', 34], ['michael', 'smith', 34]]
  }
})

const addJaneButton = createComponent({
  $children: () => [store.state.data.length < 5 && {
    _type: 'button',
    textContent: 'Add Jane',
    onclick () {
      store.state.data.push(['Jane', 'Forest', Math.floor(Math.random() * 25) + 18])
    }
  }]
})

const table = createComponent({
  _type: 'table',
  children: [
    {
      _type: 'thead',
      children: [
        { _type: 'th', textContent: 'first name' },
        { _type: 'th', textContent: 'last name' },
        { _type: 'th', textContent: 'age' },
        { _type: 'th', textContent: '' }
      ]
    },
    {
      _type: 'tbody',
      $children: () => store.state.data.map((row, i) => ({
        _type: 'tr',
        children: [
          ...row.map(item => ({ _type: 'td', textContent: item })),
          {
            _type: 'td',
            children: [store.state.data.length > 1 && {
              _type: 'button',
              textContent: 'X',
              onclick () {
                store.state.data = [
                  ...store.state.data.slice(0, i),
                  ...store.state.data.slice(i + 1)
                ]
              }
            }]
          }
        ]
      }))
    }
  ]
})

const subscriptionsApp = createComponent({
  _type: 'div',
  children: [addJaneButton, table]
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
          children: [subscriptionsApp]
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

const root = document.querySelector('#root')
renderApp(root, [container])
