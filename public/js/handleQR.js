function getQr() {
  var textcode = $("#textcode").val();
  document.getElementById("newqr").innerHTML = "";
  var qrcode = new QRCode(document.getElementById("newqr"), {
    text: textcode,
    width: 400,
    height: 400
  });
}


function startQRReader() {
  Html5Qrcode.getCameras().then(devices => {
    if (devices && devices.length) {
      var cameraId = devices[0].id;
      const html5QrCode = new Html5Qrcode("scennerLocation");
      html5QrCode.start(
      cameraId,
      {
        fps: 10,
        qrbox: 450
      },
      qrCodeMessage => {
        console.log(qrCodeMessage);
        $.ajax({
          type: "get",
          url: "http://localhost:3000/checkqr/" + qrCodeMessage,
          crossDomain: true,
          success: function(data) {
            console.log("data");
            console.log(data);
            if(data.exists == "true") {
              html5QrCode.stop();
              //window.location = "http://localhost:3000/stories/" + qrCodeMessage;
            } else {
              alert("story does not exist. Try again.");
            }
          },
          error: function(data) {
            console.log("error");
            console.log(data);
            html5QrCode.stop();
          }
      })
      },
      errorMessage => {
        // parse error
      })
      .catch(err => {
      // Start failed, handle it. For example,
      console.log("Unable to start scanning");
      });
    }
  }).catch(err => {
  });
}
