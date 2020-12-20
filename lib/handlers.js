var fs = require("fs");

const db = require("../db");

const formsList = {
  root: {
    form: "<p> ROOT </p>" +
      '<label for="question" class="col-form-label"> Enter story description </label> ' +
      '<textarea class="form-control question"></textarea>',
    outputs: 1,
    min_outputs: 1,
  },
  description: {
    form:
      '<label class="col-form-label"> Enter description </label> ' +
      '<input class="form-control question"></input>',
    outputs: 1,
    min_outputs: 0,
  },
  open_question: {
    form:
      '<label class="col-form-label"> Enter question </label> ' +
      '<input class="form-control question"></input>' +
      '<label class="col-form-label"> Enter answers (comma separed list) </label> ' +
      '<textarea class="form-control answer"></textarea>',
    outputs: 1,
    min_outputs: 1,
  },
  closed_question: {
    form:
      '<label class="col-form-label"> Enter question </label> ' +
      '<input class="form-control question"></input>' +
      '<label class="col-form-label"> Enter possible answers (comma separed list) </label> ' +
      '<textarea class="form-control answer"></textarea>',
    outputs: 0,
    min_outputs: 0,
  },
  minigame: {
    form:
      '<select class="select browser-default custom-select">' +
      '<option selected value="clicker">Clicker</option>' +
      "</select>" +
      '<label class="col-form-label"> Minimum score </label> ' +
      '<textarea class="form-control question"></textarea>',
    outputs: 2,
    min_outputs: 1,
  },
  end: {
    form:
      '<label class="col-form-label"> Enter description </label> ' +
      '<input class="form-control question"></input>',
    outputs: 0,
    min_outputs: 0,
  },
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
        type: "minigame",
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
  res.render("evaluator", {})
}

exports.notFound = (req, res) => res.render("400");

exports.serverError = (err, req, res, next) => res.render("500");
