window.addEventListener("load", function() { window. scrollTo(0, 0); });
var agreeChk = document.getElementById('agree');
var nextBtn = document.getElementById('next_btn');
var sid = getParameterByName('sid');
var cid = getCid();

document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#agree').addEventListener('change', displayNext);
    displayNext();
});

function displayNext(){
    if(agreeChk.checked){
        nextBtn.style.display = 'block';
    }
    else{
        nextBtn.style.display = 'none';
    }
}

// Display next button only after terms confirmation checkbox is checked.
// If second page submit form and continue to questionnaire.
var isFirstPage = true;
function goNext() {
    if(isFirstPage) {
        document.getElementById('testInstructions').style.display = 'none';
        document.getElementById('companyDescription').style.display = 'block';
        document.getElementById('back_btn').style.display = 'block';
        isFirstPage = false;
    }
    else {
        //console.log("redirect to form");
        var startFormDate = new Date();
        _LTracker.push({
            'text': 'User Start Form',
            'sid': sid,
            'userType': 'candidate',
            'date': startFormDate.toString(),
            'cid': cid
        });
        mixpanel.track('User Start Form', {'sid': sid, 'userType': 'candidate', 'date': startFormDate.toString(), 'cid': cid });
        document.getElementById("formInfo").submit();
    }
}

function goBack() {
    if (!isFirstPage) {
        document.getElementById('testInstructions').style.display = 'block';
        document.getElementById('companyDescription').style.display = 'none';
        document.getElementById('back_btn').style.display = 'none';
        isFirstPage = true;
    }
}

function getParameterByName(name) {
    var url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

// create array of all input elements with class inputs in order to iterate through
// the element with the 'Enter' key.
$('.inputs').keydown(function (e) {
    if (e.which === 13) {
        var index = $('.inputs').index(this) + 1;
        $('.inputs').eq(index).focus();
    }
});

var container = $('#formContainer');

function scrollToNextElement(nextElement) {
    var scrollTo = $('#' + nextElement);
    container.animate({scrollTop: scrollTo.offset().top - container.offset().top +
    container.scrollTop()});
}

var keys = document.getElementsByTagName("input");
var rules = {};

for (var index = 0; index < keys.length; index++) {
    var key = keys[index].name;
    rules[key] = "required";
}

$("#formInfo").validate({
    ignore: "",
    success: function(label,element) {
        //element.find("input").css( "border", "solid green 1px" );
        element.style.border= "solid green 1px" ;
    },
    //debug: true,
    rules: rules,
    messages: {
    },
    errorElement: "div",
    wrapper: "div",  // a wrapper around the error message
    errorPlacement: function(error, element) {
        element.before(error);

        //element.parent("div").find("a").css( "border", "solid red 1px" );
        element.css( "border", "solid red 1px" );
        offset = element.offset();
        error.css('left', offset.left);
        error.css('bottom', offset.top - element.outerHeight());
    },
    focusInvalid: false,
    invalidHandler: function(form, validator) {
        if (!validator.numberOfInvalids())
            return;
    },
    submitHandler: function (form) {
        /* commented out because send post request twice (in addition to form 'action') */
        /* $.ajax({
             url:'/',
             type:'post',
             data:$('#formInfo').serialize(),
             success:function(){
                 //whatever you wanna do after the form is successfully submitted
                 console.log(form.user_id.value);
                 mixpanel.track('New User', {'uid': form.user_id.value, 'userType': 'cocacola_user'/* candidate/employee });

                 // TODO: scrollTo block user authentication display
            // }
         //});*/
        var startFormDate = new Date();
        _LTracker.push({
            'text': 'User Start Form',
            'sid': sid,
            'userType': 'candidate',
            'date': startFormDate.toString(),
            'cid': cid
        });
        mixpanel.track('User Start Form', {'sid': sid, 'userType': 'candidate', 'date': startFormDate.toString(), 'cid': cid });
        form.submit();
    }
});

function getCid() {
    var urlPath = window.location.pathname;
    var cid = urlPath.split('/');
    return cid[2];
}