var fs = require("fs")

exports.home = (req, res) => {

    console.log(req.session.userName)
    var storiesnames = getStoriesNames();
    var stories = []
    storiesnames.forEach(function(value, key){
        stories.push({"name": value});
    })

    res.render("home", {listExists: "true", stories: stories})
}

exports.loadStory = (req, res) => {
    //for testing
    res.header("Access-Control-Allow-Origin", "*");
    res.render("storyview");
}

exports.loadJson = (req, res) => {
    //for testing
    res.header("Access-Control-Allow-Origin", "*");


    var params = req.params
    var data = fs.readFileSync(__dirname + `/../public/json/${params.storyname}`)
    if(data){
        res.json(JSON.parse(data))
    }
    else{
        res.send("404");
    }
}

exports.loadTemplate  = (req, res) => {
    var params = req.params
    var data = fs.readFileSync(__dirname + `/../public/stories_template/${params.templatename}.handlebars`)
    if(data){
        res.send(data);
    }
    else{
        res.send("404");
    }
}

exports.checkStoryExists = (req, res) => {
  //for testing
  res.header("Access-Control-Allow-Origin", "*");
  var storiesnames = getStoriesNames();
  res.setHeader('Content-Type', 'application/json');
  if (storiesnames.includes(req.params.code)) {
    res.json({ exists: "true" });
  } else {
    res.json({ exists: "false" });
  }
}

exports.registerUser = (req, res) => {
    req.session.userName = req.body.name
    res.send({result: "success"});
}

exports.notFound = (req, res) => res.render("400")

exports.serverError = (err, req, res, next) => res.render("500")

function getStoriesNames(){
    var files = fs.readdirSync(__dirname + "/../public/json");
    return files;
}