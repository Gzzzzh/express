var express = require('express');
var router = express.Router();
const jwt = require('../service/jwt')
const Users = require('../models/users')

/* GET users listing. */
router.post('/info', async function(req, res, next) {
  const openId = req.info.openId
  Users.findOne({openId}, (err, data) => {
    if(err || data === null) return res.status(500)
    else return res.json({
      code: 200,
      data
    })
  })
});


module.exports = router;
