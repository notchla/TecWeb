const { populate } = require("./models/user");

const userSockets = [];
const evaluatorSockets = [];

const register = (socket) => {
  socket.on("registerUser", (data) => {
    userSockets.push(socket);
    console.log("register user", socket.request.session);
    socket.type = "user";
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
    // evaluatorSockets.forEach((socket) => socket.emit("", dataArray));
  });
};

module.exports = register;
