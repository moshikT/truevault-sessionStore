var numOfQuestionsAnswered = document.getElementsByClassName('active').length;
var qAnsweredArray = document.getElementsByClassName('active');
var questionsAnsweredID = [];
for(var questionsAnsweredIndex = 0; questionsAnsweredIndex < numOfQuestionsAnswered; questionsAnsweredIndex++) {
    questionsAnsweredID.push(qAnsweredArray[questionsAnsweredIndex].getAttribute("data-toggle"));
}
if(numOfQuestionsAnswered !== 0) {
    /* Scroll to the next question */

    var question = $('#div'+questionsAnsweredID[questionsAnsweredID.length-1]);
    var nextQuestion = question.data('title');
    var container = $('#formContainer'),
        scrollTo = $('#' + nextQuestion);
    container.animate({scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop()}, 500);
}
var totalQuestions = document.getElementsByClassName('q').length;
updateProgressbar(numOfQuestionsAnswered, totalQuestions);
var startDate = new Date();
var lastQuestionAnswered = startDate;
var sid = getParameterByName('sid');
var cid = getCid();
var highlightedQ, highlightedValue;

function clearMark() {
    var qid = highlightedQ;
    var dataValue = highlightedValue;

    /* mark answer touched as notActive */
    $('a[data-toggle="'+qid+'"][data-value="'+dataValue+'"]').removeClass('active').addClass('notActive');

    highlightedQ = undefined;
    highlightedValue = undefined;
}

$('#radioBtn a').on('touchstart', function(){
    if (highlightedQ && highlightedValue)
    {
        clearMark();
    }
    var qid = $(this).data('toggle');
    var dataValue = $(this).data('value');

    // Check if already marked (meaning this is a previously selected answer)
    if ($('a[data-toggle="'+qid+'"][data-value="'+dataValue+'"]').hasClass('active'))
    {   // If it is, we don't want to touch it because touching it will cause it to be unmarked when moving (touchMove)
        console.log("Already active");
        return;
    }
    // Remember the highlighted question & answer
    highlightedQ = qid;
    highlightedValue = dataValue;

    // mark answer touched as active
    $('a[data-toggle="'+qid+'"][data-value="'+dataValue+'"]').removeClass('notActive').addClass('active');
});

$('#radioBtn a').on('touchmove', function(){
    if (highlightedQ && highlightedValue)
    {
        clearMark();
    }
});

$('#radioBtn a').on('click', function(){
    var answer = $(this).data('title');
    var qid = $(this).data('toggle');
    var dataValue = $(this).data('value');
    var isOnError = $(this).css('border');
    var nextQuestion = $(this).parent().parent().data('title'); // We use the 'title' attribute to store the ID of the next question
    var patchData = {};

    // Prevent accidentally removing the highlight
    highlightedQ = undefined;
    highlightedValue = undefined;

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

    // Are we at the point after clicking the submit button and going through unanswered items?
    if (formNextError != undefined) {
        // We are - so jump to the next unanswered item
        formNextError = gotoNextInvalid(formErrorList, formNextError);
    }
    else {
        // We aren't - just scroll to the next question
        let container = $('#formContainer'); // The form container
        let scrollTo = $('#' + nextQuestion); //
        container.animate({scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop()}, 250);
    }

    var patchUrl = '/' + cid +  '/api/' + sid + '/' + qid;
    console.log(patchUrl);


    sendResult(patchUrl, patchData)
        .then(function(result) {
            // Code depending on result
            console.log("result ", result);
        })
        .catch(function(rejected) {
            // An error occurred
            requests.push(rejected);
            console.log("pushed new rejected req to array ", rejected);
        });

    //setTimeout(function() {

    //}, 1)
});

var requests = [];

