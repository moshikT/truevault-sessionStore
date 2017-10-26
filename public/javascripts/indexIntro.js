var sid = getParameterByName('sid');
console.log(sid);

function getParameterByName(name) {
    var url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

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
//console.log(rules);

$("#formInfo").validate({
    ignore: "",
    success: function(label,element) {
        //element.find("input").css( "border", "solid green 1px" );
        element.style.border= "solid green 1px" ;
    },
    //debug: true,
    rules: rules,
    messages: {
        /*"agreeableness_1": {
            //required: "Please, enter a date"
        },*/
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
        /* might send twice because form 'action' test it! */
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
        form.submit();
    }
});