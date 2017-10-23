var numOfQuestionsAnswered = document.getElementsByClassName('active').length;
var qAnsweredArray = document.getElementsByClassName('active');
var questionsAnsweredID = [];
for(var questionsAnsweredIndex = 0; questionsAnsweredIndex < numOfQuestionsAnswered; questionsAnsweredIndex++) {
    questionsAnsweredID.push(qAnsweredArray[questionsAnsweredIndex].getAttribute("data-toggle"));
}
if(numOfQuestionsAnswered !== 0) {
    // TODO: scroll to the last element filled
}
var totalQuestions = document.getElementsByClassName('q').length;
updateProgressbar(numOfQuestionsAnswered, totalQuestions);
var startDate = new Date();
var lastQuestionAnswered = startDate;
var sid = getParameterByName('sid');
var cid = getCid();

$('#radioBtn a').on('click', function(){
    var answer = $(this).data('title');
    var qid = $(this).data('toggle');
    var dataValue = $(this).data('value');
    var isOnError = $(this).css('border');
    var nextQuestion = $(this).parent().parent().data('title');
    var patchData = {};

    if(isOnError.indexOf("1px solid rgb(255, 0, 0)") != "-1"){
        $(this).parent().find("a").css('border', "solid green 1px");
        var el = $(this).parent().parent().find("div.error");
        el[0].style.display = 'none';
    }

    /* mark question answered as active */
    $('#'+qid).prop('value', answer);
    $('a[data-toggle="'+qid+'"]').not('[data-value="'+dataValue+'"]').removeClass('active').addClass('notActive');
    $('a[data-toggle="'+qid+'"][data-value="'+dataValue+'"]').removeClass('notActive').addClass('active');

    if(questionsAnsweredID.indexOf(qid) == '-1') {
        questionsAnsweredID.push(qid);
        numOfQuestionsAnswered++;

        var timeAnswered = Math.abs((new Date() - lastQuestionAnswered)/1000).toFixed(0);
        console.log(timeAnswered);

        patchData.finalAnswer = answer.toString();
        patchData.timeAnsweredInSeconds = timeAnswered;

        /* start timer for next question */
        lastQuestionAnswered = new Date();

        updateProgressbar(numOfQuestionsAnswered, totalQuestions);
    }
    else {
        /* Already answered the question */
        patchData.finalAnswer = answer.toString();
        patchData.AnswerSwitched = true;
    }

    /* Scroll to the next question */
    var container = $('#formContainer'),
        scrollTo = $('#' + nextQuestion);
    container.animate({scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop()});

    var patchUrl = '/' + cid +  '/api/' + sid + '/' + qid;
    console.log(patchUrl);

    $.ajax({
        url : patchUrl,
        data : JSON.stringify(patchData),
        type : 'PATCH',
        contentType : 'application/json',
        success:function(){
            //whatever you wanna do after the form is successfully submitted
            console.log("success patch request ", patchData);
            //mixpanel.track('Question Answered, {'uid': form.user_id.value,
            // 'qid': {qid}, finalAnswer: answer, SwitchedAnswer: true/false/* candidate/employee */});
        }
    });
});

var keys = document.getElementsByTagName("input");
var rules = {};

for (var index = 0; index < keys.length; index++) {
    var key = keys[index].name;
    rules[key] = "required";
}

$("#form").validate({
    ignore: "",
    /*success: function(label,element) {
        //element.find("input").css( "border", "solid green 1px" );
        element.style.border= "solid green 1px" ;
        //console.log(element);
        //console.log(label);
    },
    //debug: true,*/
    rules: rules,
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
        var container = $('#formContainer');
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
        /* Send form data to mixpanel */
        mixpanel.track('form submitted', {
            'uid': document.getElementsByName('id').value,
            'form duration': totalTime,
            'uname': document.getElementsByName('fullName').value,
            'company' : 'beta'
        });
        $('#formDuration').prop('value', totalTime);
        //return false;
        form.submit();
    }
});

function updateProgressbar(numOfQuestionsAnswered, totalQuestions) {
    var progress = document.getElementById("progressBar");
    var percent = (numOfQuestionsAnswered / totalQuestions) * 100;
    progress['aria-valuenow'] = percent.toFixed(0);
    progress['style'].width = percent.toFixed(0) + "%";
    progress.innerText = percent.toFixed(0) + "%";

    if(percent == "100") {
        progress['style'].backgroundColor  ="green";
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

function getCid() {
    var urlPath = window.location.pathname;
    var cid = urlPath.split('/');
    return cid[1];
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    ev.target.appendChild(document.getElementById(data));
}