const jwt = require('jsonwebtoken')
module.exports = {
  signkey: 'gzhxhxl',
  setToken (openId, sessionKey) {
    return new Promise(resolve => {
      const token = jwt.sign({
        openId,
        sessionKey
      }, this.signkey, { expiresIn:  60 * 60 * 24 * 7 })
      console.log('setToken', token);
      resolve(token)
    })
  },
  verToken (token) {
    return new Promise(resolve => {
      try {
        const info = jwt.verify(token,this.signkey)
        console.log('verToken', info);
        resolve(info)
      } catch (error) {
        resolve(error)
      }
    })
  }
}