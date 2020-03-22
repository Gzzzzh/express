var express = require('express');
var router = express.Router();
const Users = require('../models/users')
const Friends = require('../models/friends')

/* GET home page. */
router.get('/searchFriends', async function(req, res, next) {
  const openId = req.info.openId
  let { page = 1, limit = 20, keyWord = '' } = req.query
  const params = { 
    $or: [
      {phone: { $regex: new RegExp(`${keyWord}`, 'ig') }},
      {nickName: { $regex: new RegExp(`${keyWord}`, 'ig') }},
    ],
    "openId": {
      $nin: [openId],
    }
  }
  const data = await Users.collection.find(params).skip((+page - 1) * 10).limit(+limit).toArray()
  const total = await Users.collection.find(params).count();
  res.json({
    code: 200,
    data: {
      list: data,
      size: limit,
      pages: Math.ceil(total/limit),
      current: page,
      total
    }
  })
})

router.get('/list', async (req, res) => {
  try {
    const openId = req.info.openId
    const user = await Users.findOne({openId}).exec()
    let FriendList = (await Friends.find({fromId: user._id}, {_id: 0, __v: 0, fromId: 0}).populate({path: 'toId', select:'-_id -__v'}).exec()) || []
    FriendList = FriendList.map(item => {
      return {
        createAt: item.createAt,
        ...item._doc,
        isFriend: true
      }
    })
    return res.json({
      code: 200,
      data: FriendList
    })
  } catch (error) {
    return res.json({
      code: 1000,
      msg: error.toString()
    })
  }
})


module.exports = router;
