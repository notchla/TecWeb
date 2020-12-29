var activeSession;

function adduser(name, activityID, time, sessionID, username) {
  console.log($("users"));
  $("#users")
    .append(`<a href="" onclick="return show_messages('${username}', '${sessionID}')" class="list-group-item list-group-item-action border-0" id ="${sessionID}">
    <div class="d-flex align-items-start">
      <div class="flex-grow-1 ml-3 userInfo">
        ${username}
        activity : ${activityID}
        time : ${time}
        id : ${sessionID}
        story : ${name}
      </div>
    </div>
  </a>`);
}

function updateUser(user, name, activityID, time, sessionID, username) {
  // console.log(user.)
  var info = user.getElementsByClassName("userInfo");
  $(info).after(`<div class="flex-grow-1 ml-3 userInfo">
  ${username}
  activity : ${activityID}
  time : ${time}
  id : ${sessionID}
  story : ${name}
  <div class="small">
    <span class="fas fa-circle chat-online"></span>
    Online
  </div>
</div>`);

  $(info)[0].remove();
}

const userdata = {};

console.log("socket");
//socket handling
const socket = io("http://localhost:8000", {
  transports: ["websocket"],
  path: "/socket", // needed for cors in dev
});

socket.emit("registerEvaluator", {});
socket.emit("populateEvaluator", {});
socket.on("populate", (data) => {
  data.forEach((user) => {
    console.log("user", user);
    var a = document.getElementById(user.sessionID);

    if (a) {
      updateUser(
        a,
        user.name,
        user.activityID,
        user.time,
        user.sessionID,
        user.username ? user.username : "anonymous"
      );
    } else {
      adduser(
        user.name,
        user.activityID,
        user.time,
        user.sessionID,
        user.username ? user.username : "anonymous"
      );
    }
    userdata[user.sessionID] = user;
  });
  console.log("userdata", userdata);
});

socket.on("delete", (data) => {
  delete userdata[data];
  const id = "#" + data;
  $(id).remove();
  console.log("after delete ", userdata);
});

socket.on("setMessages", (data) => {
  console.log("set messages");
  console.log(data);
  data.forEach((msg) => {
    if (msg.side === "left") {
      $("#messages").append(`<div class="chat-message-left pb-4">
      <div class="flex-shrink-1 bg-light rounded py-2 px-3 ml-3">
        <div class="font-weight-bold mb-1">
          ${msg.username || "anonymous"}
        </div>
        ${msg.text}
      </div>
    </div>`);
    } else if (msg.side == "right") {
      $("#messages").append(`<div class="chat-message-right mb-4">
        <div>
          <img src="https://bootdey.com/img/Content/avatar/avatar1.png" class="rounded-circle mr-1" alt="Chris Wood" width="40" height="40">
          <div class="text-muted small text-nowrap mt-2">2:41 am</div>
        </div>
        <div class="flex-shrink-1 bg-light rounded py-2 px-3 mr-3">
          <div class="font-weight-bold mb-1">You</div>
          ${msg.text}.
        </div>
      </div>`);
    }
  });
  // console.log(data);
});

function show_messages(username, sessionID) {
  $("#send_message").prop("disabled", false);
  $("#message_input").prop("disabled", false);
  socket.emit("getMessages", { sessionID });
  console.log(sessionID);
  console.log(username);
  $("#messages").empty();
  $("#active").empty();
  $("#active").append(`<div class="flex-grow-1 pl-3">
  <strong>
    ${username}
  </strong>
</div>`);

  var a = document.getElementById(sessionID);
  var badge = a.getElementsByClassName("badge");
  if (badge.length) {
    $(badge[0]).remove();
  }
  activeSession = sessionID;
  return false;
}

socket.on("deliver", (data) => {
  console.log("delivered", data);
  if (data.session == activeSession) {
    $("#messages").append(`<div class="chat-message-left pb-4">
    <div class="flex-shrink-1 bg-light rounded py-2 px-3 ml-3">
      <div class="font-weight-bold mb-1">
        ${data.username || "anonymous"}
      </div>
      ${data.text}
    </div>
  </div>`);
  } else {
    var a = document.getElementById(data.session);
    if (a) {
      var badge = a.getElementsByClassName("badge");
      if (badge.length) {
        var number = parseInt(badge[0].innerText);
        badge[0].innerText = number + 1;
      }
      //badge not present
      else {
        var div = a.getElementsByClassName("d-flex")[0];
        $(div).prepend(`<div class="badge bg-success float-right">
        1
      </div>`);
      }
    }
  }
});

function getMessageText() {
  var $message_input;
  $message_input = $("#message_input");
  return $message_input.val();
}

function sendMessage(text) {
  if (text.trim() === "") {
    return;
  }

  socket.emit("message", { text, session: activeSession }); //send message to server

  $("#message_input").val("");

  $("#messages").append(`<div class="chat-message-right mb-4">
  <div>
    <img src="https://bootdey.com/img/Content/avatar/avatar1.png" class="rounded-circle mr-1" alt="Chris Wood" width="40" height="40">
    <div class="text-muted small text-nowrap mt-2">2:41 am</div>
  </div>
  <div class="flex-shrink-1 bg-light rounded py-2 px-3 mr-3">
    <div class="font-weight-bold mb-1">You</div>
    ${text}.
  </div>
</div>`);
}

$(document).ready(function () {
  $("#send_message").prop("disabled", true);
  $("#message_input").prop("disabled", true);
  $("#message_input").keyup(function (e) {
    if (e.which === 13) {
      console.log("invio");
      return sendMessage(getMessageText());
    }
  });

  $("#send_message").click(function (e) {
    return sendMessage(getMessageText());
  });
});
