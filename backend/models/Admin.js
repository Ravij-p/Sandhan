// models/Admin.js
const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Admin", adminSchema);
