const mongoose = require('mongoose')
const Schema = mongoose.Schema

const circleSchema = new Schema({
  fromId: {
    type: Schema.Types.ObjectId,
    ref: 'users'
  },
  type: {
    type: Number
  },
  content: {
    type: String
  },
  video: {
    type: String
  },
  photos: {
    type: Array,
    default: []
  },
  like: {
    type: Array,
    default: []
  },
  comments: {
    type: Array,
    default: []
  },
  createAt: {
    type: Date,
    default : Date.now
  }
})

module.exports = mongoose.model("circle", circleSchema)