/*IMPLEMENTATION IDEAS:
    use partials to render the answer buttons in storyview
*/

var express = require("express");

var app = express();

const cors = require("cors");

// const http = require("http").createServer(app);

// const io = require("socket.io")(http, {
//   path: "/socket",
// });

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

const socketHandler = require("./socketHandler");

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

// set upload limit to hold stories with images
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));

app.use(cookieParser(credentials.cookieSecret));
//cookie middleware MUST be before session

var sessionMiddleware = expressSession({
  resave: false,
  saveUninitialized: false,
  secret: credentials.cookieSecret,
  store: new RedisStore({ client: redisClient }),
});


app.use(sessionMiddleware);

app.use(express.static(__dirname + "/public")); //static middleware

app.use(flashMiddleware);

app.use(usernameSession); //check for username in session

app.use(sessionIDMiddleware);

app.use(cors({ origin: "*" })); //DEVELOPMENT !!

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

app.get("/evaluator", handlers.evaluator);

app.get("/evaluator/players", handlers.players);

app.use(handlers.notFound); // need to be after all others routing handlers

app.use(handlers.serverError); //called when a function throws a new Error() and nothing intercept it

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(
      `Express started in ${app.get("env")} mode at http://site192009.tw.cs.unibo.it:${port}`
    );
  });
  const io = require("socket.io")(server, {
    path: "/socket",
  });
  io.use(function (socket, next) {
    sessionMiddleware(socket.request, socket.request.res || {}, next);
  });

  io.on("connection", (socket) => {
    console.log("a user connected");
    socketHandler(socket);
  });
}

// io.on("connection", (socket) => {
//   console.log("a user connected");
// });

// http.listen(8001, () => {
//   console.log("socket started");
// });

if (require.main === module) {
  const server = startServer(process.env.PORT || 8000);
} else {
  module.exports = startServer;
}
