const mongoose = require('mongoose')
const Schema = mongoose.Schema

const applySchema = new Schema({
  fromId: {
    type: Schema.Types.ObjectId,
    ref: 'users'
  },
  toId: {
    type: Schema.Types.ObjectId,
    ref: 'users'
  },
  status: { // 1申请中 2通过 3拒绝 4删除
    type: Number,
    default: 1
  },
  applyRemark: {
    type: String
  },
  createAt: {
    type: Date,
    default : Date.now
  },
  updatedAt: {
    type: Date,
    default : Date.now
  }
})

module.exports = mongoose.model("apply", applySchema)