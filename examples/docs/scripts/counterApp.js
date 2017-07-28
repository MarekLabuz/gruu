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

const counterApp = createComponent({
  _type: 'div',
  className: 'counter-app',
  children: [
    'Counter',
    {
      _type: 'div',
      children: [buttonDec, counter, buttonInc]
    }
  ]
})

const counterContainer = document.querySelector('.counter-app')
renderApp(counterContainer, [counterApp])
