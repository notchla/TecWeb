function drawChart(context, filename) {

  $("#description-" + filename).text("The user " + context.username + " was on story " +
        context.name + " for " + context.totalTime + ". The story ended with total of " + context.totalPoints + " points.");

  var dataPoints = [];
  var prevPoints = 0;
  Object.entries(context.activities).forEach((el, _) => {
    dataPoints.push(el[1].points + prevPoints);
    prevPoints = el[1].points;
  });
  var ctx = document.getElementById("chart-" + filename).getContext('2d');
  ctx.canvas.width  = $("#" + filename + " .data").outerWidth();
  ctx.canvas.height = $("#" + filename + " .data").outerWidth() * 0.6;
  var chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from(Array(dataPoints.length).keys()),
      datasets: [{
          data: dataPoints,
          label: "Points",
          borderColor: "#3e95cd",
          fill: false
        }]
      },
      options: {
      title: {
        display: true,
        text: 'Cumulate points during the story progression'
      }
    }
  });

}

$(document).ready(function () {
  $(".description").css("width", $(window).innerWidth() * 0.3);
  $(".data").css("width", $(window).innerWidth() * 0.6);
  $("#accordion").css("margin-top", $("nav").outerHeight());
});
