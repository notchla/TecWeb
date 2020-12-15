function activity_checker() {
  function handle_response(response) {
    console.log(response);
    const index = story_data.nodes[current_node].content.answer.findIndex(
      (el) => el === response
    );
    if (index != -1) {
      //todo handle error for wrong response, needs support in creator
      const adjIndex = getAdjIndex();
      const adj = story_data.adj[adjIndex];
      setAdjIndex(adj.v[index]);
      const nodeIndex = getNodeIndex(adj.v[index]);
      current_node = nodeIndex;
      updateContent(story_data.nodes[nodeIndex]);
    } else { //error todo test
      const adjIndex = getAdjIndex();
      const adj = story_data.adj[adjIndex];
      setAdjIndex(adj.v[0]);
      const nodeIndex = getNodeIndex(adj.v[0]);
      current_node = nodeIndex;
      updateContent(story_data.nodes[nodeIndex]);
    }
  }
  // $("#response button").click(function (event) {
  //   console.log($(this).text());
  //   handle_response($(this).text());
  // });

  document.getElementById("response").addEventListener("submit", (evt) => {
    evt.preventDefault();
    const form = evt.target;
    const response = form.elements["response-text"].value;
    handle_response(response);
  });
}
