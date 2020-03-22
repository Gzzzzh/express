var express = require('express');
var router = express.Router();
const Users = require('../models/users')
const ChatRecords = require('../models/chatRecords')

router.get('/list', async function(req, res, next) {
  const openId = req.info.openId
  const user = await Users.findOne({openId}).exec()
  let list = (await ChatRecords.find({toId: user._id}, {__v: 0}).populate({path: 'fromId toId', select: '-__v'}).sort({createAt: -1}).exec()) || []
  var obj = {}
  var arr = []
  list.forEach(item => {
    if (obj[item.fromId + item.toId]) {
      const index = arr.findIndex(item1 => item1.fromId === item.fromId && item1.toId === item.toId )
      if(index !== -1) {
        !item.isRead && arr[index]._doc.unReadCounts++
      }
    } else {
      obj[item.fromId + item.toId] = true
      item._doc.unReadCounts = item.isRead ? 0 : 1
      arr.push(item)
    }
  })
  return res.json({
    code: 200,
    data: arr
  })
})

router.get('/records', async (req, res) => {
  const openId = req.info.openId
  const toId = req.query.toId
  const fromUser = await Users.findOne({ openId }).exec()
  const toUser = await Users.findOne({ openId: toId }).exec()
  await ChatRecords.updateMany({ fromId: toUser._id, toId: fromUser._id, isRead: false }, {
    $set: {
      isRead: true
    }
  })
  const list = (await ChatRecords.find({
    $or: [
      {
        $and: [{ fromId: fromUser._id, toId: toUser._id }]
      },
      {
        $and: [{ fromId: toUser._id, toId: fromUser._id }]
      }
    ]
  },{ __v: 0 }).sort({createAt: -1}).exec()) || []
  return res.json({
    code: 200,
    data: {
      list
    }
  })
})

module.exports = router;