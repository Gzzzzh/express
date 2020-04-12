var express = require('express');
var router = express.Router();
const Users = require('../models/users')
const Friends = require('../models/friends')
const Circles = require('../models/circles')

router.get('/list', async (req, res) => {
  const openId = req.info.openId
  const user = await Users.findOne({openId}).exec()
  const friendList = await Friends.find({fromId: user._id}).populate({path: 'toId'}).exec()
  let idList = [user._id]
  friendList.forEach(item => {
    idList.push(item.toId._id)
  })
  const circle = await Circles.find({fromId: {
    $in: idList
  }}, {__v: 0}).populate({path: 'fromId', select: 'openId avatarUrl nickName -_id'}).sort({createAt: -1}).exec()
  res.json({
    code: 200,
    data: circle
  })
})


module.exports = router;