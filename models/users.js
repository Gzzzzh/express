const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = new Schema({
  openId: {
    type: String
  },
  phone: {
    type: String
  },
  gender: {
    type: String
  },
  nickName: {
    type: String
  },
  avatarUrl: {
    type: String
  },
  createAt: {
    type: Date,
    default : Date.now()
  }
})

module.exports = mongoose.model("users", UserSchema)