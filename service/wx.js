const axios = require('axios')

module.exports = {
  appId: 'wx7fd6739e7f85db52',
  appSecret: 'a6bdb6d02c7e5bcb5cc5af90202e3bde',
  code2Session (code) {
    return new Promise(resolve => {
      axios.post(`https://api.weixin.qq.com/sns/jscode2session?appid=${this.appId}&secret=${this.appSecret}&js_code=${code}&grant_type=authorization_code`).then(res => {
        console.log('code2Session>>>', res.data);
        resolve(res.data)
      })
    })
  }
}