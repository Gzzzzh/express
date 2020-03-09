var express = require('express');
var router = express.Router();
const jwt = require('../service/jwt')
const wx = require('../service/wx')
const Users = require('../models/users')

/* GET users listing. */
router.post('/login', async function(req, res, next) {
  const {phone, code, nickName, gender, avatarUrl} = req.body
  if(!code || !phone || !nickName || !gender || !avatarUrl ) return res.sendStatus(500)
  const loginRes = await wx.code2Session(code)
  console.log('loginRes', loginRes);
  if (loginRes.errcode) {
    return res.json({
      code: 200,
      msg: loginRes.errmsg
    })
  } else {
    // 存手机和openid进数据库
    Users.findOne({ openId: loginRes.openid }, async (err, data) => {
      if (err || data === null) {
        console.log('没有注册');
        var params = { openId: loginRes.openid, phone, nickName, gender, avatarUrl }
        const user = new Users(params)
        await user.save()
      }
      let token = await jwt.setToken(loginRes.openid, loginRes.session_key)
      return res.json({
        code: 200,
        data: {
          token,
          ...params
        }
      })
    })

  }
});


module.exports = router;
