var fs = require("fs");

const db = require("../db");

const formsList = {
  root: {
    form:
      "<p> ROOT </p>" +
      '<label for="question" class="col-form-label"> Enter story description </label> ' +
      '<textarea class="form-control question"></textarea>',
    outputs: 1,
    min_outputs: 1,
    has_file: true,
    has_score: false,
    has_answers: false
  },
  description: {
    form:
      '<label class="col-form-label"> Enter description </label> ' +
      '<input class="form-control question"></input>',
    outputs: 1,
    min_outputs: 0,
    has_file: true,
    has_score: false,
    has_answers: false
  },
  open_question: {
    form:
      '<label class="col-form-label"> Enter question </label> ' +
      '<input class="form-control question"></input>',
    outputs: 1,
    min_outputs: 1,
    has_file: false,
    has_score: false,
    has_answers: true
  },
  closed_question: {
    form:
      '<label class="col-form-label"> Enter question </label> ' +
      '<input class="form-control question"></input>',
    outputs: 0,
    min_outputs: 0,
    has_file: false,
    has_score: false,
    has_answers: true
  },
  minigame: {
    form:
      '<select class="browser-default custom-select select">' +
      '<option selected value="clicker">Clicker</option>' +
      '<option selected value="memory">Memory</option>' +
      "</select>" +
      '<label class="col-form-label"> Minimum score </label> ' +
      '<input class="form-control minscore"> </input>',
    outputs: 2,
    min_outputs: 1,
    has_file: false,
    has_score: true,
    has_answers: false
  },
  validated_question: {
    form:
      '<label class="col-form-label"> Enter question </label> ' +
      '<input class="form-control question"></input>',
    outputs: 2,
    min_outputs: 1,
    has_file: false,
    has_score: false,
    has_answers: false
  },
  end: {
    form:
      '<label class="col-form-label"> Enter description </label> ' +
      '<input class="form-control question"></input>',
    outputs: 0,
    min_outputs: 0,
    has_file: false,
    has_score: false,
    has_answers: false
  },
  group: {
    form:
      '<label for="question" class="col-form-label"> Enter group size </label> ' +
      '<input type="number" class="form-control groupsize" value="1"></input>',
    outputs: 1,
    min_outputs: 0,
    has_file: false,
    has_score: false,
    has_answers: false
  }
};

exports.home = async (req, res) => {
  var stories = await db.getStories({ published: "true" }, "title"); //return only published stories
  const storiesnames = stories.map((story) => ({
    name: story.title,
  }));
  res.render("home", { listExists: "true", stories: storiesnames });
};

exports.loadStory = (req, res) => {
  //for testing
  res.header("Access-Control-Allow-Origin", "*");
  var name = req.params.storyname.split(".")[0];
  res.render("storyview", { name: name });
};

exports.loadJson = async (req, res) => {
  //for testing
  res.header("Access-Control-Allow-Origin", "*");

  var params = req.params;
  var data = await db.getStories({ title: params.storyname });
  data = data[0];
  console.log(data);
  if (data) {
    res.json(data);
  } else {
    res.send("404");
  }
};

exports.loadTemplate = (req, res) => {
  var params = req.params;
  var data = fs.readFileSync(
    __dirname + `/../public/stories_template/${params.templatename}.handlebars`
  );
  if (data) {
    res.send(data);
  } else {
    res.send("404");
  }
};

exports.loadGame = (req, res) => {
  var params = req.params;
  var data = fs.readFileSync(
    __dirname + `/../public/minigames/${params.gamename}.handlebars`
  );
  if (data) {
    res.send(data);
  } else {
    res.send("404");
  }
};

exports.checkStoryExists = async (req, res) => {
  //for testing
  res.header("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  var stories = await db.getStories({}, "title");
  const storiesnames = stories.map((story) => story.title);
  if (storiesnames.includes(req.params.code)) {
    res.json({ exists: "true" });
  } else {
    res.json({ exists: "false" });
  }
};

exports.deleteStory = async (req, res) => {
  //for testing
  res.header("Access-Control-Allow-Origin", "*");
  var title = req.params.title;
  await db.deleteStory({ title: title });
  res.send("200");
};

exports.registerUser = async (req, res) => {
  var username = req.body.name;
  var uuid = req.session.sessionID;
  req.session.userName = username;
  await db.saveUser(username, uuid);
  res.send({ result: "success" });
};

exports.getStoryList = async (req, res) => {
  var stories = await db.getStories({}, "title published");
  stories = stories.map((story) => ({
    title: story.title,
    published: story.published,
  }));
  res.send({ stories: stories });
};

exports.registerStory = async (req, res) => {
  await db.saveStory(
    req.body.storyname,
    req.body.adj,
    req.body.nodes,
    req.body.css,
    req.body.published
  );
  res.end();
};

exports.getActivities = async (req, res) => {
  //TODO get activities from DB
  res.send({
    activities: [
      {
        type: "description",
      },
      {
        type: "open question",
      },
      {
        type: "closed question",
      },
      {
        type: "validated question",
      },
      {
        type: "minigame",
      },
      {
        type: "group",
      },
      {
        type: "end",
      },
    ],
  });
};

exports.getActivityForm = async (req, res) => {
  var data = formsList[req.params.type];
  res.send({ data: data });
};

// exports.saveActiveUser = async (username, id, story, activity) => {
//   await db.saveActiveUser(username, id, story, activity);
// };

// exports.deleteActiveUser = async (id) => {
//   console.log(id);
//   await db.deleteActiveUser({ id });
// };

exports.evaluator = (req, res) => {
  res.render("evaluator", {});
};

exports.players = (req, res) => {
  var results = {};
  var dirpath = __dirname + "/../public/results/";
  var files = fs.readdirSync(dirpath);
  files.forEach((filepath, _) => {
    var data = JSON.parse(fs.readFileSync(dirpath + filepath));
    var stats = fs.statSync(dirpath + filepath);
    var mtime = stats.mtime;

    var day=mtime.getDate();
    var month=mtime.getMonth();
    month=month+1;
    if((String(day)).length==1)
    day='0'+day;
    if((String(month)).length==1)
    month='0'+month;
    var modified=day+ '.' + month + '.' + mtime.getFullYear();

    results[filepath] = {};
    // stuff used by handlebars as object
    results[filepath].filename = filepath.replace(".json", "");
    results[filepath].modified = modified;
    results[filepath].name = data.name;
    results[filepath].username = data.username;
    // stuff used by us as string
    results[filepath].data = JSON.stringify(data);
  });
  console.log(results);
  res.render("players", { results: results });
};

exports.notFound = (req, res) => res.render("404");

exports.serverError = (err, req, res, next) => {
  console.log(err);
  res.render("500");
};
