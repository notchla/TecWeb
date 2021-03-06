function startQRReader() {
  var height = ($(window).height() - $(".navbar").outerHeight()) / 3.2;
  $("#scenner-location").html('<video style="width: auto; height: ' + height + 'px;" id="preview"></video>');

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
        scanner.stop();
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
