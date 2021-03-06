var CounterClass = function (max) {
  this.i = 0;
  this.max = max;
  return {
    inc: function () {
      i = i + 1;
      i = i % max;
      return i;
    },
    get: function () {
      return i;
    },
  };
};

var counter;
var total_score = 0;
var story_data; //story json
var story_templates = {};
var minigames = {};
var current_adj = 0;
var current_node = 0;
// default story wide css
var baseCSS = {};

function updateContent(data, score = 0) {
  var type = data.type;
  if (type == "root") {
    // handle root as description
    type = "description";
  }
  var template = story_templates[type];
  var context = data.content;
  if (data.type == "minigame") {
    context = minigames[data.content.select];
    Handlebars.registerPartial("game", context);
    var js = `/minigames/${data.content.select}.js`;
    addGameScript(js);
  }
  if (type != "end") {
    var html = template(context);
  } else {
    var html = template({ total: total_score });
  }
  document.getElementById("entry-template").innerHTML = html;
  var js = `/js/helpers/${type}.js`;

  addCompletedScript(js);
  var css = {
    color: "",
    bgcolor: "",
    fontcolor: "",
    font: "",
    style: "",
    size: "",
  };
  try {
    // add css
    css.color = context.color;
    css.bgcolor = context.bgcolor;
    css.fontcolor = context.fontcolor;
    css.font = context.font;
    css.style = context.style;
    css.size = context.size;
  } catch (e) {}

  applyCSS(css);

  var name = window.location.href.split("/"); //storyname
  name = name[name.length - 1];
  activityID = story_data.nodes[current_node].id;
  //socket
  socket.emit("transition", {
    name,
    activityID,
    time: new Date().getTime(),
    score,
  });

  // update score
  $("#scorepoints").text(" " + total_score);
}

//load all the templates used in the story
async function loadTemplates(data) {
  return new Promise(async (resolve) => {
    var templates = {};
    var games = [];
    data.nodes.forEach((element) => {
      var type = element.type;
      if (element.type == "root") {
        // handle root as description
        type = "desctiption";
      }
      templates[type] = type;
      if (element.type == "minigame") {
        games.push(element.content.select);
      }
    });

    await getTemplate(templates);
    await getMinigame(games);
    resolve();
  });
}

function addBaseCSS(data) {
  baseCSS = {
    color: "",
    bgcolor: "",
    fontcolor: "",
    font: "",
    style: "",
    size: "",
  };
  if (data.css) {
    baseCSS = data.css;
  }
  // rollback defaults
  if (baseCSS.color === "" || !baseCSS.color) {
    baseCSS.color = "#C8C8C8FF";
  }
  if (baseCSS.bgcolor === "" || !baseCSS.bgcolor) {
    baseCSS.bgcolor = "#DADADAFF";
  }
  if (baseCSS.fontcolor === "" || !baseCSS.fontcolor) {
    baseCSS.fontcolor = "#000000FF";
  }
  if (baseCSS.font === "" || !baseCSS.font) {
    baseCSS.font = '"Times New Roman", Times, serif';
  }
  if (baseCSS.style === "" || !baseCSS.style) {
    baseCSS.style = "normal";
  }
  if (baseCSS.size === "" || !baseCSS.size) {
    baseCSS.size = "26px";
  }
}

function addCompletedScript(scriptName) {
  var old_script = document.getElementById("activity_checker");
  if (old_script) {
    old_script.parentNode.removeChild(old_script);
  }
  var head = document.getElementsByTagName("head")[0];
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.onload = function () {
    activity_checker();
  };
  script.src = scriptName;
  script.id = "activity_checker";
  head.appendChild(script);
}

function addGameScript(scriptName) {
  var old_script = document.getElementById("game_script");
  if (old_script) {
    old_script.parentNode.removeChild(old_script);
  }
  var head = document.getElementsByTagName("head")[0];
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.onload = function () {
    game_checker();
  };
  script.src = scriptName;
  script.id = "game_script";
  head.appendChild(script);
}

async function getTemplate(templates) {
  return new Promise(async (res) => {
    for (const template in templates) {
      await new Promise((resolve) =>
        $.get(`/templates/get/${template}`)
          .then(function (handlebar) {
            story_templates[template] = Handlebars.compile(handlebar);
            resolve();
          })
          .catch(() => alert("error in loading templates please try again"))
      );
    }
    res();
  });
}

function applyCSS(css) {
  // always apply story wide css first, use css cascade property to do the work

  $("#myModal").css("background-color", baseCSS.bgcolor);
  $(".modal-content").css("background-color", baseCSS.color);

  $("#myModal").css("color", baseCSS.fontcolor);
  $("#myModal").css("font-family", baseCSS.font);
  $("#myModal").css("font-style", baseCSS.style);

  if (css.bgcolor !== "") {
    $("#myModal").css("background-color", css.bgcolor);
  }
  if (css.color !== "") {
    $(".modal-content").css("background-color", css.color);
  }
  if (css.fontcolor !== "") {
    $("#myModal").css("color", css.fontcolor);
  }
  if (css.font !== "") {
    $("#myModal").css("font-family", css.font);
  }
  if (css.style !== "") {
    $("#myModal").css("font-style", css.style);
  }
  if (css.size !== "") {
    $("#myModal").css("font-size", css.size);
  }
}

async function getMinigame(names) {
  return new Promise(async (res) => {
    for (var i = 0; i < names.length; i++) {
      await new Promise((resolve) =>
        $.get(`/minigames/get/${names[i]}`)
          .then(function (handlebar) {
            minigames[names[i]] = Handlebars.compile(handlebar);
            resolve();
          })
          .catch(() => alert("error in loading"))
      );
    }
    res();
  });
}

function getAdjIndex() {
  return current_adj;
}

function setAdjIndex(index) {
  const i = story_data.adj.findIndex((adj) => adj.k == index);
  current_adj = i;
  return;
}

function getNodeIndex(id) {
  return story_data.nodes.findIndex((node) => node.id == id);
}

console.log("socket");
//socket handling
const socket = io("http://localhost:8000", {
  transports: ["websocket"],
  path: "/socket", // needed for cors in dev
});

socket.emit("registerUser", {});

$(document).ready(function () {
  var name = window.location.href.split("/");
  name = name[name.length - 1];
  // add qr code to canvas
  writeQR(name);
  // set download source
  $("#qr-download-btn").click(() => {
    $("#qr-download-btn").attr("href", $("#newqr img").attr("src"));
  });

  $("#collapseQR-button").click(() => {
    if ($("#collapseQR").hasClass("show")) {
      $("#score-show").css("display", "block");
    } else {
      $("#score-show").css("display", "none");
    }
  });

  $.get(`/stories/json/${name}`).then(
    async function (data) {
      counter = CounterClass(data.pages);
      story_data = data;
      await loadTemplates(data);
      // add story wide css
      addBaseCSS(data);
      updateContent(data.nodes[counter.get()]);
    },
    function () {
      alert("error in loading data");
    }
  );
});
