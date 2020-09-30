const mongoose = require("mongoose")
const {connectionString} = require("./config").mongo

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