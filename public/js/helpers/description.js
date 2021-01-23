function activity_checker() {
  var sound = null;
  console.log(story_data.nodes[current_node])
  if (story_data.nodes[current_node].content.audio) {
    var source = story_data.nodes[current_node].content.audio;
    sound = new Howl({
      src: [source],
      autoplay: true,
      loop: false,
      volume: 0.2,
      onend: function() {
      }
    });
    $("#button_play").prop("disabled", true);
    $("#button_stop").prop("disabled", false);

    $("#button_play").click(function(event) {
      sound.play();
      $("#button_play").prop("disabled", true);
      $("#button_stop").prop("disabled", false);
      event.stopPropagation();
    });
    $("#button_stop").click(function(event) {
      sound.pause();
      $("#button_play").prop("disabled", false);
      $("#button_stop").prop("disabled", true);
      event.stopPropagation();
    });
  } else {
    $("#button_play").remove();
    $("#button_stop").remove();
  }

  if(!story_data.nodes[current_node].content.image) {
    $("img.rounded").remove();
  }

  //called on script load
  $(".modal-content").click(function () {
    if(sound) sound.stop();
    const index = getAdjIndex();
    const adj = story_data.adj[index];
    setAdjIndex(adj.v[0]);
    const nodeIndex = getNodeIndex(adj.v[0]);
    current_node = nodeIndex;
    updateContent(story_data.nodes[nodeIndex], 1);
  });
}
