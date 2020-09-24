/*IMPLEMENTATION IDEAS:
    use partials to render the answer buttons in storyview
*/


var express = require("express")

var app = express();

const handlers = require("./lib/handlers")

var expressHandlebars = require("express-handlebars")

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

app.use(express.static(__dirname + "/public")); //static middleware

const port = process.env.PORT || 3000 //if the enviroment variable isn't setted, port is 3000


app.get("/", handlers.home);

app.get("/stories/:storyname", handlers.loadStory);

app.get("/stories/json/:storyname", handlers.loadJson);

app.get("/stories/template/:templatename", handlers.loadTemplate);

app.get("/checkqr/:code", handlers.checkStoryExists);

app.use(handlers.notFound); // need to be after all others routing handlers

app.use(handlers.serverError); //called when a function throws a new Error() and nothing intercept it

app.listen(port, () => {
    console.log(`Express started on http://localhost:${port}`)
})
