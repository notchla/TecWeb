function activity_checker() {
  //called on script load
  $("#game-close-score").click(function () {
    var index = 0;
    var points = parseInt($("#game-scores").text(),10);
    if (points > parseInt(story_data.nodes[current_node].content.minscore, 10)) {
      // won
      index = 1;
    }
    const adjIndex = getAdjIndex();
    const adj = story_data.adj[adjIndex];
    setAdjIndex(adj.v[index]);
    const nodeIndex = getNodeIndex(adj.v[index]);
    current_node = nodeIndex;
    updateContent(story_data.nodes[nodeIndex]);
  });
}
