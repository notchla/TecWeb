const mongoose = require("mongoose")
const {connectionString} = require("./config").mongo

const User = require("./models/user")

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

module.exports = {
    getUsers: async (options = {}) => User.find(options),
    saveUser: async (username, id) => {
         await User.updateOne(
             { id },
             { username : username},
             {upsert: true}
            )
    },
}