function activity_checker() {
  answer_image = "";

  function handle_response() {
    answer = $("#response-text").val().replace(/\s/g, "");

    socket.emit("requestValidation", {
      activity: story_data.nodes[current_node].id,
      answer: [answer, answer_image],
    });
    $("#response-button").prop("disabled", true);
    $("#wait-here").text("Waiting for evaluation... ");
  }

  function resizeImage(base64, newHeight) {
    return new Promise((resolve, reject) => {
      var canvas = document.createElement("canvas");
      let context = canvas.getContext("2d");
      let img = document.createElement("img");
      img.src = base64;
      img.onload = function () {
        if (img.height > newHeight) {
          var newWidth = (newHeight / img.height) * img.width;
          context.canvas.width = newWidth;
          context.canvas.height = newHeight;
          context.scale(newWidth / img.width, newHeight / img.height);
        }
        context.drawImage(img, 0, 0);
        resolve(canvas.toDataURL());
      };
    });
  }

  function sendPic() {
    return new Promise((resolve, reject) => {
      var file = $("#response-image")[0].files[0];
      if (file) {
        var reader = new FileReader();
        reader.onloadend = function () {
          resizeImage(reader.result, 128).then((result) => {
            resolve(result);
          });
        };
        reader.readAsDataURL(file);
      }
    });
  }

  $("#response-image").on("change", () => {
    sendPic().then((result) => {
      answer_image = result;
      var preview =
        '<img src="' +
        answer_image +
        '" class="img-fluid rounded" alt="your image prieview">';
      $("#preview-img").html(preview);
    });
  });

  $("#response-button").click(function (event) {
    handle_response();
  });

  socket.on("returnValidation", (data) => {
    // transition on validator response
    const adjIndex = getAdjIndex();
    const adj = story_data.adj[adjIndex];
    setAdjIndex(adj.v[data.index]);
    const nodeIndex = getNodeIndex(adj.v[data.index]);

    if (data.score) {
      total_score += parseInt(data.score);
    }

    current_node = nodeIndex;

    updateContent(story_data.nodes[nodeIndex], parseInt(data.score));
  });
}
