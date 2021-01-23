var qr = new QCodeDecoder();

$(document).ready(function() {
  // open file uploader on click
  $("#open-upload").click(function() {
    document.getElementById("scenner-location").click()
  });

  $("#scenner-location").on("change", () => {
    var file = $("#scenner-location")[0].files[0];
    if (file) {
      var reader = new FileReader();
      reader.onloadend = function () {
        qr.decodeFromImage(reader.result, function (err, result) {
          if (err) {
            alert("No QR was found in that image!")
          } else {
            var results = result.split("/");
            result = results[results.length - 1];
            $.ajax({
              type: "get",
              url: "/stories/exists/" + result,
              crossDomain: true,
              success: function(data) {
                if(data.exists == "true") {
                  window.location = window.location + "stories/get/" + result;
                } else {
                  alert("story does not exist. Try again...");
                }
              },
              error: function(data) {}
            });
          }
        });
      }
      reader.readAsDataURL(file);
    } else {
      alert("not an image!")
    }
  });
})
