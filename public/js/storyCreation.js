var Counter = (function () {
  this.i = 0;
  return {
    get: function () {
      i = i + 1;
      return i;
    },
    curr: function () {
      return i;
    },
  };
})();

var activities = [];

function actToId(act) {
  return act.replace(" ", "-");
}

function idToAct(id) {
  return id.replace("-", " ");
}

function generateForm4Activity(type) {
  //TODO collect all activity form data for serialization (unique incremental ids for each activity)
  //example for a description activity
  var ret = "<p> root </p>";
  if (type != "root") {
    var index = actToId(type);
    $.ajax({
      type: "get",
      async: false,
      url: "/activities/forms/" + type,
      crossDomain: true,
      success: function (data) {
        ret = data.form;
      },
      error: function (data) {},
    });
  }
  return ret;
}

function packFormData(formData) {
  var inputs = formData.find("input, textarea");
  var data = {};
  inputs.each(function (_, el) {
    var id = el.id;
    if (id == "answer") {
      data[id] = el.value.split(",");
      data[id] = data[id].filter((e) => e !== "");
    } else {
      data[id] = el.value;
    }
  });
  return data;
}

function packStory(root) {
  //adjacency lists
  var adj = new Map();
  // node array
  var nodes = [];
  // visited as array with size as max ID
  dfsActivity(
    root,
    adj,
    nodes,
    Array.apply(null, Array(Counter.curr())).map(function (x, i) {
      return false;
    })
  );
  var json = {
    adj: Array.from(adj, ([k, v]) => ({ k, v })),
    nodes: nodes,
  };
  return json;
}

function dfsActivity(node, adj, nodes, visited) {
  visited[node.nodeID] = true;
  for (const [_, v] of Object.entries(node.childs)) {
    for (var element of v) {
      // exclude root
      nodes.push(packActivity(element.child));
      if (node.nodeID != 1) {
        if (adj.has(node.nodeID)) {
          adj.get(node.nodeID).push(element.child.nodeID);
        } else {
          adj.set(node.nodeID, [element.child.nodeID]);
        }
      }
      //avoid iterating on already visited or empty nodes
      if (
        Object.keys(element.child.childs).length > 0 &&
        !visited[element.child.nodeID]
      ) {
        dfsActivity(element.child, adj, nodes, visited);
      }
    }
  }
}

function packActivity(activity) {
  var ret = {
    id: activity.nodeID,
    type: activity.type,
    content: activity.data,
  };
  return ret;
}

class TreeNode {
  //parent node
  //child tree
  //siblings
  constructor() {
    this.parents = {};
    this.childs = {};
    this.lastChildAdded = null;
    this.nodeID = Counter.get();
    this.outToChild = {};
  }

  insertChild(out, outLine, inLine, child) {
    var parent = this;
    if (child.parents[this])
      child.parents[this].push({ out, outLine, inLine, parent });
    else child.parents[this] = [{ out, outLine, inLine, parent }];

    if (this.childs[child])
      this.childs[child].push({ out, outLine, inLine, child });
    else this.childs[child] = [{ out, outLine, inLine, child }];

    // this.outToChild[outLine] = child;
  }

  insertSibling(sibling) {
    if (this.parent != null) {
      //not root
      sibling.parent = this.parent;
      sibling.sibling = this.sibling;
      this.sibling = sibling;
    }
  }

  outLinetoChildInputLine(outLine) {
    for (const [key, child] of Object.entries(this.childs)) {
      for (const element of child) {
        if (element.outLine == outLine) {
          return [element.child, element.inLine];
        }
      }
    }
    return [null, null];
  }

  deleteParent(parent, outLine) {
    var parentConn = this.parents[parent];
    for (const [index, element] of Object.entries(parentConn)) {
      if (element.outLine === outLine) {
        parentConn.splice(index, 1);
        break;
      }
    }
    if (parentConn.length == 0) delete this.parents[parent];
  }

  deleteChild(child, outLine) {
    var childConn = this.childs[child];
    for (const [index, element] of Object.entries(childConn)) {
      if (element.outLine === outLine) {
        childConn.splice(index, 1);
        break;
      }
    }
    if (childConn.length == 0) delete this.childs[child];
  }
}

