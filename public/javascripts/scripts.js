$("div.clickable").click(function() {
    $(this).next().slideToggle();
});
//change the pie chart thats gets shown
function changeDist(dist, old) {
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
//count of players selected, should be <2
var count = 0;
//limits checkboxes to 2
$('input.checkboxC').on('change', function(evt) {
    if ($(this).prop('checked')==false) {
        count--;
    } else {
        if ($('input.checkboxC:checked').length > 2) {
            this.checked = false;
        } else {
            count++;
        }
    }
    alert(count);
});
//submits if 2 checkboxes are checked
function compareFormSubmit() {
    if (count >= 2) {
        document.compareForm.submit();
    } else {
        alert("Please select 2 players to compare");
    }
}
//changes colour of delta on compare page
$("document").ready(function() {
  $("div.averageStatDelta").each(function() {
    if ($(this).attr("name") === "Deaths") {
      if ($(this).text() < 0) {
          $(this).addClass("green");
       } else {
          $(this).addClass("red");
       }
    } else {
      if ($(this).text() < 0) {
        $(this).addClass("red");
      } else {
        $(this).addClass("green");
      }
    }
  });
});


//allows resizing of charts - delay to stop web page calling script on every mouse movement
$(window).resize(function() {
    if(this.resizeTimeOut) {
        clearTimeout(this.resizeTimeOut);
    }
    this.resizeTimeOut = setTimeout(function() {
        $(this).trigger('resizeEnd');
    }, 100);
});