function sendResult(patchUrl, patchData) {
    var request = {};
    request.url = patchUrl;
    request.data = patchData;
    return new Promise(function(resolve, reject) {
        $.ajax({
            url : patchUrl,
            data : JSON.stringify(patchData),
            type : 'PATCH',
            contentType : 'application/json',
            //async: false,
            success:function(){
                //whatever you wanna do after the form is successfully submitted
                console.log("success patch request ", patchData);
                resolve(request);
                //mixpanel.track('Question Answered, {'uid': form.user_id.value,
                // 'qid': {qid}, finalAnswer: answer, SwitchedAnswer: true/false/* candidate/employee */});
            },
            error: function (err) {
                // if(xmlHttpRequest.readyState == 0 || xmlHttpRequest.status == 0)
                console.log(err);
                reject(request);
            }     //return;  // it's not really an error
            // Do normal error handling
        });
    });
}

var keys = document.getElementsByTagName("input");
var rules = {};

for (var index = 0; index < keys.length; index++) {
    var key = keys[index].name;
    rules[key] = "required";
}

console.log(rules);

let formErrorList;
let formNextError;

$("#form").validate({
    ignore: "",
    /*success: function(label,element) {
        //element.find("input").css( "border", "solid green 1px" );
        element.style.border= "solid green 1px" ;
        //console.log(element);
        //console.log(label);
    },*/
    //debug: true,
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
        if (!validator.numberOfInvalids())
            return;

        formErrorList = validator.errorList;
        formNextError = 0;
        formNextError = gotoNextInvalid(formErrorList, formNextError);
    },
    submitHandler: function (form) {
        //var totalTime = Math.abs((new Date() - startDate)/1000/60).toFixed(0) + " Minutes";
        /* Send form data to mixpanel */
        mixpanel.track('form submitted', {
            'uid': document.getElementsByName('id').value,
            'form duration': totalTime,
            'uname': document.getElementsByName('fullName').value,
            'company' : 'beta'
        });
        //$('#formDuration').prop('value', totalTime);
        while(requests.length > 0) {
            for(var i = 0; i < requests.length; i++) {
                $.ajax({
                    url : requests[i].url,
                    data : JSON.stringify(requests[i].data),
                    type : 'PATCH',
                    contentType : 'application/json',
                    //async: false,
                    success:function(){
                        //whatever you wanna do after the form is successfully submitted
                        console.log("success patch request ", requests[i].data);
                        requests.pop();
                        console.log("request array size", requests.length);
                        if(requests.length < 1) {
                            form.submit();
                        }
                        //resolve(request);
                        //mixpanel.track('Question Answered, {'uid': form.user_id.value,
                        // 'qid': {qid}, finalAnswer: answer, SwitchedAnswer: true/false/* candidate/employee */});
                    },
                    error: function (err) {
                        // if(xmlHttpRequest.readyState == 0 || xmlHttpRequest.status == 0)
                        console.log(err);
                        //reject(request);
                    }     //return;  // it's not really an error
                    // Do normal error handling
                });
            }

        }
        return false;
        //form.submit();
    }
});

// Function to move through unanswered items after form is submitted
function gotoNextInvalid(errorList, nextError) {
    // Get the form container
    var container = $('#formContainer');
    // Are we at or beyond the end of the unanswered list?
    if (nextError >= errorList.length)
    { // We are
        // @@@ Jump to the submit button

        // Exit the function
        return nextError;
    }

    var currentElementID = errorList[nextError].element.id; // The next item to jump to
    var parent = $('[id="' + currentElementID + '"]').parent(); // The (div) container of the item
    console.log("parent ", parent);
    console.log("error list first element ", errorList[0]);

    // Is this the 'agree' checkbox?
    if (currentElementID == 'agree') {
        // It's an embedded container
        parent = parent.parent();
    }
    console.log("container ", container);

    // Get the ID of the container we're going to scroll to
    var scrollTo = $('#' + parent.attr('id'));
    console.log("scrollTo ", scrollTo);
    // Do an animated scroll
    container.animate({
        scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop()
    }, 500);

    // Move to the next element
    return nextError+1;
}

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

$(function() {
    $( "#sortable" ).sortable({
        stop: function () {
            var nbElems = inputs.length;
            $('input.currentposition').each(function(idx) {
                $(this).val(nbElems - idx);
                console.log($(this).val);
            });
        }
    });
    $( "#sortable" ).disableSelection();
});