TreeNode.prototype.toString = function () {
  return this.nodeID;
};

$(document).ready(function () {
  let app = new PIXI.Application({
    antialias: false,
    autoresize: true,
    resoluzion: window.devicePixelRatio,
  });
  app.renderer.backgroundColor = 0x202125;
  app.renderer.view.style.position = "absolute";
  app.renderer.view.style.display = "block";
  document.body.appendChild(app.view);

  var viewport = new Viewport.Viewport({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    worldWidth: 3500,
    worldHeight: 2000,
    disableOnContextMenu: true,
    interaction: app.renderer.plugins.interaction,
  });

  app.stage.addChild(viewport);
  app.renderer.render(viewport);
  app.renderer.resize(window.innerWidth, window.innerHeight);
  function resize() {
    viewport.screenWidth = window.innerWidth;
    viewport.screenHeight = window.innerHeight;
    app.renderer.resize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener("resize", resize);

  // activity that was clicked on for the context menu
  var contextActivity;

  var FONT = "Arial";
  var TITLE_COLOR = "red";
  var TEXT_COLOR = "white";
  var BUTTON_COLOR = 0x5dbcd2;
  var BLOCK_WIDTH = 200;
  var BLOCK_HEIGHT = 150;

  class Activity extends TreeNode {
    constructor(type) {
      super();
      this.type = type;

      this.input = []; //test
      this.out = [];
      this.input_lines = [];
      this.output_lines = [];
      this.oldOutputLines = [];
      this.rect_height = 0;
      var graphics = (this.rect = new PIXI.Graphics());

      var width = BLOCK_WIDTH;
      var height = BLOCK_HEIGHT;
      graphics.interactive = true;
      graphics.lineStyle(2, 0x000000, 1);
      graphics.beginFill(BUTTON_COLOR);
      graphics.drawRect(0, 0, width, height, 15);
      graphics.endFill();
      var title = new PIXI.Text(type.toUpperCase(), {
        fontFamily: FONT,
        fontWeight: 800,
        fill: TITLE_COLOR,
      });
      title.anchor.set(0.5, 0.5);
      title.width = this.rect.width / 1.4;
      title.scale.y = title.scale.x;
      // no more blurry text
      title.resolution = 2;
      title.position.set(graphics.width / 2, graphics.height / 4);
      graphics.addChild(title);
      var idlabel = new PIXI.Text(this.nodeID.toString(), {
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: 10,
        fill: TEXT_COLOR,
      });
      idlabel.anchor.set(0.5, 0.5);
      idlabel.position.set(10, 10);
      graphics.addChild(idlabel);

      viewport.addChild(graphics);

      graphics
        .on("mousedown", onDragStart)
        .on("touchstart", onDragStart)
        .on("mouseup", onDragEnd)
        .on("mouseupoutside", onDragEnd)
        .on("touchend", onDragEnd)
        .on("touchendoutside", onDragEnd)
        .on("mousemove", onDragMove)
        .on("touchmove", onDragMove)
        .on("rightclick", (event) => {
          // lambda to preserve class context (lost on constructor funcion call)
          // set context menu caller
          contextActivity = this;
          onRightClick(event);
        });

      graphics.input_lines = this.input_lines;
      graphics.output_lines = this.output_lines;
      graphics.out = this.out;
      graphics.input = this.input;
      graphics.nodeID = this.nodeID;
      graphics.classptr = this;
      Activity.original_height = this.rect.height;

      if (this.type == "description") {
        this.draw_output(BUTTON_COLOR);
      }

      // modals creation
      var idEdit = actToId(this.type) + this.nodeID + "-edit-modal";
      var modalBody = generateForm4Activity(this.type);
      //TODO modal form compilation based on request
      var modal =
        '<div class="modal fade" id="' +
        idEdit +
        '" role="dialog">' +
        '<div class="modal-dialog modal-dialog-centered" role="document">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<h5 class="modal-title"> Edit activity </h5>' +
        '<button type="button" class="close" data-dismiss="modal">&times;</button>' +
        "</div>" +
        '<div id="activity-form" class="modal-body">' +
        modalBody +
        "</div>" +
        '<div class="modal-footer">' +
        '<button type="button" class="btn btn-primary" id="' +
        idEdit +
        '-button">Close</button>' +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>";

      // TODO update outputs on close
      $("body").append(modal);

      //add value update on modal close
      $("#" + idEdit + "-button").click(() => {
        this.data = packFormData($("#" + idEdit));
        if (this.text == null) {
          var short = this.data["question"].replace(/(.{8})..+/, "$1…");
          this.text = new PIXI.Text(short, {
            fontFamily: FONT,
            fill: TEXT_COLOR,
            fontSize: 14,
          });
          this.text.anchor.set(0.5, 0.5);
          this.text.position.set(graphics.width / 2, graphics.height / 2);
          graphics.addChild(this.text);
        } else {
          this.text.text = this.data["question"].replace(/(.{8})..+/, "$1…");
        }
        if (this.type != "description") {
          //add outputs to the activity node according to the answers
          for (
            var i = this.output_lines.length;
            i < this.data["answer"].length;
            i++
          ) {
            this.draw_output(BUTTON_COLOR);
          }
        }
        $("#" + idEdit).modal("hide");
      });

      // -------- event handlers --------
      function onDragStart(event) {
        $("#activity-context-menu").finish().hide(100);
        this.data = event.data;
        this.alpha = 0.5;
        this.dragging = true;
        this.oldPosition = this.data.getLocalPosition(this.parent);
      }

      function onDragEnd() {
        $("#activity-context-menu").finish().hide(100);
        this.alpha = 1;
        this.dragging = false;
        this.data = null;
      }

      function onDragMove(event) {
        function traslateOutputLines(lines, positions) {
          lines.forEach((element, index) => {
            if (element instanceof PIXI.Graphics) {
              var pos = positions[index];
              element.updatePoints(pos);
            }
          });
        }

        function traslateInputLines(lines, pos) {
          lines.forEach((element) => {
            if (element instanceof PIXI.Graphics) {
              element.updatePoints(pos);
            }
          });
        }

        function getOutPositions(out) {
          var positions = [];
          out.forEach((element) => {
            var globalPosition = element.getGlobalPosition();
            positions.push([globalPosition.x, globalPosition.y, null, null]);
          });
          return positions;
        }

        function getInputPosition(input) {
          var position = [];
          var globalPosition = input.getGlobalPosition();
          position = [null, null, globalPosition.x, globalPosition.y];
          return position;
        }

        if (this.dragging) {
          var newPosition = this.data.getLocalPosition(this.parent);
          this.position.x += newPosition.x - this.oldPosition.x;
          this.position.y += newPosition.y - this.oldPosition.y;
          this.oldPosition = newPosition;
          if (event.currentTarget.input_lines.length) {
            var position = getInputPosition(event.currentTarget.input[0]);
            traslateInputLines(event.currentTarget.input_lines, position);
          }
          if (event.currentTarget.output_lines.length) {
            var positions = getOutPositions(event.currentTarget.out);
            traslateOutputLines(event.currentTarget.output_lines, positions);
          }
        }
      }

      // show context menu (edit and delete)
      function onRightClick(event) {
        var contextY =
          event.target.position.y + $("#activity-context-menu").height() * 1.3;
        var contextX = event.target.position.x;
        $("#activity-context-menu")
          .finish()
          .toggle(100)
          .css({
            top: contextY + "px",
            left: contextX + "px",
          });
      }
    }

    edit() {
      var id = actToId(this.type) + this.nodeID + "-edit-modal";
      $("#" + id).modal();
    }

    delete() {
      if (this.type != "root") {
        this.type = null;
        this.deleteChilds();
        this.deleteParents();
        this.rect.destroy();
      }
    }

    draw_output(color) {
      var offset =
        this.rect.width / (this.out.length > 0 ? this.out.length + 2 : 2);
      function reposition_out(out) {
        var index = out.length;
        for (let i = 0; i < index; i++) {
          var x = offset * (i + 1);
          var y = out[i].position.y;
          out[i].position.set(x, y);
        }
      }
      var obj = new PIXI.Graphics();
      obj.lineStyle(2, 0x000000, 1);
      obj.beginFill(color);
      obj.drawCircle(0, 0, 10);
      obj.endFill();
      obj.interactive = true;
      // the circle position is relative to its parent
      var x_circle = offset * (this.out.length + 1);
      var y_circle = Activity.original_height;
      obj.position.set(x_circle, y_circle);
      reposition_out(this.out);
      this.rect.addChild(obj);
      this.out.push(obj);
      this.output_lines.push({});
      this.oldOutputLines.push({});

      function onDragStart(event) {
        event.stopPropagation();
        this.alpha = 0.5;
        this.dragging = true;
        var index = event.currentTarget.line_index;
        event.currentTarget.output_lines.forEach((element, index) => {
          event.currentTarget.oldOutputLines[index] = element;
        });
        var globalPosition = obj.getGlobalPosition();
        var line = new Line(
          [
            globalPosition.x,
            globalPosition.y,
            event.data.global.x,
            event.data.global.y,
          ],
          10,
          0x6ea62e
        );
        viewport.addChild(line);
        event.currentTarget.output_lines[index] = line;
        event.oldtarget = event.currentTarget;
        event.oldinfo = [this, event];
      }

      function onDragEnd(event) {
        function checkCollision(mouse, input) {
          if (input) {
            var box = input.getBounds();

            return (
              mouse.x >= box.x &&
              mouse.x <= box.x + box.width &&
              mouse.y >= box.y &&
              mouse.y <= box.y + box.height
            );
          }
          return false;
        }

        event.stopPropagation();
        this.alpha = 1;
        this.dragging = false;
        event.oldinfo[0].alpha = 1;
        event.oldinfo[0].dragging = false;
        event.oldinfo[1].stopPropagation();
        var collision = false;

        //ray cast
        var activity = app.renderer.plugins.interaction.hitTest(
          event.data.global
        );
        if (activity && activity.nodeID != event.oldtarget.nodeID) {
          if (checkCollision(event.data.global, activity.input[0])) {
            collision = true;
            const [
              oldchild,
              inLine,
            ] = event.oldtarget.classptr.outLinetoChildInputLine(
              event.oldtarget.line_index
            );

            if (oldchild && inLine != null) {
              oldchild.input_lines[inLine] = {};
              oldchild.deleteParent(
                event.oldtarget.classptr,
                event.oldtarget.line_index
              );
              event.oldtarget.classptr.deleteChild(
                oldchild,
                event.oldtarget.line_index
              );
            }

            activity.input_lines.push(
              event.oldtarget.output_lines[event.oldtarget.line_index]
            );
            event.oldtarget.classptr.insertChild(
              event.oldtarget,
              event.oldtarget.line_index,
              activity.input_lines.length - 1,
              activity.classptr
            );
          }
        }
        if (!collision) {
          var index = event.oldtarget.line_index;
          if (event.oldtarget.output_lines[index] instanceof PIXI.Graphics)
            event.oldtarget.output_lines[index].destroy();
          if (event.oldtarget.oldOutputLines) {
            event.oldtarget.oldOutputLines.forEach((element, index) => {
              event.oldtarget.output_lines[index] = element;
            });
          } else event.oldtarget.output_lines[index] = {};
        } else {
          //collision
          var index = event.oldtarget.line_index;
          if (event.oldtarget.oldOutputLines[index] instanceof PIXI.Graphics)
            event.oldtarget.oldOutputLines[index].destroy();

          // var input_line_index = event.oldtarget.classptr.getChildInputLineIndex(
          //   activity.classptr,
          //   event.oldtarget.line_index
          // );
          // activity.input_lines[input_line_index] = {};
          // //todo handle input remotion
        }
      }

      function onDragMove(event) {
        if (this.dragging) {
          event.stopPropagation();
          var index = event.currentTarget.line_index;
          var line = event.currentTarget.output_lines[index];
          var globalPosition = obj.getGlobalPosition();
          if (line instanceof PIXI.Graphics)
            line.updatePoints([
              globalPosition.x,
              globalPosition.y,
              event.data.global.x,
              event.data.global.y,
            ]);
        }
      }

      obj
        .on("mousedown", onDragStart)
        .on("touchstart", onDragStart)
        .on("mouseup", onDragEnd)
        .on("mouseupoutside", onDragEnd)
        .on("touchend", onDragEnd)
        .on("touchendoutside", onDragEnd)
        .on("mousemove", onDragMove)
        .on("touchmove", onDragMove).line_index = this.out.length - 1;
      obj.output_lines = this.output_lines;
      obj.nodeID = this.nodeID;
      obj.input = this.input;
      obj.oldOutputLines = this.oldOutputLines;
      obj.classptr = this;
    }

    draw_input(color) {
      if (true) {
        var obj = new PIXI.Graphics();
        obj.lineStyle(2, 0x000000, 1);
        obj.beginFill(color);
        obj.drawCircle(0, 0, 10);
        obj.endFill();
        var x = this.rect.position.x + this.rect.width / 2;
        var y = this.rect.position.y;
        obj.position.set(x, y);
        this.input.push(obj);
        this.rect.addChild(obj);
      }
    }

    deleteChilds() {
      for (const [key, childs] of Object.entries(this.childs)) {
        childs.forEach((element, index) => {
          var line = this.output_lines[element.outLine];
          this.output_lines[element.outLine] = {};
          element.child.input_lines[element.inLine] = {};
          line.destroy();
          delete element.child.parents[this.nodeID];
        });
      }
      this.childs = {};
    }

    deleteParents() {
      for (const [key, parents] of Object.entries(this.parents)) {
        parents.forEach((element, index) => {
          var line = this.input_lines[element.inLine];
          this.input_lines[element.inLine] = {};
          element.parent.output_lines[element.outLine] = {};
          line.destroy();
          delete element.parent.childs[this.nodeID];
        });
      }
      this.parents = {};
    }
  }

  class Line extends PIXI.Graphics {
    constructor(points, lineSize, lineColor) {
      super();
      var size = (this.lineWidth = lineSize || 5);
      var color = (this.lineColor = lineColor || 0x000000);

      this.points = points;

      this.lineStyle(size, color);

      this.moveTo(points[0], points[1]);
      this.lineTo(points[2], points[3]);
    }

    updatePoints(p) {
      var points = (this.points = p.map(
        (val, index) => val || this.points[index]
      ));

      var size = this.lineWidth;
      var color = this.lineColor;

      this.clear();
      this.lineStyle(size, color);
      this.moveTo(points[0], points[1]);
      this.lineTo(points[2], points[3]);
    }
  }

  function getActivities() {
    $.ajax({
      type: "get",
      url: "/activities/",
      crossDomain: true,
      success: function (data) {
        var activityList = "";
        data.activities.forEach(function (act) {
          index = actToId(act.type);
          activities[index] = {
            type: act.type,
          };
          activityList +=
            '<button type="button" class="dropdown-item" id = "' +
            index +
            '"> ' +
            act.type +
            " </button>";
        });
        $("#activity-selector").append(activityList);
        data.activities.forEach(function (act) {
          $("#" + actToId(act.type)).click(function (event) {
            //create new activity
            var activity = new Activity(idToAct(event.target.id));
            activity.draw_input(BUTTON_COLOR);
          });
        });
      },
      error: function (data) {},
    });
  }
  // custom menu event handler
  $("#activity-context-menu span").click(function () {
    // This is the triggered action name
    switch ($(this).attr("data-action")) {
      // A case for each action. Your actions here
      case "edit":
        contextActivity.edit();
        break;
      case "delete":
        contextActivity.delete();
        break;
    }

    // Hide it AFTER the action was triggered
    $("#activity-context-menu").hide(100);
  });

  // activity selection menu initialization
  getActivities();

  //root activity
  var root = new Activity("root");
  root.draw_output(BUTTON_COLOR);

  $("#save-button").click(function () {
    var json = packStory(root);

    const body = JSON.stringify({
      adj: json.adj,
      nodes: json.nodes,
    });
    console.log(body);
    const headers = { "Content-Type": "application/json" };

    fetch("/stories/registerStory", { method: "post", body, headers })
      .then((resp) => {
        if (resp.status < 200 || resp.status >= 300)
          throw new Error(`request failed with status ${resp.status}`);
        return;
      })
      .catch((err) => {
        alert(err);
      });
    console.log(json);
  });
});
