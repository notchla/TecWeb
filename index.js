/*IMPLEMENTATION IDEAS:
    use partials to render the answer buttons in storyview
*/


var express = require("express")

var app = express();

var expressHandlebars = require("express-handlebars")

var fs = require("fs")

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


app.get("/", function(req, res){
    var storiesnames = getStoriesNames();
    var stories = []
    storiesnames.forEach(function(value, key){
        stories.push({"name": value});
    })

    res.render("stories", {listExists: "true", stories: stories})
})

app.get("/stories/:storyname", function(req, res){
    res.render("storyview", {loadScript: true});
    /*TODO  return the template for the story and modify example.js to retrieve the correct story*/
})

app.get("/stories/json/:storyname", function(req, res){
    var params = req.params
    var data = fs.readFileSync(__dirname + `/public/json/${params.storyname}`)
    if(data){
        res.json(JSON.parse(data))
    }
    else{
        res.send("404");
    }
})

app.use((req, res)=> res.status(404).render("404")) // need to be after all others routing handlers

app.use((err, req, res, next) => { //called when a function throws a new Error() and nothing intercept it
    console.error("**SERVER ERROR" + err.message)
    res.status(500).render("500")
});

app.listen(port, () => {
    console.log(`Express started on http://localhost:${port}`)
})

function getStoriesNames(){
    var files = fs.readdirSync(__dirname + "/public/json");
    return files;
}
