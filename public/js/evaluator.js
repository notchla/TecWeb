var activeSession;

function adduser(name, activityID, time, sessionID, username) {
  console.log($("users"));
  $("#users")
    .append(`<a href="#" onclick="return show_messages('${sessionID}')" style="height:100px;" class="my-1 px-2 list-group-item list-group-item-action border-0" id ="${sessionID}">
      <div class="ml-3 userInfo">
        <div class="d-flex justify-content-between">
          <h4>${username}</h4>
          <small class="timer mr-1 mt-1"> ${time} </small>
        </div>
        <div class="ml-2 row">
          <p class="ml-0 mb-0 mr-auto" style="font-weight: lighter; color:#666666;">
          In story <span style="font-weight: bold;""> ${name} </span> on activity ${activityID}
          </p>
          <div class="ml-auto mr-1 mt-3 warning-container"></div>
          <div class="ml-auto mr-4 mt-3 notify-container"></div>
        </div>
      </div>
  </a>`);
}

function updateUser(user, name, activityID, time, username) {
  var info = user.getElementsByClassName("userInfo");
  $(info).after(`<div class="ml-3 userInfo">
    <div class="d-flex w-100 justify-content-between">
      <h4>${username}</h4>
      <small class="timer mt-1"> ${time} </small>
    </div>
    <div class="ml-2 row">
      <p class="ml-0 mb-0 mr-auto" style="font-weight: lighter; color:#666666;">
      In story <span style="font-weight: bold;""> ${name} </span> on activity ${activityID}
      </p>
      <div class="ml-auto mr-1 mt-3 warning-container"></div>
      <div class="ml-auto mr-4 mt-3 notify-container"></div>
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
const socket = io("http://site192009.tw.cs.unibo.it:8000", {
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
      <div class="flex-shrink-1 bg-messages rounded py-2 px-3 ml-3">
        <div class="font-weight-bold mb-1">
          ${msg.username || "anonymous"}
        </div>
        ${msg.text}
      </div>
    </div>`);
    } else if (msg.side == "right") {
      $("#messages").append(`<div class="chat-message-right mb-4">
        <div class="flex-shrink-1 bg-messages rounded py-2 px-3 mr-3">
          <div class="font-weight-bold mb-1">You</div>
          ${msg.text}.
        </div>
      </div>`);
    }
  });
  // scroll to bottom
  $(".chat-messages").animate(
    { scrollTop: $(".chat-messages").prop("scrollHeight") },
    700
  );
});

function change_name(caller, sessionID) {
  var newName = caller.prev('.form-control').val();
  $("#" + sessionID + " h4").text(newName);
  console.log(newName)
  socket.emit('changeName', {
    sessionID: sessionID,
    newName: newName
  });
}

function show_messages(sessionID) {
  // close toolbar on user click
  $("#sidebar").removeClass("active");
  $("#send_message").prop("disabled", false);
  $("#message_input").prop("disabled", false);

  var username = $("#" + sessionID + " h4").text();

  socket.emit("getMessages", { sessionID });
  console.log(sessionID);
  console.log(username);
  $("#messages").empty();
  $("#active").empty();
  $("#active").append(`<div class="flex-grow-1 pl-3 ml-3">
    <div class="row input-group">
      <input type="text" class="col-6 form-control bg-dark text-white" value="${username}"></input>
      <button type="button" class="col-4 form-control btn btn-secondary text-white" onclick="change_name($(this), '${sessionID}')"> Change </button>
    </div>
  </div>`);

  $("#results-button").remove()
  if(userdata[sessionID].completed){
    var info = userdata[sessionID].completed;
    $("#active-user-navbar").append(`<button id="results-button" type="button" class="btn btn-info" onclick="return downloads_results('${info.results_id}')">Results!</button>`);
  }

  var a = document.getElementById(sessionID);
  var badge = a.getElementsByClassName("notify-container");
  if (badge.length) {
    $(badge).empty();
  }
  activeSession = sessionID;
  return false;
}

function validateAnswer(won, caller, session) {
  var evaluation = {}

  // message element is 3 levels over the button
  var message = caller.parent().parent().parent();
  message.addClass("disabled-message");

  evaluation.session = session;

  if(won) {
    evaluation.index = 1;
  } else {
    evaluation.index = 0;
  }
  // the score is in the previous element with class score, relative to the caller (buttons)
  evaluation.score = caller.prev('.score').val();

  socket.emit("returnValidation", evaluation);
}

