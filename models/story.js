const mongoose = require("mongoose")

const storySchema = mongoose.Schema({
    title: String,
    pages: Number,
    content: []
})

const Story = mongoose.model("story", storySchema)
module.exports = Story