const express = require('express')
const history = require('connect-history-api-fallback')

const app = express()
  .use(history({
    index: '/gruu.html'
  }))

app.use(express.static('public'))

app.listen(3000, () => {
  console.log('Listening on port 3000')
})
