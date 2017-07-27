const exmpleComponents = `
<pre>
<k>const</k> hello = <f>createComponent</f>({
  <c>_type</c>: 'span',
  <c>id</c>: 'hello-world',
  <c>textContent</c>: 'Hello World!'
})

<k>const</k> container = <f>createComponent</f>({
  <c>_type</c>: 'div',
  <c>className</c>: 'container',
  <c>children</c>: [hello, {
    <c>_type</c>: 'p',
    <c>textContent</c>: 'Hello Again :)'
  }]
})
</pre>`

const exmpleComponentsHTML = `
<div class="container">
    <span id="hello-world">
        Hello World!
    </span>
    <p>
        Hello Again :)
    </p>
</div>
`

const domComponentExample = `
<pre>
<k>const</k> hello = <f>createComponent</f>({
  <c>_type</c>: 'div',
  <c>textContent</c>: 'Hello World!'
})
</pre>
`

const phantomComponentExample = `
<pre>
<k>const</k> phantom = <f>createComponent</f>({
  // no _type property
  children: [{
    <c>_type</c>: 'div',
    <c>textContent</c>: 'Inside phantom!'
  }]
})
</pre>
`

const changingPropertiesExample = `
<pre>
<k>const</k> counter = <f>createComponent</f>({
  <c>_type</c>: 'div',
  <c>textContent</c>: 10
})

<k>const</k> button = (text, diff) => <f>createComponent</f>({
  <c>_type</c>: 'button',
  <c>className</c>: 'button',
  <c>textContent</c>: text,
  <c>onclick</c> () {
    counter<c>.textContent</c> += diff
  }
})

<k>const</k> buttonInc = <f>button</f>('+', 1)
<k>const</k> buttonDec = <f>button</f>('-', -1)

<k>const</k> app = <f>createComponent</f>({
  <c>_type</c>: 'div',
  <c>className</c>: 'app',
  <c>children</c>: [
    'Counter',
    {
      <c>_type</c>: 'div',
      <c>children</c>: [buttonDec, counter, buttonInc]
    }
  ]
})
</pre>`


const todoAppCode = `
<pre>
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
  }
})

const todo = createComponent({
  _type: 'ul',
  $children: () => store.state.todo.map(item => ({
    _type: 'li',
    textContent: item
  }))
})

const container = createComponent({
  _type: 'div',
  children: [input, addButton, todo]
})

const root = document.querySelector('#root')
renderApp(root, [container])
</pre>`
