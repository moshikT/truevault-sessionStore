var numOfQuestionsAnswered = document.getElementsByClassName('active').length;
var qAnsweredArray = document.getElementsByClassName('active');

var questionsAnsweredID = [];
var sid = getParameterByName('sid');
var cid = getCid();
var lastQuestionAnswered = startDate;
var startDate = new Date();

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

    _LTracker.push({
        'text': 'Form reloaded',
        'sid': sid,
        'date': startDate.toString(),
        'cid': cid
    });
    mixpanel.track('Form reloaded', {'sid': sid, 'date': startDate.toString(), 'cid': cid});
}
var totalQuestions = document.getElementsByClassName('q').length;
updateProgressbar(numOfQuestionsAnswered, totalQuestions);
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
    if (formNextError !== undefined) {
        // We are - so jump to the next unanswered item
        formNextError = gotoNextInvalid(formErrorList, formNextError);
    }
    else {
        // We aren't - just scroll to the next question
        let container = $('#formContainer'); // The form container
        let scrollTo = $('#' + nextQuestion); //
        container.animate({scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop()}, 500);
    }

    var patchUrl = '/' + 'clients' +  '/api/' + sid + '/' + qid;
    console.log(patchUrl);


    // Using promises in order to track which requests have been processed and which are not.
    // Rejected request inserted to request array in order to handle them later in some way.
    sendResult(patchUrl, patchData)
        .then(function(result) {
            // Code depending on result
            console.log("result ", result);
            var dateAnswered = new Date();
            _LTracker.push({
                'text': 'Question Answered',
                'sid': sid,
                'qData': result,
                'date': dateAnswered.toString(),
                'cid': cid
            });
            mixpanel.track('Question Answered', {'sid': sid, 'qData': result, 'date': dateAnswered.toString(), 'cid': cid});
        })
        .catch(function(rejected) {
            // An error occurred
            requests.push(rejected);
            var dateAnswered = new Date();
            _LTracker.push({
                'text': 'Unable to send question data to server',
                'sid': sid,
                'qData': rejected,
                'date': dateAnswered.toString(),
                'cid': cid
            });
            mixpanel.track('Unable to send question data to server', {'sid': sid, 'qData': rejected, 'date': dateAnswered.toString(), 'cid': cid});
            console.log("pushed new rejected req to array ", rejected);
        });
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
            success:function(){
                //whatever you wanna do after the form is successfully submitted
                console.log("success patch request ", patchData);
                resolve(request);
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

// set required rules for the jQuery form validation.
var keys = document.getElementsByTagName("input");
var rules = {};

for (var index = 0; index < keys.length; index++) {
    var key = keys[index].name;
    if(key != "isCompleted" && key.indexOf('cultural') == '-1'){
        rules[key] = "required";
    }
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
        //console.log("before mix panel form submitted");

        var dateSubmitted = new Date();
        _LTracker.push({
            'text': 'Form submitted',
            'sid': sid,
            'date': dateSubmitted.toString(),
            'cid': cid,
            'userType' : 'candidate',
            'fullname': fullName
        });
        mixpanel.track('Form submitted', { 'sid': sid, 'date': dateSubmitted.toString(), 'cid': cid, 'userType' : 'candidate', 'fullname': fullName });
        document.getElementById('isCompleted').checked = true;
        formDisplay();
       /* Loop over request array and execute all the requests that failed to send to server.
       // Commented out beacause the form submitted before the array is empty - meaning the
       // code still not execute all the requests before form submitted (probably because of asyncroniztion).
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
                        //console.log("success patch request ", requests[i].data);
                        //requests.pop();
                        //console.log("request array size", requests.length);
                        //if(requests.length < 1) {

                        //}
                        //resolve(request);
                        //mixpanel.track('Question Answered', {'sid': sid, 'qData': requests[i].data, 'date': new Date(), 'cid': cid});
                    },
                    error: function (err) {
                        // if(xmlHttpRequest.readyState == 0 || xmlHttpRequest.status == 0)
                        console.log(err);
                        //reject(request);
                    }     //return;  // it's not really an error
                    // Do normal error handling
                });
            }

        }*/
        form.submit();
    }
});

// Function to move through unanswered items after form is submitted
function gotoNextInvalid(errorList, nextError) {
    // Get the form container
    var container = $('#formContainer');
    // Are we at or beyond the end of the unanswered list?
    if (nextError >= errorList.length)
    { // We are at the end of the unanswered questions list
        // Get the submit button element
        let scrollTo = $('#submit');
        console.log("scrollTo ", scrollTo);
        // Do an animated scroll
        container.animate({
            scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop()
        }, 500);

        // Exit the function
        return nextError;
    }

    var nextElementID = errorList[nextError].element.id; // The next item to jump to
    var containerElementID = $('[id="' + nextElementID + '"]').parent(); // The (div) container of the item
    console.log("parent ", containerElementID);
    console.log("error list first element ", errorList[0]);

    // Is this the 'agree' checkbox?
    if (nextElementID == 'agree') {
        // It's an embedded container
        containerElementID = containerElementID.parent();
    }
    console.log("container ", container);

    // Get the ID of the container we're going to scroll to
    var scrollTo = $('#' + containerElementID.attr('id'));
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

// extract queryString parameters' value
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
    return cid[2];
}

