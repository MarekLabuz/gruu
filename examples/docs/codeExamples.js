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


const subscriptionsExample = `
<pre>
<k>const</k> store = <f>createComponent</f>({
  <c>state</c>: {
    <c>data</c>: [['john', 'smith', 34], ['michael', 'smith', 34]]
  }
})

<k>const</k> addJaneButton = <f>createComponent</f>({
  <c>$children</c>: () => [store.state.data.length < 5 && {
    <c>_type</c>: 'button',
    <c>textContent</c>: 'Add Jane',
    <c>onclick</c> () {
      store<c>.state.data.push</c>(
        ['Jane', 'Forest', Math.floor(Math.random() * 25) + 18]
      )
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

const app = createComponent({
  _type: 'div',
  children: [addJaneButton, table]
})
</pre>`
