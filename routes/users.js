var express = require('express');
var router = express.Router();
const Users = require('../models/users')
const Friends = require('../models/friends')

/* GET users listing. */
router.get('/info', async function(req, res, next) {
  const openId = req.info.openId
  Users.findOne({openId}, (err, data) => {
    if(err || data === null) return res.status(500)
    else return res.json({
      code: 200,
      data
    })
  })
})

router.post('/saveMyInfo', async function(req, res, next) {
  const openId = req.info.openId
  Users.findOne({openId}, async (err, data) => {
    if(err || data === null) return res.status(500)
    await Users.collection.updateOne({openId}, {
      $set: {
        "avatarUrl": req.body.avatarUrl,
        "birthday": req.body.birthday,
        "gender": req.body.gender,
        "nickName": req.body.nickName,
        "sign": req.body.sign,
        "photos": req.body.photos
      }
    })
    return res.json({
      code: 200,
      data: req.body
    })
  })
})

router.get('/shareInfo', async function(req, res, next) {
  const openId = req.info.openId // 本人
  const fromId = req.query.fromId // 对方
  Users.findOne({openId: fromId}, async (err, data) => {
    if(err || data === null) return res.status(500)
    else {
      const user = await Users.findOne({openId}).exec()
      const isFriend = !! (await Friends.findOne({fromId: data._id, toId: user._id}).exec())
      return res.json({
        code: 200,
        data: {
          ...data._doc,
          isFriend
        }
      })
    }
  })
})


module.exports = router;
