var CounterClass = function(max){
    this.i = 0;
    this.max = max;
    return {
        inc : function(){i = i + 1; i = i % max; return i},
        get : function(){return i}
    }
};

$(document).ready(function(){
    var name = window.location.href.split("/")
    name = name[name.length - 1];
    $.get(`http://localhost:3000/stories/json/${name}`).then(function(data){
        var counter = CounterClass(data.pages);
        updateContent(data.content[counter.get()])
        $(".modal-content").click(function(){
            updateContent(data.content[counter.inc()])
            console.log(i)
        })
    }, function(){alert("error in loading data")})

})

function updateContent(data){
    if (data.type == "desc"){
        updateContentDesc(data.data);
        console.log(data.data)
    }
    else{} //TODO
};

function updateContentDesc(data){
    $("#content").html(data)
}