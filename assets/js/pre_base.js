$(function() {
    $(window).on("scroll", function() {
        if($(window).scrollTop() > 50) {
            $("header").addClass("active");
            $("header").addClass("active:hover");
        } else {
           $("header").removeClass("active");
           $("header").removeClass("activeHover");
        }
    });
});

$(document).ready(function(){
    $(this).scrollTop(0);
});