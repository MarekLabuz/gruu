const questionsContainer = createComponent({
  _type: 'div',
  className: 'questions-container',
  state: {
    currentQuestion: 0,
    questions: []
  },
  __style () {
    return {
      left: `-${this.state.currentQuestion * 100}vw`
    }
  },
  __children () {
    return this.state.questions.map(question => ({
      _type: 'div',
      className: 'question',
      children: [{ _type: 'text', content: question.text }]
    }))
  }
})

const button = change => createComponent({
  _type: 'button',
  style: { zIndex: 100, position: 'fixed', left: `calc(50% + ${change * 50}px)`, top: '50%' },
  onclick () {
    questionsContainer.state.currentQuestion += change
  },
  children: [{ _type: 'text', content: change > 0 ? 'NEXT' : 'PREV' }]
})

const root = createComponent({
  _type: 'div',
  className: 'root',
  children: [questionsContainer, button(1), button(-1)]
})

const container = document.querySelector('#root')
renderApp(container, [root])

const getQuestions = () => {
  fetch('/questions.json')
    .then(response => response.json())
    .then((data) => {
      questionsContainer.state.questions = data
    })
}

getQuestions()
