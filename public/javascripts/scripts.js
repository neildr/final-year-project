$("div.clickable").click(function() {
    $(this).next().slideToggle();
});
//change the pie chart thats gets shown
function changePie(dist, old) {
    var displayContent;
    var distBtn;
    //hide old displayContent
    document.getElementById(old).style.visibility = "hidden";
    //show new content
    document.getElementById(dist).style.visibility = "visible";
}

//change graph thats gets shown
function changeGraph(graph) {
    var showGraph = document.getElementById(graph);
    showGraph.style.visibility = "visible";
    var allGraphs = document.getElementsByClassName("displayGraph");
    for (var i = 0; i < allGraphs.length; i++) {
        if (allGraphs[i].id != graph) {
            allGraphs[i].style.visibility = "hidden";
        }
    }
}
//button 1 style toggle
$(".distBtn").click(function() {
    if (!$(this).hasClass("active")) {
        $(".distBtn").toggleClass(" active");
    }
});
//button 2 style toggle
$(".distBtn1").click(function() {
    if (!$(this).hasClass("active")) {
        $(".distBtn1").toggleClass(" active");
    }
});

//more button styling
$(".graphBtn").click(function() {
    if (!$(this).hasClass("active")) {
        if ($("button#graphBtn").hasClass("active")) {
            $("button#graphBtn").removeClass("active");
        }

        if ($("button#graphBtn1").hasClass("active")) {
            $("button#graphBtn1").removeClass("active");
        }

        if ($("button#graphBtn2").hasClass("active")) {
            $("button#graphBtn2").removeClass("active");
        }

        if ($("button#graphBtn3").hasClass("active")) {
            $("button#graphBtn3").removeClass("active");
        }

        $(this).addClass("active");
    }
});

//initialises buttons and displayed graphs
var defaultDist = document.getElementById("defaultDist");
if (defaultDist != null) {
    defaultDist.click();
}
var defaultDist1 = document.getElementById("defaultDist1");
if (defaultDist1 != null) {
    defaultDist1.click();
}
var defaultGraph = document.getElementById("graphBtn");
if (defaultGraph != null) {
    defaultGraph.click();
}

//compare form on live game

var count = 0;
//limits checkboxes to 2
$('input.checkboxC').on('change', function(evt) {
    if ($(this).siblings(':checked').length >= 2) {
        this.checked = false;
    } else {
        count++;
    }
});
//submits if 2 checkboxes are checked
function compareFormSubmit() {
    if (count === 2) {
        document.compareForm.submit();
    } else {
        alert("Please select 2 players to compare");
    }
}
