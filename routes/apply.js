var express = require('express');
var router = express.Router();
const Users = require('../models/users')
const Apply = require('../models/apply')

router.get('/applyList', async function(req, res, next) {
  const openId = req.info.openId
  const user = await Users.findOne({openId})
  const params = { 
    "status": {
      $in: [1],
    },
    "toId": {
      $in: [user._id],
    }
  }
  const data = await Apply.find(params).populate({path: 'fromId toId'}).sort({updatedAt: -1})
  res.json({
    code: 200,
    data: {
      list: data,
      total: data.length
    }
  })
})

router.get('/applyRecord', async function(req, res, next) {
  const openId = req.info.openId
  const user = await Users.findOne({openId})
  const params = { 
    $or: [
      { fromId: user._id },
      { toId: user._id }
    ]
  }
  const data = await Apply.find(params).populate({path: 'fromId toId', select: 'nickName'}).sort({updatedAt: -1})
  res.json({
    code: 200,
    data: {
      list: data,
      total: data.length
    }
  })
})

router.get('/rejectApply', async function(req, res, next) {
  const id = req.query.id
  await Apply.findByIdAndUpdate(id, {
    $set: {
      status: 3,
      updatedAt: Date.now()
    }
  }).exec()
  res.json({
    code: 200,
    msg: 'success'
  })
})

module.exports = router;