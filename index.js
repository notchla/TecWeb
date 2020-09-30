/*IMPLEMENTATION IDEAS:
    use partials to render the answer buttons in storyview
*/


var express = require("express")

var app = express();

const handlers = require("./lib/handlers")

var expressHandlebars = require("express-handlebars")

const credentials = require("./credentials")

const cookieParser = require("cookie-parser")

const expressSession = require("express-session");

const flashMiddleware = require("./lib/middleware/flash");

const bodyParser = require("body-parser");

const usernameSession = require("./lib/middleware/username")

const fs = require("fs")

const morgan = require("morgan")

switch(app.get("env")){
    case "development":
        app.use(morgan("dev"))
        break
    case "production":
        const stream = fs.createWriteStream(__dirname + "/access.log", {flags: "a"})
        app.use(morgan("combined", {stream}))
        break
}

app.engine("handlebars", expressHandlebars({
    defaultLayout : "main",
    helpers: {
        section: function(name, options){ //helper function to use sections in views
            if(!this._sections) this._sections = {}
            this._sections[name] = options.fn(this);
            return null
        }
    }
}));

app.set("view engine", "handlebars")

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.use(cookieParser(credentials.cookieSecret))
//cookie middleware MUST be before session 
app.use(expressSession({
    resave: false,
    saveUninitialized: false,
    secret: credentials.cookieSecret,
}))

app.use(express.static(__dirname + "/public")); //static middleware

app.use(flashMiddleware)

app.use(usernameSession); //check for username in session

const port = process.env.PORT || 3000 //if the enviroment variable isn't setted, port is 3000


app.get("/", handlers.home);

app.get("/stories/:storyname", handlers.loadStory);

app.get("/stories/json/:storyname", handlers.loadJson);

app.get("/stories/template/:templatename", handlers.loadTemplate);

app.get("/checkqr/:code", handlers.checkStoryExists);

app.post("/register-user", handlers.registerUser);

app.use(handlers.notFound); // need to be after all others routing handlers

app.use(handlers.serverError); //called when a function throws a new Error() and nothing intercept it


function startServer(port){
    app.listen(port, () => {
        console.log(`Express started in ${app.get('env')} mode at http://localhost:${port}`)
    })
}

if(require.main === module){
    startServer(process.env.PORT || 8000)
}
else{
    module.exports = startServer
}

