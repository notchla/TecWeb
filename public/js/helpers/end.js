function activity_checker(){

    socket.emit("end", {})
    socket.on("show-result-id", (data) => {
        console.log(data)
        $("#result-id").text(data)
        $("#story-id-modal").modal("show")
    })
}