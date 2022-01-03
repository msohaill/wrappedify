function changeTab(tab) {

    $("#top-songs").animate({"margin-top": `${tab * -100}vh`}, 500);
    $(".nav-link").removeClass("nav-active");
    $(".nav-link").eq(tab).addClass("nav-active");
    $(".tab").animate({"opacity": "0.99"}, 1);
}

let indexes = [0, 0];
let fArtist = document.getElementsByClassName("artist")[0];
let fArtistInfo = document.getElementsByClassName("artist-info")[0];
let fAlbum = document.getElementsByClassName("album")[0];
let fAlbumInfo = document.getElementsByClassName("album-info")[0];
let lNavArtists = document.getElementById("artist-left-button");
let rNavArtists = document.getElementById("artist-right-button");
let lNavAlbums = document.getElementById("album-left-button");
let rNavAlbums = document.getElementById("album-right-button");
let panelAnimatingState = [false, false];

function leftClick(panelIndex, elementMax, fElement, fElementInfo, lNav, rNav, elementClass) {
    if(panelAnimatingState[panelIndex]) return;

    indexes[panelIndex]--;
    
    fElement.style.marginLeft = `calc(50% - (150px + ${indexes[panelIndex] * 350}px))`;
    fElementInfo.style.marginLeft = `${-indexes[panelIndex] * 100}%`;
    
    if (indexes[panelIndex] == 0) lNav.style.display = "none";
    else lNav.style.display = "initial";

    if (indexes[panelIndex] != elementMax) rNav.style.display = "initial";

    let main = document.getElementsByClassName(elementClass)[indexes[panelIndex]];
    let prevMain = document.getElementsByClassName(elementClass)[indexes[panelIndex] + 1];
    
    prevMain.classList.remove("mid");
    prevMain.classList.add("hidden");
    main.classList.remove("hidden");
    main.classList.add('mid');
    
    panelAnimatingState[panelIndex] = true;
    
    setTimeout(function() {panelAnimatingState[panelIndex] = false;}, 750);
}

function rightClick(panelIndex, elementMax, fElement, fElementInfo, lNav, rNav, elementClass) {
    if(panelAnimatingState[panelIndex]) return;

    indexes[panelIndex]++;

    fElement.style.marginLeft = `calc(50% - (150px + ${indexes[panelIndex] * 350}px))`;
    fElementInfo.style.marginLeft = `${-indexes[panelIndex] * 100}%`;

    if (indexes[panelIndex] == elementMax) rNav.style.display = "none"; 
    else rNav.style.display = "initial";
    
    if (indexes[panelIndex] != 0) lNav.style.display = "initial";

    let main = document.getElementsByClassName(elementClass)[indexes[panelIndex]];
    let prevMain = document.getElementsByClassName(elementClass)[indexes[panelIndex] - 1];
    
    prevMain.classList.remove("mid");
    prevMain.classList.add("hidden");
    main.classList.remove("hidden");
    main.classList.add('mid')
    
    panelAnimatingState[panelIndex] = true;
    
    setTimeout(function() {panelAnimatingState[panelIndex] = false;}, 750);
}


$("#artist-left-button").click(function() {
    leftClick(0, 19, fArtist, fArtistInfo, lNavArtists, rNavArtists, "artist");
});

$("#artist-right-button").click(function() {
    rightClick(0, 19, fArtist, fArtistInfo, lNavArtists, rNavArtists, "artist");
});

$("#album-left-button").click(function() {
    leftClick(1, 9, fAlbum, fAlbumInfo, lNavAlbums, rNavAlbums, "album");
});

$("#album-right-button").click(function() {
    rightClick(1, 9, fAlbum, fAlbumInfo, lNavAlbums, rNavAlbums, "album");
});