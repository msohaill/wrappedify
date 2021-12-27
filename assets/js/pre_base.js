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

$(function(){
    $(this).scrollTop(0);
});

$("#close").click(function() {
    $("#file-error").css("display", "none");
    $("#error-backdrop").css("display", "none");
});

$(window).click(function(event) {
    console.log(event.target);
    if (!$("#file-error").is(event.target) && $("#file-error").has(event.target).length === 0) {
        $("#file-error").css("display", "none");
        $("#error-backdrop").css("display", "none")
    }
});

function validateInput(fileInput) {
    let file_names = []
    let syntaxRegex = /^StreamingHistory\d+.json$/;

    for (let i = 0; i < fileInput.files.length; i++) {
        if (syntaxRegex.test(fileInput.files[i].name)) {
            file_names.push(fileInput.files[i].name);
        } else {
            fileError();
            return;
        }
    } 

    file_names.sort((a, b) => parseInt(a.slice(16, -5)) - parseInt(b.slice(16, -5)));

    for (let i = 0; i < file_names.length; i++) {
        if (parseInt(file_names[i].slice(16, -5)) !== i){
            fileError();
            return;
        }
    }

    fileInput.form.submit();

}

function fileError() {
    let fileForm = document.getElementById("file-form");
    let modal = document.getElementById("file-error");
    let backdrop = document.getElementById("error-backdrop");
    backdrop.style.display = "block";
    modal.style.display = "block";
    backdrop.classList.add("backdrop-animation");
    modal.classList.add("error-animation");
    backdrop.addEventListener("animationend", function(event) {backdrop.classList.remove("backdrop-animation");});
    modal.addEventListener("animationend", function(event) {modal.classList.remove("error-animation");});
    fileForm.reset();
}

function confirmExit() {
    let chk = confirm("Are you sure you want to leave the page?");
    if (chk) window.location = "/";
}