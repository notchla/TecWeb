function adduser(name, activityID, time, sessionID, username) {
  console.log($("users"));
  $("#users")
    .append(`<a href="#" style="height:100px;" class="my-1 px-2 list-group-item list-group-item-action border-0" id ="${sessionID}">
      <div class="ml-3 userInfo">
        <div class="d-flex justify-content-between">
          <h4> ${username} </h4>
          <small class="timer mr-1 mt-1"> ${time} </small>
        </div>
        <div class="ml-2 row">
          <p class="ml-0 mb-0 mr-auto" style="font-weight: lighter; color:#666666;">
          In story <span style="font-weight: bold;""> ${name} </span> on activity ${activityID}
          </p>
          <div class="ml-auto mr-1 mt-3 badge-container"></div>
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
      <div class="ml-auto mr-1 mt-3 badge-container"></div>
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
//todo populate evaluator, data is an array
socket.on("populate", (data) => {
  var d = new Date();
  var now = d.getTime();
  data.forEach((user) => {
    if(user) {
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

//todo graphical delete
socket.on("delete", (data) => {
  delete userdata[data];
  const id = "#" + data;
  $(id).remove();
  console.log("after delete ", userdata);
});

$(document).ready(function () {
  $('.chat-messages').css('height', $(window).height() - $('.sticky-footer').outerHeight() - $('.sticky-top').outerHeight());

  $('#users').css('height', $(window).height() - $('.sidenav-header').outerHeight());

  $('.sticky-footer').css('width', $(window).width() - $('#sidebar').width());

  $(window).on('resize', function(){
    $('.chat-messages').css('height', $(window).height() - $('.sticky-footer').outerHeight() - $('.sticky-top').outerHeight());
    $('#users').css('height', $(window).height() - $('.sidenav-header').outerHeight());
    $('.sticky-footer').css('width', $(window).width() - $('#sidebar').width());
  });


  $('#sidebarCollapse').on('click', function () {
      $('#sidebar').toggleClass('active');
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
      if((elapsed > 1 * 60 * 1000) && (!userdata.notified)) {
        // stuck for long time, add badge
        userdata.notified = true;
        $("#" + user.sessionID + " .badge-container").prepend('<div class="badge bg-warning"> ! ! ! </div>');
      } else if ((elapsed < 1 * 60 * 1000)) {
        // remove badge, proceeded to next activity
        userdata.notified = false;
        $("#" + user.sessionID + " .badge").remove();
      }
    }
  }, 1000);
});
