(function () {
  var Message;
  Message = function (arg) {
    (this.text = arg.text), (this.message_side = arg.message_side);
    this.draw = (function (_this) {
      return function () {
        var $message;
        $message = $($(".message_template").clone().html());
        $message.addClass(_this.message_side).find(".text").html(_this.text);
        $(".messages").append($message);
        return setTimeout(function () {
          return $message.addClass("appeared");
        }, 0);
      };
    })(this);
    return this;
  };
  $(function () {
    var getMessageText, message_side, sendMessage;
    message_side = "right";
    getMessageText = function () {
      var $message_input;
      $message_input = $(".message_input");
      return $message_input.val();
    };
    sendMessage = function (text) {
      var $messages, message;
      if (text.trim() === "") {
        return;
      }

      socket.emit("message", { text }); //send message to server

      $(".message_input").val("");
      $messages = $(".messages");
      message_side = "right";
      message = new Message({
        text: text,
        message_side: message_side,
      });
      message.draw();
      return $messages.animate(
        { scrollTop: $messages.prop("scrollHeight") },
        300
      );
    };

    var receiveMessage = function (text) {
      var $messages, message;
      if (text.trim() === "") {
        return;
      }

      $(".message_input").val("");
      $messages = $(".messages");
      message_side = "left";
      message = new Message({
        text: text,
        message_side: message_side,
      });
      message.draw();
      return $messages.animate(
        { scrollTop: $messages.prop("scrollHeight") },
        300
      );
    };
    $(".send_message").click(function (e) {
      return sendMessage(getMessageText());
    });
    $(".message_input").keyup(function (e) {
      if (e.which === 13) {
        return sendMessage(getMessageText());
      }
    });

    socket.on("deliver", (data) => {
      receiveMessage(data);
    });
    // sendMessage("Hello Philip! :)");
    // setTimeout(function () {
    //   return sendMessage("Hi Sandy! How are you?");
    // }, 1000);
    // return setTimeout(function () {
    //   return sendMessage("I'm fine, thank you!");
    // }, 2000);
  });
}.call(this));

$(document).ready(function () {
  $("#slider").slideUp();
  $(document).on("click", "#close", function (e) {
    var panel = $("#slider");
    if (!panel.hasClass("panel-collapsed")) {
      $(".chat_window").css({ height: "auto" });
      panel.slideUp();
      panel.addClass("panel-collapsed");
    } else {
      panel.slideDown(() => $(".chat_window").css({ height: "500px" }));
      panel.removeClass("panel-collapsed");
    }
  });
});
