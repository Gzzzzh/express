const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ChatRecordSchema = new Schema({
  fromId: {
    type: Schema.Types.ObjectId,
    ref: 'users'
  },
  toId: {
    type: Schema.Types.ObjectId,
    ref: 'users'
  },
  msgBody: {
    type: Object
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createAt: {
    type: Date,
    default : Date.now
  }
})

module.exports = mongoose.model("chatRecords", ChatRecordSchema)