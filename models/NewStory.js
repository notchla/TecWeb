const mongoose = require("mongoose");

const storySchema = mongoose.Schema({
  title: String,
  pages: Number,
  adj: [],
  nodes: [],
});

const NewStory = mongoose.model("newstory", storySchema);
module.exports = NewStory;
