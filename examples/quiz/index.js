const userAnswers = {}

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
    return this.state.questions
  }
})

const button = change => createComponent({
  _type: 'button',
  className: change > 0 ? 'button-next' : 'button-prev',
  onclick () {
    const cQ = questionsContainer.state.currentQuestion
    const q = questionsContainer.state.questions
    if ((cQ < q.length - 1 && change > 0) || (cQ > 0 && change < 0)) {
      questionsContainer.state.currentQuestion += change
    }
  },
  children: [{ _type: 'text', content: change > 0 ? 'NEXT' : 'PREV' }]
})

const buttonsContainer = (index, length) => createComponent({
  _type: 'div',
  className: 'buttons-container',
  children: [index !== 0 && button(-1), index < length - 1 && button(1)]
})

const createAnswer = (answer, questionId) => createComponent({
  _type: 'label',
  style: { display: 'flex', alignItems: 'center' },
  children: [
    {
      _type: 'input',
      type: 'radio',
      name: `answer-${questionId}`,
      onchange () {
        userAnswers[questionId] = answer.id
        console.log(userAnswers)
      }
    },
    {
      _type: 'span',
      children: [{ _type: 'text', content: answer.text }]
    }
  ]
})

const questionText = question => createComponent({
  _type: 'div',
  className: 'question-text',
  children: [
    { _type: 'span', children: [{ _type: 'text', content: question.text }] },
    {
      _type: 'div',
      style: { display: 'flex', flexDirection: 'column' },
      children: question.answers.map(v => createAnswer(v, question.id))
    }
  ]
})

const createQuestion = (question, index, length) => createComponent({
  _type: 'div',
  className: 'question',
  children: [
    questionText(question),
    buttonsContainer(index, length)
  ]
})

const exitButton = createComponent({
  _type: 'button',
  className: 'exit-button',
  onclick () {
    questionsContainer.state.currentQuestion = questionsContainer.state.questions.length
  },
  children: [{ _type: 'text', content: 'EXIT' }]
})

const navigationButton = index => createComponent({
  _type: 'button',
  children: [{ _type: 'text', content: index + 1 }],
  onclick () {
    questionsContainer.state.currentQuestion = index
  }
})

const questionsNavigation = () => createComponent({
  _type: 'div',
  _id: 'questionsNavigation',
  className: 'questions-navigation',
  __children () {
    return questionsContainer.state.questions.map((question, i) => navigationButton(i))
  }
}, questionsContainer)

const root = createComponent({
  _type: 'div',
  className: 'root',
  children: [questionsContainer, questionsNavigation(), exitButton]
})

const container = document.querySelector('#root')
renderApp(container, [root])

const getQuestions = () => {
  fetch('/examples/quiz/questions.json')
    .then(response => response.json())
    .then((data) => {
      const length = data.length
      questionsContainer.state.questions = data.map((q, i) => createQuestion(q, i, length))
    })
}

getQuestions()
