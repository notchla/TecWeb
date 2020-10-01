const mongoose = require("mongoose")
const {connectionString} = require("./config").mongo

const User = require("./models/user")

const {v4: uuidv4} = require("uuid")

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


//test seeding dummy data
User.find((err, users) => {
    if(err) return console.error(err)
    if(users.length) return

    new User({
        username: "user1",
        id : uuidv4()
    }).save()

    new User({
        username: "user2",
        id : uuidv4()
    }).save()
})

module.exports = {
    getUsers: async (options = {}) => User.find(options),
}