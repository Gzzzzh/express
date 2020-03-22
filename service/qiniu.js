const qiniu = require('qiniu')

// 创建上传凭证
const accessKey = 'MVJN7qMj5nmhbGt2xrErNnsrRCDDEUARh-YSD4GB'
const secretKey = '9GMKkGmfif-B2Qi05aCxevsuHRPPKwcRmioC5C2V'
const mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
const option = {
  scope: 'gzh19970716',
  expires: 7200
}

const putPolicy = new qiniu.rs.PutPolicy(option)
const uploadToken = putPolicy.uploadToken(mac)

module.exports = uploadToken
