function startQRReader() {
  var height = $("#scenner-location").css.height;
  $("#scenner-location").empty();
  $("#scenner-location").append('<video style="width: auto; height: ' + height + ';" id="preview"></video>');

  let scanner = new Instascan.Scanner({
    continuous: true,
    video: document.getElementById('preview'),
    mirror: false,
    captureImage: false,
    backgroundScan: true,
    refractoryPeriod: 5000,
    scanPeriod: 12 // capture at 10 fps
  });

  scanner.addListener('scan', function (content) {
    $.ajax({
      type: "get",
      url: "/stories/exists/" + content,
      crossDomain: true,
      success: function(data) {
        if(data.exists == "true") {
          scanner.stop();
          window.location = window.location + "stories/get/" + content;
        } else {
          alert("story does not exist. Try again.");
        }
      },
      error: function(data) {
        console.log("error");
        console.log(data);
        html5QrCode.stop();
      }
    });
  });

  Instascan.Camera.getCameras().then(function (cameras) {
    if (cameras.length > 0) {
      scanner.start(cameras[0]);
    } else {
      console.error('No cameras found.');
    }
  }).catch(function (e) {
    console.error(e);
  });
}
