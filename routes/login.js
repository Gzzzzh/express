var express = require('express');
var router = express.Router();
const jwt = require('../service/jwt')
const wx = require('../service/wx')
const Users = require('../models/users')

/* GET users listing. */
router.post('/login', async function(req, res, next) {
  try {
    const {phone, code, nickName, gender, avatarUrl} = req.body

    if(!code || !phone || !nickName || !gender || !avatarUrl ) return res.sendStatus(500)
    const loginRes = await wx.code2Session(code)
    if (loginRes.errcode) {
      return res.json({
        code: 500,
        msg: loginRes.errmsg
      })
    } else {
      var params = { openId: loginRes.openid, phone, nickName, gender, avatarUrl }
      Users.findOne({ openId: loginRes.openid }, async (err, data) => {
        if (err || data === null) {
          console.log('没有注册');
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
  } catch (error) {
    res.json({
      code: 500,
      msg: error.toString()
    })
  }
});


module.exports = router;
