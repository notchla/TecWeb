function activity_checker() {
  //called on script load
  $(".modal-content").click(function () {
    updateContent(story_data.nodes[counter.inc()]);
  });
}
