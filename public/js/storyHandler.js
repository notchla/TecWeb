var CounterClass = function(max){
    this.i = 0;
    this.max = max;
    return {
        inc : function(){i = i + 1; i = i % max; return i},
        get : function(){return i}
    }
};

var counter;
var story_data;

function updateContent(data){
    $.get(`/stories/template/${data.type}`).then(function(handlebar){
        var template = Handlebars.compile(handlebar)
        var context = data.data;
        var html = template(context)
        document.getElementById("entry-template").innerHTML = html
        addCompletedScript(data.js_completed);
    }, function(){alert("error in loading template")})
};

$(document).ready(function(){
    var name = window.location.href.split("/")
    name = name[name.length - 1];
    $.get(`/stories/json/${name}`).then(function(data){
        counter = CounterClass(data.pages);
        story_data = data;
        updateContent(data.content[counter.get()]);

    }, function(){alert("error in loading data")})

})

function addCompletedScript(scriptName){
    var old_script = document.getElementById("activity_checker")
    if(old_script){
        old_script.parentNode.removeChild(old_script);
    }
    var head = document.getElementsByTagName("head")[0];
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.onload = function() {
        activity_checker();
    }
    script.src = scriptName;
    script.id = "activity_checker"
    head.appendChild(script);
}