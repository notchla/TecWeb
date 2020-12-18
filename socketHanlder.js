const userSockets = [];
const auditorSockets = [];

const register = (socket) => {
  socket.on("registerUser", (data) => {
    userSockets.push(socket);
    console.log(socket.request.session);
    const session = socket.request.session;
    // handlers.saveActiveUser(session.userName, session.sessionID, "", 0);
  });

  socket.on("disconnect", () => {
    var index = userSockets.findIndex(
      (sock) =>
        sock.request.session.sessionID === socket.request.session.sessionID
    );

    if (index > -1) {
      console.log(index, " user");
      userSockets.splice(index, 1);
      console.log(userSockets);
      return;
    }

    index = auditorSockets.findIndex(
      (sock) =>
        sock.request.session.sessionID === socket.request.session.sessionID
    );

    if (index > -1) {
      console.log(index);
      auditorSockets.splice(index, 1);
      return;
    }
    // handlers.deleteActiveUser(socket.request.session.sessionID);
  });
  socket.on("transition", (data) => {
    console.log(data);
    const index = userSockets.findIndex(
      (sock) =>
        sock.request.session.sessionID === socket.request.session.sessionID
    );

    if (index > -1) {
      userSockets[index].userProgress = data;
    }
  });
};

module.exports = register;
