function activity_checker() {
  $("#indicator-overlay").modal("show");
  var name = window.location.href.split("/");
  name = name[name.length - 1];
  var groupIndex = 0;

  socket.emit("joinGroup", {
    story: name,
    groupsize: story_data.nodes[current_node].content.groupsize
  });

  socket.on("inGroup", (data) => {
    groupIndex = data.index;
    $("#group-container").text("You are in team " + groupIndex);
  });

  socket.on("lobbyFull", () => {
    $("#indicator-overlay").fadeOut(300, function () {
      $("#indicator-overlay").removeClass("in");
      $(".modal-backdrop").remove();
      $("#indicator-overlay").modal("hide");
    });
    
    const adjIndex = getAdjIndex();
    const adj = story_data.adj[adjIndex];
    setAdjIndex(adj.v[groupIndex]);
    const nodeIndex = getNodeIndex(adj.v[groupIndex]);
    current_node = nodeIndex;
    updateContent(story_data.nodes[nodeIndex], 0);
  });
}
