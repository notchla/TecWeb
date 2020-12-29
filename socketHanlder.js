const { populate } = require("./models/user");

const userSockets = [];
const evaluatorSockets = [];

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

const register = (socket) => {
  socket.on("registerUser", (data) => {
    userSockets.push(socket);
    socket.type = "user";
    socket.messages = [];
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
    console.log(data);
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
      }
      // evaluatorSockets.forEach((sock) =>
      //   sock.emit("setMessages", user.messages)
      // );
    }
  });
};

module.exports = register;
