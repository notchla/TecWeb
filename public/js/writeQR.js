function writeQR(textcode) {
  $("#newqr").append('<div id="' + textcode + '-qr-image"> </div>');
  limit = Math.min($(document).width(), $(document).height());
  var qrcode = new QRCode(document.getElementById(textcode + "-qr-image"), {
    text: "http://site192009.tw.cs.unibo.it/stories/get/" + textcode,
    width: limit*0.80,
    height: limit*0.80
  });

  $("#newqr img").attr('alt', 'QR code of this story');
}
