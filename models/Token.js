//this file created when we want to have 2 tokens (2 cookies): accessToken and refreshToken
//this is a refreshToken
const mongoose = require("mongoose");

const TokenSchema = new mongoose.Schema({
  refreshToken: {
    type: String,
    required: true,
  },
  ip: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
    required: true,
  },
  isValid: {
    type: Boolean,
    default: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
},{timestamps:true});

module.exports = mongoose.model('Token', TokenSchema)