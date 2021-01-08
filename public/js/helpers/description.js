function activity_checker() {
  //called on script load
  $(".modal-content").click(function () {
    const index = getAdjIndex();
    const adj = story_data.adj[index];
    setAdjIndex(adj.v[0]);
    const nodeIndex = getNodeIndex(adj.v[0]);
    current_node = nodeIndex;

    // add score before calling the update
    total_score += 1;

    updateContent(story_data.nodes[nodeIndex], 1);
  });
}
