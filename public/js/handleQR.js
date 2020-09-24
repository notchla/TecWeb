function getQr() {
  var textcode = $("#textcode").val();
  document.getElementById("newqr").innerHTML = "";
  var qrcode = new QRCode(document.getElementById("newqr"), {
    text: textcode,
    width: 400,
    height: 400
  });
}

//per usare lo scanner bisogna creare un div con id "scanner"
$(document).ready(function(){
  Html5Qrcode.getCameras().then(devices => {
    if (devices && devices.length) {
      var cameraId = devices[0].id;
      const html5QrCode = new Html5Qrcode("scanner");
      html5QrCode.start(
      cameraId,
      {
        fps: 10,
        qrbox: 250
      },
      qrCodeMessage => {
        $.ajax({
          type: "get",
          url: "http://localhost:3000/recvqr",
          data: "code=" + qrCodeMessage,
          crossDomain: true,
          success: function(data) {
            console.log(data);
          },
          error: function(data) {
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
})
