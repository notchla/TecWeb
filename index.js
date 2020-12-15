/*IMPLEMENTATION IDEAS:
    use partials to render the answer buttons in storyview
*/

var express = require("express");

var app = express();

const handlers = require("./lib/handlers");

var expressHandlebars = require("express-handlebars");

const credentials = require("./config");

const cookieParser = require("cookie-parser");

const expressSession = require("express-session");

const redis = require("redis");

let RedisStore = require("connect-redis")(expressSession);
let redisClient = redis.createClient({
  url: credentials.redis.url,
});
redisClient.on("error", console.log);

const flashMiddleware = require("./lib/middleware/flash");

const sessionIDMiddleware = require("./lib/middleware/sessionID");

const bodyParser = require("body-parser");

const usernameSession = require("./lib/middleware/username");

const fs = require("fs");

const morgan = require("morgan");

require("./db");

switch (app.get("env")) {
  case "development":
    app.use(morgan("dev"));
    break;
  case "production":
    const stream = fs.createWriteStream(__dirname + "/access.log", {
      flags: "a",
    });
    app.use(morgan("combined", { stream }));
    break;
}

app.engine(
  "handlebars",
  expressHandlebars({
    defaultLayout: "main",
    helpers: {
      section: function (name, options) {
        //helper function to use sections in views
        if (!this._sections) this._sections = {};
        this._sections[name] = options.fn(this);
        return null;
      },
    },
  })
);

app.set("view engine", "handlebars");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser(credentials.cookieSecret));
//cookie middleware MUST be before session
app.use(
  expressSession({
    resave: false,
    saveUninitialized: false,
    secret: credentials.cookieSecret,
    store: new RedisStore({ client: redisClient }),
  })
);

app.use(express.static(__dirname + "/public")); //static middleware

app.use(flashMiddleware);

app.use(usernameSession); //check for username in session

app.use(sessionIDMiddleware);

//load home with qr code
app.get("/", handlers.home);

app.post("/registeruser", handlers.registerUser);

app.get("/createstory", (req, res) => res.render("storycreate"));


//load the story called storyname
app.get("/stories/get/:storyname", handlers.loadStory);

//return the json representing the story called storyname
app.get("/stories/json/:storyname", handlers.loadJson);

app.post("/stories/registerstory", handlers.registerStory);

app.get("/stories/exists/:code", handlers.checkStoryExists);

app.get("/stories/getnames/", handlers.getStoryList);

app.get("/stories/delete/:title", handlers.deleteStory);


//return the activity template
app.get("/templates/get/:templatename", handlers.loadTemplate);

app.get("/templates/getnames", handlers.getActivities);

app.get("/templates/forms/:type", handlers.getActivityForm);

app.get("/minigames/get/:gamename", handlers.loadGame);



app.use(handlers.notFound); // need to be after all others routing handlers

app.use(handlers.serverError); //called when a function throws a new Error() and nothing intercept it

function startServer(port) {
  app.listen(port, () => {
    console.log(
      `Express started in ${app.get("env")} mode at http://localhost:${port}`
    );
  });
}

if (require.main === module) {
  startServer(process.env.PORT || 8000);
} else {
  module.exports = startServer;
}
