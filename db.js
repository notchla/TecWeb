const mongoose = require("mongoose")
const {connectionString} = require("./config").mongo

const User = require("./models/user")
const Story = require("./models/story")

if(!connectionString){
    console.error("MongoDB connection string missing!")
    process.exit(1)
}

mongoose.connect(connectionString, {useUnifiedTopology: true, useNewUrlParser:true})
const db = mongoose.connection
db.on("error", err => {
    console.error("MongoDB error: "+ err.message)
    process.exit
})
db.once("open", () => console.log("mongoDB connection established"))

Story.find((err, stories) => {
    if(err) return console.error(err)
    if(stories.length) return

    new Story({
        title: "example1",
        pages: 3,
        content: [{"type": "description", "data": {"data": "this is a description"}, "js_completed": "/js/description.js"}, {"type": "description", "data": {"data": "this is another description"}, "js_completed": "/js/description.js"}, {"type": "description", "data": {"data": "fine"}, "js_completed": "/js/end.js"}]
    }).save()
})

module.exports = {
    getUsers: async (options = {}) => User.find(options),
    saveUser: async (username, id) => {
         await User.updateOne(
             { id },
             { username : username},
             {upsert: true}
            )
    },
    getStories: async (options = {}, fields = "") => Story.find(options, fields),
}