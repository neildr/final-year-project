$("div.clickable").click(function() {
   $(this).next().slideToggle();
});

function changeDist(dist, old){
    var displayContent;
    var distBtn;
    //hide old displayContent
    document.getElementById(old).style.visibility = "hidden";
    //show new content
    document.getElementById(dist).style.visibility =  "visible";
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
//initialises buttons
var defaultDist = document.getElementById("defaultDist");
if (defaultDist != null){
    defaultDist.click();
}
var defaultDist1 = document.getElementById("defaultDist1");
if (defaultDist1 != null){
    defaultDist1.click();
}
