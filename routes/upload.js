const uploadToken = require('../service/qiniu')
const route = require('express').Router()

route.get('/getUploadToken', (req, res) => {
  res.json({
    code: 200,
    data: uploadToken
  })
})

module.exports = route