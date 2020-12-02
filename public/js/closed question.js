function activity_checker() {
  function handle_response(response) {
    console.log(response);
    const index = story_data.nodes[current_node].content.answer.findIndex(
      (el) => el === response
    );
    if (index != -1) {
      const adjIndex = getAdjIndex();
      const adj = story_data.adj[adjIndex];
      setAdjIndex(adj.v[index]);
      const nodeIndex = getNodeIndex(adj.v[index]);
      current_node = nodeIndex;
      updateContent(story_data.nodes[nodeIndex]);
    } else {
      alert("error loading next activity");
    }
  }
  $("#response button").click(function (event) {
    console.log($(this).text());
    handle_response($(this).text());
  });
}
