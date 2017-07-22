const gruuTitle = createComponent({
  _type: 'h1',
  textContent: 'Gruu'
})

const generalDescription = createComponent({
  _type: 'section',
  textContent: 'Gruu is a JavaScript framework for creating Single Page Applications quickly'
})

const general = createComponent({
  _type: 'div',
  children: [
    gruuTitle,
    generalDescription
  ]
})

const componentsDescription = createComponent({
  _type: 'section',
  innerHTML: `
    <h2>Everything is a Component</h2>
    Gruu is highly composable. Using components you can describe simple parts of html as well as complex ones.
    There are two kinds of components: <b>DOM Components</b> and <b>Phantom Components</b>.
  `
})

const domComponentExample = `
<pre>
const hello = createComponent({
    _type: 'div',
    textContent: 'Hello World!'
})
</pre>
`

const phantomComponentExample = `
<pre>
const phantom = createComponent({
    children: [{
        _type: 'div',
        textContent: 'Inside phantom!'
    }]
})
</pre>
`

const componentsComparision = createComponent({
  _type: 'div',
  children: [
    componentsDescription,
    {
      _type: 'div',
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
    'Property _type is where you place a tag name, it determines whether the component is DOM or Phantom.'
  ]
})

const changingPropertiesExample = `
<pre>
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

const app = createComponent({
  _type: 'div',
  className: 'app',
  children: [
    'Counter',
    {
      _type: 'div',
      children: [buttonDec, counter, buttonInc]
    }
  ]
})
</pre>`

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
  _type: 'div',
  children: [
    { _type: 'h2', textContent: 'Changing properties' },
    'You can manually change properties of components. Then the changes will be automatically applied to DOM elements.',
    {
      _type: 'div',
      className: 'changing-properties',
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
    'Each time you click a button the textContent of the counter component is going to be increased or decreased - ',
    'it depends on what button you click. Component button is a factory that creates both buttonInc and buttonDec.'
  ]
})

const subscriptionsExample = `
<pre>
const counter = createComponene({

})
</pre>`

const subscriptions = createComponent({
  _type: 'div',
  children: [
    {
      _type: 'h2',
      textContent: 'Subscriptions'
    }
  ]
})

const container = createComponent({
  _type: 'div',
  className: 'container',
  children: [general, componentsComparision, changingProperties, subscriptions]
})

const root = document.querySelector('#root')
renderApp(root, [container])
