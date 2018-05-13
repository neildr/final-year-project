$("div.clickable").click(function() {
   $(this).next().slideToggle();
});

function changeDist(evt, dist){
    var displayContent;
    var distBtn;

    //hide displayContent
    displayContent = document.getElementsByClassName("displayContent");
    for (var i = 0; i < displayContent.length; i++) {
        displayContent[i].style.visibility = "hidden";
    }
    //remove active from buttons
    distBtn = document.getElementsByClassName("distBtn");
    for (var i = 0; i < distBtn.length; i++) {
        distBtn[i].className =  distBtn[i].className.replace(" active", "");
    }
    //show current tab
    document.getElementById(dist).style.visibility =  "visible";
    evt.currentTarget.className += " active";
}


document.getElementById("defaultDist").click();
