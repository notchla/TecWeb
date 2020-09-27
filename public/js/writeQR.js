//immediatly create the qr code for the current story
$(document).ready(function() {
  var textcode = window.location.href.split("/")
  textcode = textcode[textcode.length - 1];
  document.getElementById("newqr").innerHTML = "";
  var qrcode = new QRCode(document.getElementById("newqr"), {
    text: textcode,
    width: $(document).width()*0.80,
    height: $(document).width()*0.80
  });
})
