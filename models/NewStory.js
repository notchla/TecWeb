const mongoose = require("mongoose");

const storySchema = mongoose.Schema({
  title: String,
  pages: Number,
  adj: [],
  nodes: [],
  css: { type: {
    color: {type: String },
    font: {type: String },
    style: {type: String }
  }},
  published: Boolean
});

const NewStory = mongoose.model("newstory", storySchema);
module.exports = NewStory;
