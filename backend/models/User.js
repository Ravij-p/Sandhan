// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  surname: String,
  mobile: { type: String, unique: true },
  username: { type: String, unique: true },
  rollNumber: { type: String, unique: true, sparse: true },
  isVerified: { type: Boolean, default: false },
  password: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
