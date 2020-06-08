const mongoose = require('mongoose')
const Schema = mongoose.Schema
const time = require('../Libs/timeLib')

const AuthModel = new Schema({
  userId: {
    type: String
  },
  authToken: {
    type: String
  },
  tokenSecret: {
    type: String
  },
  tokenGenerationTime: {
    type: Date,
    default: time.now()
  }
})

module.exports = mongoose.model('Auth', AuthModel)
