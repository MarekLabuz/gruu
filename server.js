const express = require('express')

const app = express()

app.get('/examples/:example/*.(js|css|json|png)', (req, res) => {
  res.sendFile(`${__dirname}${req.originalUrl}`)
})

app.get('/examples/:example*', (req, res) => {
  res.sendFile(`${__dirname}/examples/${req.params.example}/index.html`)
})

app.use(express.static('src'))

app.listen(3000, '0.0.0.0', () => {
  console.log('Listening on port 3000')
})
