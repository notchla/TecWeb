var fs = require("fs")

exports.home = (req, res) => {
    var storiesnames = getStoriesNames();
    var stories = []
    storiesnames.forEach(function(value, key){
        stories.push({"name": value});
    })

    res.render("stories", {listExists: "true", stories: stories})
}

exports.loadStory = (req, res) => {
    res.render("storyview", {loadScript: true});
}


exports.loadJson = (req, res) => {
    var params = req.params
    var data = fs.readFileSync(__dirname + `/../public/json/${params.storyname}`)
    if(data){
        res.json(JSON.parse(data))
    }
    else{
        res.send("404");
    }
}

exports.notFound = (req, res) => res.render("400")

exports.serverError = (err, req, res, next) => res.render("500")

function getStoriesNames(){
    var files = fs.readdirSync(__dirname + "/../public/json");
    return files;
}