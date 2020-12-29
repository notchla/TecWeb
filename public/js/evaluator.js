var activeSession;

function adduser(name, activityID, time, sessionID, username) {
  console.log($("users"));
  $("#users")
    .append(`<a href="#" onclick="return show_messages('${username}', '${sessionID}')" style="height:100px;" class="my-1 px-2 list-group-item list-group-item-action border-0" id ="${sessionID}">
      <div class="ml-3 userInfo">
        <div class="d-flex justify-content-between">
          <h4> ${username} </h4>
          <small class="timer mr-1 mt-1"> ${time} </small>
        </div>
        <div class="ml-2 row">
          <p class="ml-0 mb-0 mr-auto" style="font-weight: lighter; color:#666666;">
          In story <span style="font-weight: bold;""> ${name} </span> on activity ${activityID}
          </p>
          <div class="ml-auto mr-1 mt-3 warning-container"></div>
          <div class="ml-auto mr-3 mt-3 notify-container"></div>
        </div>
      </div>
  </a>`);
}

function updateUser(user, name, activityID, time, username) {
  // console.log(user.)
  var info = user.getElementsByClassName("userInfo");
  $(info).after(`<div class="ml-3 userInfo">
    <div class="d-flex w-100 justify-content-between">
      <h4> ${username} </h4>
      <small class="timer mt-1"> ${time} </small>
    </div>
    <div class="ml-2 row">
      <p class="ml-0 mb-0 mr-auto" style="font-weight: lighter; color:#666666;">
      In story <span style="font-weight: bold;""> ${name} </span> on activity ${activityID}
      </p>
      <div class="ml-auto mr-1 mt-3 warning-container"></div>
      <div class="ml-auto mr-3 mt-3 notify-container"></div>
    </div>
  </div>`);

  $(info)[0].remove();
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
  var d = new Date();
  var now = d.getTime();
  data.forEach((user) => {
    if (user) {
      console.log("user", user);
      var a = document.getElementById(user.sessionID);

      if (a) {
        console.log("already exists");
        console.log(a.getElementsByClassName("userInfo"));
        updateUser(
          a,
          user.name,
          user.activityID,
          msToTime(now - user.time),
          user.username ? user.username : "anonymous"
        );
      } else {
        adduser(
          user.name,
          user.activityID,
          msToTime(now - user.time),
          user.sessionID,
          user.username ? user.username : "anonymous"
        );
      }
      userdata[user.sessionID] = user;
    }
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
  // scroll to bottom
  $(".chat-messages").animate({scrollTop: $(".chat-messages").prop("scrollHeight")}, 700);
});

function show_messages(username, sessionID) {
  // close toolbar on user click
  $("#sidebar").removeClass("active");

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
  var badge = a.getElementsByClassName("notify-container");
  if (badge.length) {
    $(badge).empty();
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
      var badge = $(".notify-container .badge");
      if (badge.length) {
        var number = parseInt(badge[0].innerText);
        badge[0].innerText = number + 1;
      }
      //badge not present
      else {
        var div = a.getElementsByClassName("notify-container")[0];
        $(div).prepend(`<div class="badge bg-success">
        1
      </div>`);
      }
    }
  }
  // scroll to bottom
  $(".chat-messages").animate({scrollTop: $(".chat-messages").prop("scrollHeight")}, 700);
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
  $(".chat-messages").css(
    "height",
    $(window).height() -
      $(".sticky-footer").outerHeight() -
      $(".sticky-top").outerHeight()
  );

  $("#users").css(
    "height",
    $(window).height() - $(".sidenav-header").outerHeight()
  );

  $(".sticky-footer").css("width", $(window).width() - $("#sidebar").width());

  $(window).on("resize", function () {
    $(".chat-messages").css(
      "height",
      $(window).height() -
        $(".sticky-footer").outerHeight() -
        $(".sticky-top").outerHeight() -
        $(".chat-messages").css("padding-bottom")
    );
    $("#users").css(
      "height",
      $(window).height() - $(".sidenav-header").outerHeight()
    );
    $(".sticky-footer").css("width", $(window).width() - $("#sidebar").width());
  });

  $("#sidebarCollapse").on("click", function () {
    if ($("#sidebar").hasClass("active")) {
      $(".chat-messages").css("overflow", "auto");
    } else {
      $(".chat-messages").css("overflow", "hidden");
    }
    $("#sidebar").toggleClass("active");
  });

  // execute timers every 5 seconds
  var d;
  var now = 0;
  var t = setInterval(() => {
    d = new Date();
    now = d.getTime();
    for (const [_, user] of Object.entries(userdata)) {
      // update time indicators
      var elapsed = now - user.time;
      var timer = $("#" + user.sessionID + " .timer").text(msToTime(elapsed));
      if (elapsed > 4 * 60 * 1000 && !userdata.notified) {
        // stuck for long time, add badge
        userdata.notified = true;
        $("#" + user.sessionID + " .warning-container").prepend(
          '<div class="badge bg-warning"> ! ! ! </div>'
        );
      } else if (elapsed < 4 * 60 * 1000) {
        // remove badge, proceeded to next activity
        userdata.notified = false;
        $("#" + user.sessionID + " .warning-container").empty();
      }
    }
  }, 1000);
});
