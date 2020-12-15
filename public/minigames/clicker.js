function game_checker() {
  $(document).ready(function(){
    var body = document.body;
    var width = $("#myModal").width();
    var height = $("#myModal").height();
    var button = $(".play-button")
    var divLeft = $("#game-left");
    var divRight = $("#game-right");
    var divBox = $("#game-box");
    var spanScores = $("#game-scores");
    var closeBox = $("#game-close-score");
    var arrayColor = ["#011C41","#F2E8C3","#F5A219","#F27612","#DA2A04","#FF77A6","#FFC7B2","#A0FEFE","#B6FFBC","#FFBBFF"];
    var countDown = 5;
    var countPlus = 0;
    var count = 0;
    function Ball(width, height, arrayColor){
      this.color = arrayColor[Math.floor(Math.random()*10)];
      this.width = width;
      this.height = height;
      this.radius = Math.floor(Math.random()*100) + 50;
      this.left = Math.floor(Math.random() * (this.width - this.radius)) ;
      this.top = -this.radius;
      this.speedY = 5;
    }
    Ball.prototype.draw = function(ball){
      body.appendChild(ball);
      ball.style.width = ball.style.height = this.radius + "px";
      ball.style.top = this.top + "px";
      ball.style.left = this.left + "px";
      ball.style.background = this.color;

      setTimeout(function(){
        ball.remove();
        clearInterval(move);
      },5500);

      let random = Math.floor(Math.random()* this.speedY);
      var move = setInterval(function(){
          var top = parseInt( ball.style.top.substr(0,ball.style.top.length - 2) ) + random;
          ball.style.top = top + "px";
          if(top > window.innerHeight){
            ball.remove();
            clearInterval(move);
          }
       },10);

       ball.addEventListener("click",function(){
         ball.remove();
         count+=1;
     });
    }

    function createBall(){
      var ball = document.createElement("div");
      ball.classList.add("ball");
      var ballRand = new Ball(width,height,arrayColor);
      ballRand.draw(ball);
    }
    closeBox.click(function(){
      divBox.css("transform", "translate(-550%,-50%)");
      setTimeout(function(){
        divLeft.css("height", "100%");
        divRight.css("height", "100%");
        button.css("display", "block");
      },1000);
    });

    button.click(function(){
      divLeft.css("height", "0px");
      divRight.css("height", "0px");
      button.css("display", "none");
      count = 0;
      var startCreateBall = setInterval(createBall,400);
      setTimeout(function(){
        clearInterval(startCreateBall);
        divBox.css("transform", "translate(-50%,-50%)");
        spanScores.text(count);
      },20000);
    });
  });
}
