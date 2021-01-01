function activity_checker(){
    $("#score-show").css("display","none");
    $(".chat_window").css("display","none");
    socket.emit("end", {})
    socket.on("show-result-id", (data) => {
        console.log(data)
        $("#result-id").text(data)
        $("#story-id-modal").modal("show")
    })
}