socket.on("requestValidation", (data) => {
  console.log("validate", data);
  if (data.session == activeSession) {
    $("#messages").append(`<div class="chat-message-left pb-4">
    <div class="flex-shrink-1 bg-messages rounded py-2 px-3 ml-3">
      <div class="font-weight-bold mb-1">
        ${data.username || "anonymous"}
      </div>
      <span>
        The user is requesting evaluation for the activity ${data.activity}.
        <br/>
        The submitted answer is: ${data.answer[0]}
      </span>
      <br/>
      <img class="ml-5 mr-auto mt-3 center-block img-fluid rounded" src= ${data.answer[1]}>
      <div class="input-group mt-3 mb-1">
        <input type="text" class="mr-2 form-control score" placeholder="Score"/>
        <button type="button" class="form-control btn btn-success" onclick="return validateAnswer(true, $(this), '${data.session}')"> Good </button>
        <button type="button" class="form-control btn btn-warning" onclick="return validateAnswer(false, $(this), '${data.session}')"> Bad </button>
      </div>
  </div>`);
  } else {
    var a = document.getElementById(data.session);
    if (a) {
      var badge = $(`#${data.session} .notify-container .badge`);
      if (badge.length) {
        var number = parseInt(badge[0].innerText);
        badge[0].innerText = number + 1;
      }
      //badge not present
      else {
        var div = a.getElementsByClassName("notify-container")[0];
        $(div).prepend(`<div class="badge bg-info">
        1
      </div>`);
      }
    }
  }
  // scroll to bottom
  $(".chat-messages").animate(
    { scrollTop: $(".chat-messages").prop("scrollHeight") },
    700
  );
});

socket.on("deliver", (data) => {
  console.log("delivered", data);
  if (data.session == activeSession) {
    $("#messages").append(`<div class="chat-message-left pb-4">
    <div class="flex-shrink-1 bg-messages rounded py-2 px-3 ml-3">
      <div class="font-weight-bold mb-1">
        ${data.username || "anonymous"}
      </div>
      ${data.text}
    </div>
  </div>`);
  } else {
    var a = document.getElementById(data.session);
    if (a) {
      var badge = $(`#${data.session} .notify-container .badge`);
      if (badge.length) {
        var number = parseInt(badge[0].innerText);
        badge[0].innerText = number + 1;
      }
      //badge not present
      else {
        var div = a.getElementsByClassName("notify-container")[0];
        $(div).prepend(`<div class="badge bg-info">
        1
      </div>`);
      }
    }
  }
  // scroll to bottom
  $(".chat-messages").animate(
    { scrollTop: $(".chat-messages").prop("scrollHeight") },
    700
  );
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
  <div class="flex-shrink-1 bg-messages rounded py-2 px-3 mr-3">
    <div class="font-weight-bold mb-1">You</div>
    ${text}.
  </div>
</div>`);
}

//trigger download in the browser
function downloadObjectAsJson(exportObj, exportName){
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
  var downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href",     dataStr);
  downloadAnchorNode.setAttribute("download", exportName);
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function downloads_results(results_id){
  $.get(`/results/${results_id}.json`).then((results) => {
    console.log("results", results)
    downloadObjectAsJson(results, results_id+".json")
  }).catch(() => alert("error fetching results, try again"))
}

socket.on("create-results", (data) => {
  userdata[data.userid].completed = data;
  console.log("results created", data)
  if(activeSession == data.userid){
    console.log("active user has completed")
    var info = userdata[data.userid].completed
    $("#results-button").remove()
    $("#active-user-navbar").append(`<button id="results-button" type="button" class="btn btn-info" onclick="return downloads_results('${info.results_id}')">Results!</button>`);

  }
  // badges
  $("#" + data.userid + " .warning-container").remove();
  var a = document.getElementById(data.userid);
  var div = a.getElementsByClassName("notify-container")[0];
  $(div).after(`<div class="badge bg-success mr-3 ml-auto">
    Done!
  </div>`);
  $("#" + data.userid + " .notify-container").remove();

})

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

  // execute timers every second
  var d;
  var now = 0;
  var t = setInterval(() => {
    d = new Date();
    now = d.getTime();
    for (const [_, user] of Object.entries(userdata)) {
      // console.log("user time", user.time);
      // update time indicators
      var elapsed = now - user.time;
      // console.log("elapsed", elapsed);
      $("#" + user.sessionID + " .timer").text(msToTime(elapsed));
      if (elapsed > 3 * 60 * 1000 && !user.notified) {
        // stuck for long time, add badge
        user.notified = true;
        $("#" + user.sessionID + " .warning-container").prepend(
          '<div class="badge bg-warning"> ! ! ! </div>'
        );
      } else if (elapsed < 3 * 60 * 1000) {
        // remove badge, proceeded to next activity
        user.notified = false;
        $("#" + user.sessionID + " .warning-container").empty();
      }
    }
  }, 1000);
});
