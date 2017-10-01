var numOfQuestionsAnswered = 0;
var totalQuestions = document.getElementsByClassName('q').length;
//alert(totalQuestions);
var questionsAnswered = [];
var startDate = new Date();



function scrollToNextElement(nextElement) {
    var container = $('#formContainer');
    var scrollTo = $('#' + nextElement);
    console.log("scrollto: " + scrollTo);
    console.log("container: " + container);
    container.animate({scrollTop: scrollTo.offset().top - container.offset().top +
    container.scrollTop()});
}

$('#radioBtn a').on('click', function(){
    var answer = $(this).data('title');
    var tog = $(this).data('toggle');
    var dataValue = $(this).data('value');
    var isOnError = $(this).css('border');
    var nextQuestion = $(this).parent().parent().attr('id');
    console.log(nextQuestion);

    if(isOnError.indexOf("1px solid rgb(255, 0, 0)") != "-1"){
        $(this).parent().find("a").css('border', "solid green 1px");
        var el = $(this).parent().parent().find("div.error");
        el[0].style.display = 'none';
    }

    $('#'+tog).prop('value', answer);
    $('a[data-toggle="'+tog+'"]').not('[data-value="'+dataValue+'"]').removeClass('active').addClass('notActive');
    $('a[data-toggle="'+tog+'"][data-value="'+dataValue+'"]').removeClass('notActive').addClass('active');

    if(questionsAnswered.indexOf(tog) == '-1') {
        questionsAnswered.push(tog);
        numOfQuestionsAnswered++;

        /*
        var container = $('#fromContainer'),
            //scrollTo = $('#question' + numOfQuestionsAnswered);
            scrollTo = $('#' + nextQuestion);
        container.animate({scrollTop: scrollTo.offset().top - container.offset().top +
        container.scrollTop()});
        //container.animate({scrollTop: container.offset().top - scrollTo.offset().top});*/

        //scrollToNextElement(nextQuestion);
        var container = $('#formContainer');
        var scrollTo = $('#' + nextQuestion);
        container.animate({scrollTop: scrollTo.offset().top - container.offset().top +
        container.scrollTop()});

        var progress = document.getElementById("progressBar");
        var percent = (numOfQuestionsAnswered / totalQuestions) * 100;
        progress['aria-valuenow'] = percent.toFixed(0);
        progress['style'].width = percent.toFixed(0) + "%";
        progress.innerText = percent.toFixed(0) + "%";

        if(percent == "100") {
            progress['style'].backgroundColor  ="green";
        }
    }

});

var keys = document.getElementsByTagName("input");
var rules = {};

for (var index = 0; index < keys.length; index++) {
    var key = keys[index].name;
    if(key != 'FormTotalTime'){
        rules[key] = "required";
    }
}

$("#form").validate({
    ignore: "",
    rules: rules,
    messages: {
        "agreeableness_1": {
            //required: "Please, enter a date"
        },
    },
    errorElement: "div",
    wrapper: "div",  // a wrapper around the error message
    errorPlacement: function(error, element) {
        element.before(error);
        element.parent("div").find("a").css( "border", "solid red 1px" );
        offset = element.offset();
        error.css('left', offset.left);
        error.css('bottom', offset.top - element.outerHeight());
    },
    focusInvalid: false,
    invalidHandler: function(form, validator) {
        var container = $('#fromContainer');
        if (!validator.numberOfInvalids())
            return;

        //console.log(validator.errorList);
        var currentElementID = validator.errorList[0].element.id;
        var parent = $('[id="' + currentElementID + '"]').parent();

        if(currentElementID == 'agree') {
            parent = parent.parent();
        }

        var scrollTo = $('#' + parent.attr('id'));

        container.animate({scrollTop: scrollTo.offset().top - container.offset().top +
        container.scrollTop()}, 500);
    },
    submitHandler: function (form) {
        var totalTime = Math.abs((new Date() - startDate)/1000/60).toFixed(0) + " Minutes";
        mixpanel.track('formTotalTime', {'uid': 'employeeNumber', 'TotalTime': totalTime});
        $('#FormTotalTime').prop('value', totalTime);
        form.submit();
        mixpanel.track('formSubmited', {'uid': 'employeeNumber', 'formCompany': 'Ayalon'});
    }
});



/*
mixpanel.time_event('#radioBtn');



mixpanel.identify("13487");
mixpanel.people.set({
    "$first_name": "Joe2",
    "$last_name": "Doe",
    "$created": "2013-04-01T09:02:00",
    "$email": "joe.doe@example.com"
});

//mixpanel.track("test4");
mixpanel.track("test5",
    {
        "Video length": 213,
        "id": "hY7gQr0"
});
*/
// function getFormTimeFilled() {
//     var totalTime = document.getElementsByName('FormTotalTime');
//     totalTime.value = "asdasd";
//}