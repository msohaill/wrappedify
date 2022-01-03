function changeTab(tab) {

    $("#top-songs").animate({"margin-top": `${tab * -100}vh`}, 500);
    $(".nav-link").removeClass("nav-active");
    $(".nav-link").eq(tab).addClass("nav-active");
    $(".tab").animate({"opacity": "0.99"}, 1);
}

let index = 0;
let fArtist = document.getElementsByClassName("artist")[0];
let fArtistInfo = document.getElementsByClassName("artist-info")[0];
let lNav = document.getElementById("left-button");
let rNav = document.getElementById("right-button");
let isAnimating = false;

function leftClick(animating) {
    if(animating) return;

    index--;
    
    fArtist.style.marginLeft = `calc(50% - (150px + ${index * 350}px))`;
    fArtistInfo.style.marginLeft = `${-index * 100}%`;
    
    if (index == 0) lNav.style.display = "none";
    else lNav.style.display = "initial";
    if (index != 19) rNav.style.display = "initial";

    let main = document.getElementsByClassName("artist")[index];
    let prevMain = document.getElementsByClassName("artist")[index + 1];
    
    prevMain.classList.remove("mid");
    prevMain.classList.add("hidden");
    main.classList.remove("hidden");
    main.classList.add('mid');
    
    isAnimating = true;
    
    setTimeout(function() {isAnimating = false;}, 750);
}

function rightClick(animating) {
    if(animating) return;

    index++;

    fArtist.style.marginLeft = `calc(50% - (150px + ${index * 350}px))`;
    fArtistInfo.style.marginLeft = `${-index * 100}%`;

    if (index == 19) rNav.style.display = "none"; 
    else rNav.style.display = "initial";
    if (index != 0) lNav.style.display = "initial";

    let main = document.getElementsByClassName("artist")[index];
    let prevMain = document.getElementsByClassName("artist")[index - 1];
    
    prevMain.classList.remove("mid");
    prevMain.classList.add("hidden");
    main.classList.remove("hidden");
    main.classList.add('mid')
    
    isAnimating = true;
    
    setTimeout(function() {isAnimating = false;}, 750);
}


$("#left-button").click(function() {
    leftClick(isAnimating);
});

$("#right-button").click(function() {
    rightClick(isAnimating);
});