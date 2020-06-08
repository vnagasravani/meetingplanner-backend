const mongoose = require('mongoose')
const Schema = mongoose.Schema
const time = require('../Libs/timeLib')

const adminAuthModel = new Schema({
  adminId: {
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

module.exports = mongoose.model('adminAuth', adminAuthModel)
