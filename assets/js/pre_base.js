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
            fileError(1);
            return;
        }
    } 

    file_names.sort((a, b) => parseInt(a.slice(16, -5)) - parseInt(b.slice(16, -5)));

    for (let i = 0; i < file_names.length; i++) {
        if (parseInt(file_names[i].slice(16, -5)) !== i){
            fileError(1);
            return;
        }
    }

    let = totalSize = 0;

    for(let i = 0; i < fileInput.files.length; i++) {
        totalSize += fileInput.files[i].size / 1024 / 1024;
    }

    if (totalSize > 300) {
        fileError(2);
        return;
    }

    fileInput.form.submit();

}

function fileError(n) {
    let fileForm = document.getElementById("file-form");
    let modal = document.getElementById("file-error");
    let backdrop = document.getElementById("error-backdrop");
    let errorMsg = document.getElementById("error-msg");

    if (n == 1) {
        errorMsg.innerHTML = 'The files uploaded either do not follow the specified naming format (\'StreamingHistory#.json\') or do not contain all such files.<br><br>Please try again and make sure to select <em>all</em> files in your Spotify personal data folder that followed the specified naming convention.';
    } else if (n == 2) {
        errorMsg.innerHTML = 'Your files are too large. Unfortunately we will not be able to process your requst. If you would still like to try out Wrappedify, try uploading fewer files.<br><br>Again, we are sorry for not being able to analyse your listening.'
    }

    backdrop.style.display = "block";
    modal.style.display = "block";
    backdrop.classList.add("backdrop-animation");
    modal.classList.add("error-animation");
    backdrop.addEventListener("animationend", function(event) {backdrop.classList.remove("backdrop-animation");});
    modal.addEventListener("animationend", function(event) {modal.classList.remove("error-animation");});
    fileForm.reset();
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}