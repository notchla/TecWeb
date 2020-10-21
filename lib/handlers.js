var fs = require("fs")

const db = require("../db")

exports.home = async (req, res) => {

    var stories = await db.getStories({}, "title")
    const storiesnames = stories.map(story => ({
        name: story.title
    }))
    res.render("home", {listExists: "true", stories: storiesnames})
}

exports.loadStory = (req, res) => {
    //for testing
    res.header("Access-Control-Allow-Origin", "*");
    var name = req.params.storyname.split(".")[0]
    res.render("storyview", {name : name});
}

exports.loadJson = async (req, res) => {
    //for testing
    res.header("Access-Control-Allow-Origin", "*");


    var params = req.params
    var data = await db.getStories({title: params.storyname})
    data = data[0]
    if(data){
        res.json(data)
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

exports.checkStoryExists = async (req, res) => {
  //for testing
  res.header("Access-Control-Allow-Origin", "*");
  var storiesnames = await getStoriesNames();
  res.setHeader('Content-Type', 'application/json');
  if (storiesnames.includes(req.params.code)) {
    res.json({ exists: "true" });
  } else {
    res.json({ exists: "false" });
  }
}

exports.registerUser = async (req, res) => {
    var username = req.body.name
    var uuid = req.session.sessionID
    req.session.userName = username
    await db.saveUser(username, uuid)
    res.send({result: "success"});
}

exports.getActivities = async (req, res) => {
  //TODO get activities from DB
    res.send({activities: [{
      "type" : "description"
    },
    {
      "type" : "open question"
    },
    {
      "type" : "closed question"
    }]
  });
}

exports.getActivityForm = async (req, res) => {
    //TODO get forms from DB
    //keep track of ids
    var formsList = {
      "description" : "<label for=\"message-text\" class=\"col-form-label\"> Enter description </label> "+
                "<input class=\"form-control\" id=\"question\"></input>",
      "open question" : "<label for=\"message-text\" class=\"col-form-label\"> Enter question </label> "+
                "<input class=\"form-control\" id=\"question\"></input>" +
                "<label for=\"message-text\" class=\"col-form-label\"> Enter answers (comma separed list) </label> "+
                "<textarea class=\"form-control\" id=\"answer\"></textarea>",
      "closed question" : "<label for=\"message-text\" class=\"col-form-label\"> Enter question </label> "+
                "<input class=\"form-control\" id=\"question\"></input>" +
                "<label for=\"message-text\" class=\"col-form-label\"> Enter possible answers (comma separed list) </label> "+
                "<textarea class=\"form-control\" id=\"answer\"></textarea>"
    };
    var form = formsList[req.params.type]
    res.send({form: form});
}


exports.notFound = (req, res) => res.render("400")

exports.serverError = (err, req, res, next) => res.render("500")

async function getStoriesNames(){
    var stories = await db.getStories({}, "title")
    const storiesnames = stories.map(story => (story.title))
    return storiesnames;
}
