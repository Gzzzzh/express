const mongoose = require('mongoose')
const Schema = mongoose.Schema

const FrinensSchema = new Schema({
  fromId: {
    type: Schema.Types.ObjectId,
    ref: 'users'
  },
  toId: {
    type: Schema.Types.ObjectId,
    ref: 'users'
  },
  createAt: {
    type: Date,
    default : Date.now
  }
})

module.exports = mongoose.model("friends", FrinensSchema)