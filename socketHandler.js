const util = require("util"); //for deep console.log
const fs = require("fs");

const resultsPath = "./public/results/";

var { nanoid } = require("nanoid");

const userSockets = [];
const evaluatorSockets = [];

const results = {};

const groups = {};

function indexUserSocket(id) {
  var index = userSockets.findIndex(
    (sock) => sock.request.session.sessionID === id
  );

  return index;
}

function indexEvaluatorSocket(id) {
  var index = evaluatorSockets.findIndex(
    (sock) => sock.request.session.sessionID === id
  );

  return index;
}

function deleteResults(id) {
  delete results[id];
}

function getUserResults(result) {
  console.log("result", result);
  const time = [];
  const points = [];
  var totalTime = 0;
  var totalPoints = 0;

  for (let index = 0; index < result.length - 1; index++) {
    const current = result[index];
    const next = result[index + 1];
    var diff = next.time - current.time;
    time.push(diff);
    totalTime += diff;
    totalPoints += current.score;
    points.push(current.score);
  }

  return { time, totalTime, points, totalPoints };
}

function msToTime(s) {
  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;
  return hrs + " h " + mins + " m " + secs + " s";
}

const register = (socket) => {
  socket.on("registerUser", (data) => {
    userSockets.push(socket);
    socket.type = "user";
    socket.messages = [];
    socket.validation = {};
    // handlers.saveActiveUser(session.userName, session.sessionID, "", 0);
  });

  socket.on("registerEvaluator", () => {
    console.log("Evaluator");
    evaluatorSockets.push(socket);
    socket.type = "evaluator";
  });

  socket.on("populateEvaluator", () => {
    console.log("populate");
    var data = [];
    userSockets.forEach((socket) => {
      data.push(socket.userProgress);
    });
    socket.emit("populate", data);
  });

  socket.on("disconnect", () => {
    console.log("disconnected", socket.type);
    if (socket.type === "user") {
      var index = userSockets.findIndex(
        (sock) =>
          sock.request.session.sessionID === socket.request.session.sessionID
      );

      if (index > -1) {
        console.log(index, " user");
        userSockets.splice(index, 1);
        console.log(userSockets);
        evaluatorSockets.forEach((evaluator) => {
          evaluator.emit("delete", socket.request.session.sessionID);
        });
        deleteResults(socket.request.session.sessionID);
        return;
      }
    }

    if (socket.type === "evaluator") {
      var index = evaluatorSockets.findIndex(
        (sock) =>
          sock.request.session.sessionID === socket.request.session.sessionID
      );

      if (index > -1) {
        console.log(index);
        evaluatorSockets.splice(index, 1);
        return;
      }
    }

    // handlers.deleteActiveUser(socket.request.session.sessionID);
  });

  socket.on("transition", (data) => {
    data.sessionID = socket.request.session.sessionID;
    data.username = socket.request.session.userName;
    // console.log(data);
    const index = userSockets.findIndex(
      (sock) =>
        sock.request.session.sessionID === socket.request.session.sessionID
    );

    if (index > -1) {
      userSockets[index].userProgress = data;
    }

    dataArray = [];
    dataArray.push(data);
    evaluatorSockets.forEach((socket) => socket.emit("populate", dataArray));

    if (results[data.sessionID]) {
      results[data.sessionID].transitions.push(data);
    } else {
      results[data.sessionID] = {};
      results[data.sessionID].transitions = [];
      results[data.sessionID].transitions.push(data);
    }

    // console.log(util.inspect(results, false, null, true /* enable colors */))
  });

  socket.on("message", (data) => {
    console.log(data);
    if (socket.type == "user") {
      var index = indexUserSocket(socket.request.session.sessionID);

      if (index > -1) {
        data.username = socket.request.session.userName;
        data.session = socket.request.session.sessionID;
        data.side = "left";
        userSockets[index].messages.push(data);
        console.log(userSockets[index].messages);
      }
      evaluatorSockets.forEach((sock) => sock.emit("deliver", data));
    }
    if (socket.type == "evaluator") {
      var index = indexUserSocket(data.session);

      if (index > -1) {
        var text = data.text;
        send = { text, side: "right" };
        userSockets[index].messages.push(send);
        userSockets[index].emit("deliver", data.text);
      }
      console.log("message from evaluator", data);
    }

    // evaluatorSockets.forEach((socket) => socket.emit("", dataArray));
  });

  socket.on("getMessages", (data) => {
    var index = indexUserSocket(data.sessionID);

    if (index > -1) {
      user = userSockets[index];
      var evalIndex = indexEvaluatorSocket(socket.request.session.sessionID);
      if (evalIndex > -1) {
        evaluatorSockets[evalIndex].emit("setMessages", user.messages);
        evaluatorSockets[evalIndex].emit("requestValidation", user.validation);
        if (user.completed) {
          evaluatorSockets[evalIndex].emit("create-results", user.completed);
        }
      }
      // evaluatorSockets.forEach((sock) =>
      //   sock.emit("setMessages", user.messages)
      // );
    }
  });

  socket.on("changeName", (data) => {
    // change both the name on the user socket and on the result array
    const index = userSockets.findIndex(
      (sock) =>
        sock.request.session.sessionID === data.sessionID
    );
    if (index > -1) {
      userSockets[index].request.session.userName = data.newName;
    }
    results[data.sessionID].transitions[0].username = data.newName;
  });

  socket.on("end", (data) => {
    data = {};
    const result = results[socket.request.session.sessionID];
    data = {};
    data.id = result.transitions[0].sessionID;
    data.name = result.transitions[0].name;
    data.username = result.transitions[0].username || "anonymous";
    var { time, totalTime, points, totalPoints } = getUserResults(
      result.transitions
    );
    data.totalTime = msToTime(totalTime);
    data.totalPoints = totalPoints;
    data.activities = {};

    for (let index = 0; index < result.transitions.length - 1; index++) {
      const activity = result.transitions[index];
      data.activities[activity.activityID] = {
        time: msToTime(time[index]),
        points: points[index],
      };
    }

    console.log(
      util.inspect(
        results[socket.request.session.sessionID],
        false,
        null,
        true /* enable colors */
      )
    );
    console.log(data);

    var id = nanoid(10);
    var name = resultsPath + id + ".json";

    const json = JSON.stringify(data);

    // if the server is started with nodemon this reload the server !!!
    fs.writeFile(name, json, (err) => {
      if (err) {
        console.log(err);
      }
      console.log(name, " saved");
      socket.emit("show-result-id", id);
    });

    var user_results = {
      userid: socket.request.session.sessionID,
      results_id: id,
    };

    var index = indexUserSocket(socket.request.session.sessionID);

    if (index > -1) {
      userSockets[index].completed = user_results;
    }

    evaluatorSockets.forEach((sock) =>
      sock.emit("create-results", user_results)
    );
  });

  socket.on("requestValidation", (data) => {
    var index = indexUserSocket(socket.request.session.sessionID);

    if (index > -1) {
      data.username = socket.request.session.userName;
      data.session = socket.request.session.sessionID;
      data.side = "left";
      userSockets[index].validation = data;
    }
    console.log("validate", data);
    evaluatorSockets.forEach((sock) => sock.emit("requestValidation", data));
  });

  socket.on("returnValidation", (data) => {
    var index = indexUserSocket(data.session);

    if (index > -1) {
      // remove
      userSockets[index].validation = {};
      userSockets[index].emit("returnValidation", data);
    }
    console.log("validation", data);
  });

  socket.on("joinGroup", (data) => {
    var index = indexUserSocket(socket.request.session.sessionID);
    if(!groups[data.name]) {
      groups[data.name] = [];
    }
    groups[data.name].push(socket.request.session.sessionID);
    // send lobbyFull only to the dest user
    userSockets[index].emit("inGroup", {
      index: groups[data.name].length - 1
    });

    if(groups[data.name].length == data.groupsize) {
      // notify all users that group is full
      groups[data.name].forEach((sessionID, _) => {
        var index = indexUserSocket(sessionID);
        userSockets[index].emit("lobbyFull", {});
      });
      delete groups[data.name];
    }
  });
};

module.exports = register;
