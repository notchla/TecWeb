const userdata = {}

console.log("socket");
//socket handling
const socket = io("http://localhost:8000", {
transports: ["websocket"],
path: "/socket", // needed for cors in dev
});

socket.emit("registerEvaluator", {});
socket.emit("populateEvaluator", {})
//todo populate evaluator, data is an array
socket.on("populate", (data) => {
    var ul = document.getElementById("connected-user")
    data.forEach(user => {
        var li = document.getElementById(user.sessionID);
        if(li){
            var text = `${user.name}, ${user.activityID}, ${user.time}, ${user.sessionID}, ${user.username ? user.username : "anonymous"}`    
            li.innerText = text
        }
        else{ //ul doesnt exists
            li = document.createElement("li");
            li.classList.add("list-group-item")
            li.setAttribute("id", user.sessionID)
            var text = document.createTextNode(`${user.name}, ${user.activityID}, ${user.time}, ${user.sessionID}, ${user.username ? user.username : "anonymous"}`)
            li.appendChild(text)
            ul.appendChild(li)
        }
        
        userdata[user.sessionID] = user;
    })
    console.log("userdata", userdata)
})

//todo graphical delete
socket.on("delete", (data) => {
    delete userdata[data]
    var li = document.getElementById(data);
    var ul = document.getElementById("connected-user")
    ul.removeChild(li)
    console.log("after delete ", userdata)
})
