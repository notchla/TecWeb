const {v4: uuidv4} = require("uuid")
const db = require("../../db")

module.exports = async (req, res, next) => {
    if(!req.session.sessionID){
        var uuid = uuidv4()
        req.session.sessionID = uuid
        await db.saveUser(req.session.userName, uuid)
    }
    next()
}