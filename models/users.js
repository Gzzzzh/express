const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = new Schema({
  openId: {
    type: String,
    unique: true
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
  birthday: {
    type: String,
    default: '2020-01-01'
  },
  photos: {
    type: Array
  },
  sign : {
    type: String
  },
  isOnline: {
    type: Boolean,
    default: true
  },
  createAt: {
    type: Date,
    default : Date.now
  }
})

module.exports = mongoose.model("users", UserSchema)