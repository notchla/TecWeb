function adduser(name, activityID, time, sessionID, username) {
  console.log($("users"));
  $("#users")
    .append(`<a href="#" class="list-group-item list-group-item-action border-0" id ="${sessionID}">
    <div class="d-flex align-items-start">
      <img
        src="https://bootdey.com/img/Content/avatar/avatar5.png"
        class="rounded-circle mr-1"
        alt="${username}"
        width="40"
        height="40"
      />
      <div class="flex-grow-1 ml-3 userInfo">
        ${username}
        activity : ${activityID}
        time : ${time}
        id : ${sessionID}
        story : ${name}
        <div class="small">
          <span class="fas fa-circle chat-online"></span>
          Online
        </div>
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
//todo populate evaluator, data is an array
socket.on("populate", (data) => {
  data.forEach((user) => {
    console.log("user", user);
    var a = document.getElementById(user.sessionID);

    if (a) {
      console.log("already exists");
      console.log(a.getElementsByClassName("userInfo"));
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

//todo graphical delete
socket.on("delete", (data) => {
  delete userdata[data];
  const id = "#" + data;
  $(id).remove();
  console.log("after delete ", userdata);
});
