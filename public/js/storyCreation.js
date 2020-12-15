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
    set: function (mi) {
      i = mi;
    },
  };
})();

function actToId(act) {
  return act.replace(" ", "-");
}

function idToAct(id) {
  return id.replace("-", " ");
}

function generateForm4Activity(type) {
  var ret = "<p> root </p>";
  if (type != "root") {
    $.ajax({
      type: "get",
      async: false,
      url: "/templates/forms/" + type,
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

function UNpackFormData(form, oldData) {
  // opposite of packFormData, sets input values from the content object array
  var inputs = form.find("input, textarea");
  var data = {};
  inputs.each(function (_, el) {
    try {
      var id = el.id;
      if (id == "answer") {
        $(el).val(oldData[id].join(","));
      } else {
        $(el).val(oldData[id]);
      }
    } catch (e) {}
  });
  return data;
}

function sendStory(body) {
  const headers = { "Content-Type": "application/json" };
  console.log(body);
  fetch("/stories/registerstory", { method: "post", body, headers })
    .then((resp) => {
      if (resp.status < 200 || resp.status >= 300)
        throw new Error(`request failed with status ${resp.status}`);
      return;
    })
    .catch((err) => {
      alert(err);
    });
}

function packStory(root) {
  //adjacency lists
  var adj = new Map();
  // node array
  var nodes = [];
  var nonbuildable = { value: false };
  // data to recontruct tree (pixi graphics objects)
  dfsActivity(root, adj, nodes, nonbuildable);
  var json = {
    adj: Array.from(adj, ([k, v]) => ({ k, v })),
    nodes: nodes,
  };
  return [json, nonbuildable.value];
}

function dfsActivity(node, adj, nodes, nonbuildable) {
  for (const [_, v] of Object.entries(node.childs)) {
    for (var element of v) {
      // exclude already visited
      if (!nodes.map((n) => n.id).includes(element.child.nodeID)) {
        // exclude root (directly child)
        nodes.push(packActivity(element.child));
      }
      if (node.nodeID != 1) {
        if (!adj.has(node.nodeID)) {
          // new entry in the adjacency list, as an array with the size of the answers
          adj.set(node.nodeID, Array(node.out.length).fill(0));
        }
        adj.get(node.nodeID)[element.outLine] = element.child.nodeID;
      }
      // object has more output ports than lines: is not buildable
      if (node.out.length > Object.entries(node.childs).length) {
        nonbuildable.value = true;
      } else {
        nonbuildable.value = nonbuildable.value || false;
      }

      if (
        Object.keys(element.child.childs).length > 0 &&
        !adj.has(element.child.nodeID)
      ) {
        dfsActivity(element.child, adj, nodes, nonbuildable);
      } else if (Object.keys(element.child.childs).length == 0) {
        if (element.child.out.length > 0) {
          nonbuildable.value = true;
        } else {
          nonbuildable.value = nonbuildable.value || false;
        }
      }
    }
  }
}

function packActivity(activity) {
  // pixiNodeIndex represents the index of the pixiNodes array relative to this activity
  var ret = {
    id: activity.nodeID,
    type: activity.type,
    content: activity.content,
    x: activity.rect.x,
    y: activity.rect.y,
  };
  return ret;
}

class TreeNode {
  //parent node
  //child tree
  //siblings
  constructor(id) {
    this.parents = {};
    this.childs = {};
    this.lastChildAdded = null;
    if (id === undefined) {
      id = Counter.get();
    } else {
      // set the counter iteratively to the last (max) id assigned
      Counter.set(Math.max(Counter.curr(), id));
    }
    this.nodeID = id;
    this.outToChild = {};
  }

  insertChild(out, outLine, inLine, child) {
    var parent = this;
    if (child.parents[this])
      child.parents[this].push({ out, outLine, inLine, parent });
    else child.parents[this] = [{ out, outLine, inLine, parent }];
    console.log(outLine, inLine, child);
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

// GLOBAL
// ROOT ACTIVITY
var root = null;

$(document).ready(function () {
  var [W, H] = [4 * 1024, 3 * 1024];

  let app = new PIXI.Application({
    antialias: true,
    autoresize: true,
    resoluzion: window.devicePixelRatio,
    view: document.getElementById("pixi-canvas"),
  });
  app.renderer.backgroundColor = 0x202125;
  app.renderer.view.style.position = "absolute";
  app.renderer.view.style.display = "block";
  app.render.autoResize = true;
  $("#pixi-area").append(app.view);

  var viewport = new Viewport.Viewport({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    worldWidth: W,
    worldHeight: H,
    disableOnContextMenu: true,
    interaction: app.renderer.plugins.interaction,
  });

  viewport
    .drag({
      wheel: false,
      mouseButtons: "left",
      keyToPress: ["ControlLeft", "ControlRight", "ShiftLeft", "ShiftRight"],
    })
    .wheel()
    .clampZoom({
      minScale: 0.3,
      maxScale: 1.3,
    });

  $(window).scroll(function (e) {
    $(".main-navbar").removeClass("navbar-hide");
  });

  viewport
    .on("drag-start", function () {
      $("#activity-context-menu").finish().hide(100);
    })
    .on("wheel", function () {
      $("#activity-context-menu").finish().hide(100);
    });

  // save the initial viewed area
  viewport.initialPosition = viewport.hitArea;

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
  var BUTTON_COLOR_2 = 0xffbcd2;
  var BLOCK_WIDTH = 200;
  var BLOCK_HEIGHT = 150;

  class Activity extends TreeNode {
    constructor(type, oldNode) {
      if (oldNode !== undefined) {
        super(oldNode.nodeID);
      } else {
        super();
      }
      this.oldNode = oldNode;

      this.rect_height = 0;
      this.graphics = this.rect = new PIXI.Graphics();

      var width = BLOCK_WIDTH;
      var height = BLOCK_HEIGHT;
      this.graphics.interactive = true;
      this.graphics.lineStyle(2, 0x000000, 1);
      this.graphics.beginFill(BUTTON_COLOR);
      this.graphics.drawRect(0, 0, width, height, 15);
      this.graphics.endFill();
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
      title.position.set(this.graphics.width / 2, this.graphics.height / 4);
      this.graphics.addChild(title);
      var idlabel = new PIXI.Text(this.nodeID.toString(), {
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: 10,
        fill: TEXT_COLOR,
      });

      idlabel.anchor.set(0.5, 0.5);
      idlabel.position.set(10, 10);
      this.graphics.addChild(idlabel);

      this.input = [];
      this.out = [];
      this.input_lines = [];
      this.output_lines = [];
      this.oldOutputLines = [];
      this.type = type;

      viewport.addChild(this.graphics);

      this.graphics
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

      this.graphics.input_lines = this.input_lines;
      this.graphics.output_lines = this.output_lines;
      this.graphics.out = this.out;
      this.graphics.input = this.input;
      this.graphics.nodeID = this.nodeID;
      this.graphics.classptr = this;
      Activity.original_height = this.rect.height;

      if (this.type != "root") {
        this.draw_input(BUTTON_COLOR);
      }

      this.isReady = false;
      // waiting callback stack, one stack each activity
      this.waiting = [];
      this.answerIndex = 0;

      // -------- event handlers --------
      function onDragStart(event) {
        $("#activity-context-menu").finish().hide(100);
        this.data = event.data;
        this.alpha = 0.5;
        this.dragging = true;
        this.oldPosition = this.data.getLocalPosition(this.parent);
      }

      function onDragEnd(event) {
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
            var globalPosition = viewport.toWorld(element.getGlobalPosition());
            positions.push([globalPosition.x, globalPosition.y, null, null]);
          });
          return positions;
        }

        function getInputPosition(input) {
          var position = [];
          var globalPosition = viewport.toWorld(input.getGlobalPosition());
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
        var position = event.currentTarget.getGlobalPosition();
        $("#activity-context-menu")
          .finish()
          .toggle(100)
          .css({
            top: position.y + "px",
            left: position.x + "px",
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

    ready(callback) {
      // call after node creation
      if (!this.isReady) {
        // do not run multiple times, put callbacks on wait
        this.waiting.push(callback);
        if (this.waiting.length == 1) {
          var idEdit = actToId(this.type) + this.nodeID + "-edit-modal";
          $.ajax({
            type: "get",
            url: "/templates/forms/" + this.type.split(" ").join("_"),
            crossDomain: true,
            success: (data) => {
              var modalBody = data.data.form;
              var min_outputs = data.data.min_outputs;
              var outputs = data.data.outputs;

              // modals creation
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

              $("#activity-modal-container").append(modal);

              // set outputs
              for (var i = 0; i < outputs - min_outputs; i++) {
                this.draw_output(BUTTON_COLOR);
              }
              for (var i = 0; i < min_outputs; i++) {
                this.draw_output(BUTTON_COLOR_2);
              }

              // rebuild old node
              if (this.oldNode !== undefined) {
                this.content = this.oldNode.content;

                try {
                  var short = this.content["question"].replace(
                    /(.{8})..+/,
                    "$1…"
                  );
                  this.text = new PIXI.Text(short, {
                    fontFamily: FONT,
                    fill: TEXT_COLOR,
                    fontSize: 14,
                  });
                  this.text.anchor.set(0.5, 0.5);
                  this.text.position.set(
                    this.graphics.width / 2,
                    this.graphics.height / 2
                  );
                  this.graphics.addChild(this.text);
                } catch (e) {}
                UNpackFormData($("#" + idEdit), this.oldNode.content);
                // refill form with old data
                try {
                  for (
                    var i = 0;
                    i < this.oldNode.content["answer"].length;
                    i++
                  ) {
                    this.draw_output(BUTTON_COLOR);
                  }
                } catch (e) {}
                // position has to bset after all children have been added
                this.rect.position.set(this.oldNode.x, this.oldNode.y);
              } else {
                // set position to new center (not overlapping the navbar)
                this.rect.position.set(
                  10,
                  $("#main-navbar").innerHeight() + 10
                );
              }

              //add value update on modal close
              $("#" + idEdit + "-button").click(() => {
                this.content = packFormData($("#" + idEdit));
                if (this.text == null) {
                  var short = this.content["question"].replace(
                    /(.{8})..+/,
                    "$1…"
                  );
                  this.text = new PIXI.Text(short, {
                    fontFamily: FONT,
                    fill: TEXT_COLOR,
                    fontSize: 14,
                  });
                  this.text.anchor.set(0.5, 0.5);
                  this.text.position.set(
                    this.graphics.width / 2,
                    this.graphics.height / 2
                  );
                  this.graphics.addChild(this.text);
                } else {
                  this.text.text = this.content["question"].replace(
                    /(.{8})..+/,
                    "$1…"
                  );
                }
                try {
                  //add outputs to the activity node according to the answers
                  for (
                    var i = this.output_lines.length - outputs;
                    i < this.content["answer"].length;
                    i++
                  ) {
                    this.draw_output(BUTTON_COLOR);
                  }
                } catch (e) {}
                $("#" + idEdit).modal("hide");
              });

              this.isReady = true;
              // wake up every waiting call
              while (this.waiting.length > 0) {
                var recall = this.waiting.pop();
                if (recall) {
                  recall();
                }
              }
            },
            error: function (data) {},
          });
        }
      } else {
        if (callback) {
          callback();
        }
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
        var globalPosition = viewport.toWorld(obj.getGlobalPosition());
        var data = { x: event.data.global.x, y: event.data.global.y };
        var dataGlobal = viewport.toWorld(data);
        var line = new Line(
          [globalPosition.x, globalPosition.y, dataGlobal.x, dataGlobal.y],
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
          var globalPosition = viewport.toWorld(obj.getGlobalPosition());
          var data = { x: event.data.global.x, y: event.data.global.y };
          var dataGlobal = viewport.toWorld(data);
          if (line instanceof PIXI.Graphics)
            line.updatePoints([
              globalPosition.x,
              globalPosition.y,
              dataGlobal.x,
              dataGlobal.y,
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
        var x = this.rect.width / 2;
        var y = 0;
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

    addChildActivity(activityTo) {
      if (activityTo) {
        var positionFrom = this.out[this.answerIndex].getGlobalPosition();
        var positionTo = activityTo.input[0].getGlobalPosition();

        var line = new Line(
          [positionFrom.x, positionFrom.y, positionTo.x, positionTo.y],
          10,
          0x6ea62e
        );
        viewport.addChild(line);

        this.output_lines[this.answerIndex] = line;
        activityTo.input_lines.push(this.output_lines[this.answerIndex]);
        this.insertChild(
          this,
          this.answerIndex,
          activityTo.input_lines.length - 1,
          activityTo
        );
        this.answerIndex++;
      }
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

  function rebuildTree(root, data) {
    nodes = new Map();
    if (data.nodes) {
      data.nodes.forEach(function (el, _) {
        var oldNode = {
          content: el.content,
          x: el.x,
          y: el.y,
          nodeID: el.id,
        };
        // rebuild activities with old content
        var tmp = new Activity(el.type, oldNode);
        nodes.set(tmp.nodeID, tmp);
      });
      // rebuild old connections
      data.adj.forEach(function (el, _) {
        var from = nodes.get(el.k);
        el.v.forEach(function (val, _) {
          var to = nodes.get(val);
          // start parallel requests to speed up
          to.ready();
          from.ready(() => {
            to.ready(() => {
              from.addChildActivity(to);
            });
          });
        });
      });
      // add root entry point
      var entryPoint = nodes.get(data.adj[0].k);
      root.ready(() => {
        root.addChildActivity(entryPoint, 0);
      });
    }
  }

  function loadStory(name) {
    $.ajax({
      type: "get",
      url: "/stories/json/" + name,
      crossDomain: true,
      success: function (data) {
        console.log(data);
        // set storyname form data
        $("#story-name").val(data.title);
        $("#published").prop("checked", data.published);
        rebuildTree(root, data);
        $("#indicator-overlay").fadeOut(300, function () {
          $("#indicator-overlay").removeClass("in");
          $(".modal-backdrop").remove();
          $("#indicator-overlay").modal("hide");
        });
      },
      error: function (data) {},
    });
  }

  function resetScene() {
    // iteratively empty the pixi stage children, then add root
    // state.children[0] is main stage, stage.children[0].children are the rendered elements in the main stage
    var mainStage = app.stage.children[0];
    while (mainStage.children[0]) {
      mainStage.removeChild(mainStage.children[0]);
    }
    // reset viewport zoom and position
    viewport.x = 0;
    viewport.y = 0;
    viewport.setZoom(1);
    // reset the forms
    $("#story-name").val("");
    $("#published").prop("checked", false);
    $("#activity-modal-container").empty();
    // reset the counter
    Counter.set(0);
    // add root back
    root = new Activity("root");
  }

  function getActivities() {
    $.ajax({
      type: "get",
      url: "/templates/getnames/",
      crossDomain: true,
      success: function (data) {
        var activityList = "";
        data.activities.forEach(function (act) {
          index = actToId(act.type);
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
            activity.ready();
          });
        });
      },
      error: function (data) {},
    });
  }

  var invisible =
    '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-eye-slash" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>' +
    '<path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299l.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>' +
    '<path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709z"/>' +
    '<path fill-rule="evenodd" d="M13.646 14.354l-12-12 .708-.708 12 12-.708.708z"/>' +
    "</svg>";

  var visible =
    '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-eye" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
    '<path fill-rule="evenodd" d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.134 13.134 0 0 0 1.66 2.043C4.12 11.332 5.88 12.5 8 12.5c2.12 0 3.879-1.168 5.168-2.457A13.134 13.134 0 0 0 14.828 8a13.133 13.133 0 0 0-1.66-2.043C11.879 4.668 10.119 3.5 8 3.5c-2.12 0-3.879 1.168-5.168 2.457A13.133 13.133 0 0 0 1.172 8z"/>' +
    '<path fill-rule="evenodd" d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>' +
    "</svg>";

  function storyList() {
    $("#indicator").show();
    $.ajax({
      type: "get",
      url: "/stories/getnames",
      crossDomain: true,
      success: function (data) {
        $("#indicator").hide();
        // clear list
        $("#list-stories").empty();
        data.stories.forEach(function (story) {
          if (story.title) {
            var storyEntry =
              "<div id=" +
              story.title +
              '-open" class="list-group-item list-group-item-action flex-column align-items-start">' +
              '<span class="h5 mx-auto"> ' +
              story.title +
              " </span>";
            // published icon
            storyEntry += '<div class="mr-5 float-left">';
            if (story.published) {
              storyEntry += visible;
            } else {
              storyEntry += invisible;
            }
            storyEntry += "</div>";

            storyEntry +=
              "<button id=" +
              story.title +
              '-delete" type="button" class="btn btn-danger float-right"> Delete </button>' +
              "</div>";
            $("#list-stories").append(storyEntry);
            //TODO delete button prompts to remove selected story
          }
        });
      },
      error: function (data) {},
    });

    // ######## CALLBACKS ########
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
  }

  $("#list-stories").click(function (e) {
    //hide selection modal
    $("#main-modal").modal("toggle");
    if (e.target.id.includes("-open")) {
      // show choosen story
      // show spinner
      $("#indicator-overlay").modal("show");

      $(this).toggleClass("active");
      e.preventDefault();
      // empty scene
      resetScene();
      //load story objects
      loadStory(e.target.id.replace('"', "").replace("-open", ""));
    } else if (e.target.id.includes("-delete")) {
      //prompt delete
      var storyname = e.target.id.replace('"', "").replace("-delete", "");
      $("#delete-modal-title").text("Delete story " + storyname);
      $("#confirm-delete-modal").modal("show");
      $("#confirm-delete-story").click(function () {
        $.ajax({
          type: "get",
          url: "/stories/delete/" + storyname,
          crossDomain: true,
          success: function (data) {},
          error: function (data) {},
        });
        $("#confirm-delete-modal").modal("hide");
        // reload updated stories and show modal
        storyList();
        $("#main-modal").modal("show");
      });
    }
  });

  // new empty story
  $("#edit-new-story").click(function () {
    $("#main-modal").modal("hide");
    resetScene();
    root.ready();
  });

  $("#open-story-modal").click(function () {
    storyList();
    $("#main-modal").modal("show");
  });

  $("#send-story").click(function () {
    var storyname = $("#story-name").val();
    var published = $("#published").prop("checked");
    var stuff = packStory(root);
    var data = stuff[0];
    var nonbuildable = stuff[1];
    var seen = [];

    const body = JSON.stringify({
      adj: data.adj,
      nodes: data.nodes,
      storyname: storyname,
      published: published,
    });
    if (published && nonbuildable) {
      $("#incomplete-story-modal").modal("show");
    } else {
      $.ajax({
        type: "get",
        url: "/stories/exists/" + storyname,
        crossDomain: true,
        success: function (data) {
          if (data.exists === "true") {
            $("#confirm-changes-modal").modal("show");
            $("#confirm-send-story").prop("onclick", null).off("click");
            $("#confirm-send-story").click(function () {
              sendStory(body);
              // close modals
              $("#confirm-changes-modal").modal("hide");
              $("#confirm-modal").modal("hide");
            });
          } else {
            sendStory(body);
            // close modal
            $("#confirm-modal").modal("hide");
          }
        },
        error: function (data) {},
      });
    }
  });

  $("#save-button").click(function () {
    $("#confirm-modal").modal();
  });

  // ######## SETTINGS ########

  // disable navbar selection
  $("#main-navbar")
    .attr("unselectable", "on")
    .css({
      "-moz-user-select": "-moz-none",
      "-moz-user-select": "none",
      "-o-user-select": "none",
      "-khtml-user-select": "none",
      "-webkit-user-select": "none",
      "-ms-user-select": "none",
      "user-select": "none",
    })
    .bind("selectstart", function () {
      return false;
    });

  $("#main-modal").modal({
    backdrop: "static",
    keyboard: false,
  });

  // ######## MAIN ########
  // activity selection menu initialization
  getActivities();

  // main (story selector) modal
  storyList();
});
