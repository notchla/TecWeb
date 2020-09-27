module.exports = (req, res, next) => {
    if(!req.session.userName && req.url != "/register-user"){
        res.locals.flash = {
            type: "danger",
            intro: "Username not Setted",
            message: "please insert a valid username",
        }
    }
    next()
}