$(function() {
    // Detect touch support
    $.support.touch = 'ontouchend' in document;

    // Ignore browsers without touch support
    if (!$.support.touch) {
        return;
    }

    var mouseProto = $.ui.mouse.prototype,
        _mouseInit = mouseProto._mouseInit,
        _mouseDestroy = mouseProto._mouseDestroy,
        touchHandled;

    /**
     * Simulate a mouse event based on a corresponding touch event
     * @param {Object} event A touch event
     * @param {String} simulatedType The corresponding mouse event
     */
    function simulateMouseEvent (event, simulatedType) {

        // Ignore multi-touch events
        if (event.originalEvent.touches.length > 1) {
            return;
        }

        event.preventDefault();

        var touch = event.originalEvent.changedTouches[0],
            simulatedEvent = document.createEvent('MouseEvents');

        // Initialize the simulated mouse event using the touch event's coordinates
        simulatedEvent.initMouseEvent(
            simulatedType,    // type
            true,             // bubbles
            true,             // cancelable
            window,           // view
            1,                // detail
            touch.screenX,    // screenX
            touch.screenY,    // screenY
            touch.clientX,    // clientX
            touch.clientY,    // clientY
            false,            // ctrlKey
            false,            // altKey
            false,            // shiftKey
            false,            // metaKey
            0,                // button
            null              // relatedTarget
        );

        // Dispatch the simulated event to the target element
        event.target.dispatchEvent(simulatedEvent);
    }

    /**
     * Handle the jQuery UI widget's touchstart events
     * @param {Object} event The widget element's touchstart event
     */
    mouseProto._touchStart = function (event) {

        var self = this;

        // Ignore the event if another widget is already being handled
        if (touchHandled || !self._mouseCapture(event.originalEvent.changedTouches[0])) {
            return;
        }

        // Set the flag to prevent other widgets from inheriting the touch event
        touchHandled = true;

        // Track movement to determine if interaction was a click
        self._touchMoved = false;

        // Simulate the mouseover event
        simulateMouseEvent(event, 'mouseover');

        // Simulate the mousemove event
        simulateMouseEvent(event, 'mousemove');

        // Simulate the mousedown event
        simulateMouseEvent(event, 'mousedown');
    };

    /**
     * Handle the jQuery UI widget's touchmove events
     * @param {Object} event The document's touchmove event
     */
    mouseProto._touchMove = function (event) {

        // Ignore event if not handled
        if (!touchHandled) {
            return;
        }

        // Interaction was not a click
        this._touchMoved = true;

        // Simulate the mousemove event
        simulateMouseEvent(event, 'mousemove');
    };

    /**
     * Handle the jQuery UI widget's touchend events
     * @param {Object} event The document's touchend event
     */
    mouseProto._touchEnd = function (event) {

        // Ignore event if not handled
        if (!touchHandled) {
            return;
        }

        // Simulate the mouseup event
        simulateMouseEvent(event, 'mouseup');

        // Simulate the mouseout event
        simulateMouseEvent(event, 'mouseout');

        // If the touch interaction did not move, it should trigger a click
        if (!this._touchMoved) {

            // Simulate the click event
            simulateMouseEvent(event, 'click');
        }

        // Unset the flag to allow other widgets to inherit the touch event
        touchHandled = false;
    };

    /**
     * A duck punch of the $.ui.mouse _mouseInit method to support touch events.
     * This method extends the widget with bound touch event handlers that
     * translate touch events to mouse events and pass them to the widget's
     * original mouse event handling methods.
     */
    mouseProto._mouseInit = function () {

        var self = this;

        // Delegate the touch handlers to the widget's element
        self.element.bind({
            touchstart: $.proxy(self, '_touchStart'),
            touchmove: $.proxy(self, '_touchMove'),
            touchend: $.proxy(self, '_touchEnd')
        });

        // Call the original $.ui.mouse init method
        _mouseInit.call(self);
    };

    /**
     * Remove the touch event handlers
     */
    mouseProto._mouseDestroy = function () {

        var self = this;

        // Delegate the touch handlers to the widget's element
        self.element.unbind({
            touchstart: $.proxy(self, '_touchStart'),
            touchmove: $.proxy(self, '_touchMove'),
            touchend: $.proxy(self, '_touchEnd')
        });

        // Call the original $.ui.mouse destroy method
        _mouseDestroy.call(self);
    };

});

// For further use - in order to style Coltural fit questions
var culturalSet = {};
culturalSet.movesCounter = 0;
$(function() {
    $( "#sortable" ).sortable({
        stop: function () {
            culturalSet.movesCounter += 1;
            var culturalData = [];
            var nbElems = $(this).find('input').length / 2;
            //var nbElems = inputs.length;
            var order = 0;
            $('input.currentPosition').each(function(idx) {
                order++;
                var currentElementValue = nbElems - idx;
                var element = {};
                element.answer = currentElementValue;
                element.id = $(this).attr('name');
                $(this).val(currentElementValue);
                //console.log(element);
                culturalData.push(element);
            });
            culturalSet.data = culturalData;
            console.log("number of moves ", culturalSet.movesCounter);
            console.log(culturalSet);
            var qid = $(this).data('id');
            var patchUrl = '/' + 'clients' +  '/api/' + sid ;//+ '/' + qid;
            console.log("url ", patchUrl);
            sendResult(patchUrl, culturalSet);
        }
    });
    $( "#sortable" ).disableSelection();
});

// prevent from user to reSubmit his form - block the view of the form if completed
function formDisplay() {
    var isCompleted = document.getElementById('isCompleted').checked;
    if(isCompleted){
        document.getElementById('formContainer').style.display = 'none';
        document.getElementById('progressBarDiv').style.display = 'none';
        document.getElementById('success').style.display = 'block';
    }
    else {
        document.getElementById('formContainer').style.display = 'block';
        document.getElementById('progressBarDiv').style.display = 'block';
    }
}
