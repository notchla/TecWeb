function activity_checker() {
  function handle_response(response) {
    var score = 0;
    var index = story_data.nodes[current_node].content.answer.findIndex(
      (el) => el === response
    );
    index = index + 1; //translated by 1, 0 is the error
    if (index != -1) {
      //todo handle error for wrong response, needs support in creator
      const adjIndex = getAdjIndex();
      const adj = story_data.adj[adjIndex];
      setAdjIndex(adj.v[index]);
      const nodeIndex = getNodeIndex(adj.v[index]);
      if (story_data.nodes[current_node].content.answerscore) {
        score = parseInt(
          story_data.nodes[current_node].content.answerscore[index]
        );
      }
      current_node = nodeIndex;
      updateContent(story_data.nodes[nodeIndex], score);
    } else {
      //error todo test
      const adjIndex = getAdjIndex();
      const adj = story_data.adj[adjIndex];
      setAdjIndex(adj.v[0]);
      const nodeIndex = getNodeIndex(adj.v[0]);
      if (story_data.nodes[current_node].content.answerscore) {
        score = parseInt(story_data.nodes[current_node].content.answerscore[0]);
      }
      current_node = nodeIndex;
      updateContent(story_data.nodes[nodeIndex], score);
    }
  }

  document.getElementById("response").addEventListener("submit", (evt) => {
    evt.preventDefault();
    const form = evt.target;
    const response = form.elements["response-text"].value;
    handle_response(response);
  });
}
