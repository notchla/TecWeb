$(document).ready(function () {
  $(".container-fluid").css(
    "height",
    $(window).height() -
      $(".navbar").outerHeight()
  );

  $(".container-fluid .row").each(function() {
    $(this).css("height", $(".container-fluid").outerHeight() / 3.1);
    $(this).css("width", $(window).width());
  });

  $(".container-fluid .row img").css("height", $(".container-fluid .row").height() * 0.8 - $(".container-fluid .row span").outerHeight());
});
