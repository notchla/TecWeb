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
var story_data; //story json
var story_templates = {};
var current_adj = 0;
var current_node = 0;

function updateContent(data) {
  var type = data.type;
  var template = story_templates[data.type];
  var context = data.content;
  var html = template(context);
  document.getElementById("entry-template").innerHTML = html;
  var js = `/js/${data.type}.js`;
  addCompletedScript(js);
}

//load all the templates used in the story
async function loadTemplates(data) {
  return new Promise(async (resolve) => {
    var templates = {};
    data.nodes.forEach((element) => {
      templates[element.type] = element.type;
    });

    await getTemplate(templates);
    resolve();
  });
}

$(document).ready(function () {
  var name = window.location.href.split("/");
  name = name[name.length - 1];
  $.get(`/stories/json/${name}`).then(
    async function (data) {
      counter = CounterClass(data.pages);
      story_data = data;
      await loadTemplates(data);
      updateContent(data.nodes[counter.get()]);
    },
    function () {
      alert("error in loading data");
    }
  );
});

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
