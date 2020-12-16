const mongoose = require("mongoose");

const ActiveUserSchema = mongoose.Schema({
  username: String,
  id: String,
  story: String,
  activity: Number,
});

const ActiveUser = mongoose.model("activeUser", ActiveUserSchema);
module.exports = ActiveUser;
