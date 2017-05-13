const input = createComponent({
  _type: 'input',
  onkeyup (e) {
    this.value = e.target.value
  }
})

const buttonNext = createComponent({
  _type: 'button',
  onclick () {
    locationManager.push('/path')
  },
  children: [{ _type: 'text', content: 'NEXT' }]
})

const buttonPrev = createComponent({
  _type: 'button',
  onclick () {
    // console.log('PREV')
  },
  children: [{ _type: 'text', content: 'PREV' }]
})

const div = createComponent({
  _type: 'div',
  _id: 'div',
  _path: '/gruu.html',
  children: [{
    _type: 'text',
    _id: 'dd',
    __content: () => `This is just a text ${input.value || ''}`
  }]
}, input)

const div2 = createComponent({
  _type: 'div',
  children: [{ _type: 'text', content: 'This is just a text2' }]
})

const ul = createComponent({
  _type: 'ul',
  state: {
    data: [
      { id: 1, name: 'John', age: 35 },
      { id: 2, name: 'Tom', age: 76 },
      { id: 3, name: 'Jackie', age: 23 },
      { id: 4, name: 'Mike', age: 24 }
    ]
  },
  __children () {
    return this.state.data.map(li => createComponent({
      _type: 'li',
      children: [
        { _type: 'text', content: `Id: ${li.id}, Name: ${li.name}` },
        {
          _type: 'button',
          onclick () {
            locationManager.push(`/user/${li.id}`)
          },
          children: [{ _type: 'text', content: 'details' }]
        }
      ]
    }))
  }
})

const details = createComponent({
  _type: 'div',
  _id: 'details',
  _path: '/user/:id',
  __children () {
    const user = ul.state.data.find(v => v.id === parseInt(this.params.id, 10))
    return [{ _type: 'text', content: user && `Id: ${user.id}, Name: ${user.name}, Age: ${user.age}` }]
  }
})

const container = document.querySelector('#root')
renderApp(container, [input, buttonPrev, buttonNext, div, div2, ul, details])
