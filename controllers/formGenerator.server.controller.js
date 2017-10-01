var express = require('express');
var csv = require("csvtojson");
var fs = require('fs');
var isInEnglish = false;
var isDemo = false;
var companyForm = isDemo ? 'DEMO' : 'AYALON';
var textDirection = isInEnglish ? "lfr" : "rtl";
var submitText = isInEnglish ? "Submit" : "להגשת המבחן לחץ כאן";
var terms = {
    title : isInEnglish ? "Please confirm our Terms of service" : "* בבקשה אשר את תנאי השימוש",
    prefix : isInEnglish ? "I confirm our" : "אני מאשר את",
    postfix : isInEnglish ? " Terms of service" : " תנאי השימוש"
}

var question = {
    type : null,
    item : null,
    answer : null,
    dataTitle : null,
    answerOptions : null,
    scalaEdges : null,
    next : null
}



exports.generateForm = function (req, res) {
    var questionsArraysByType = {
        p_typeJSON : [],
        f_typeJSON : [],
        c_typeJSON : [],
        b_typeJSON : []
    }

    var form = [];

    var lines = 0;

    csv()
        .fromFile('items key.csv')
        .on('json',(jsonObj)=>{
            // combine csv header row and csv line to a json object
            // jsonObj.a ==> 1 or 4
            // formJSON = jsonObj
            //console.log(jsonObj);
        })
        .on('data',(data)=>{
            //data is a buffer object
            const jsonStr= data.toString('utf8');
            var questionsJSON = JSON.parse(jsonStr);

            if (questionsJSON[companyForm] == 'yes') {
                question = parseQuestions(questionsJSON);
                //console.log(question);
                if (question.type == 'P') {
                    questionsArraysByType.p_typeJSON.push(question);
                    //console.log("P array: ", questionsArraysByType.p_typeJSON);
                } else if (question.type == 'F') {
                    questionsArraysByType.f_typeJSON.push(question);
                } else if (question.type == 'C') {
                    questionsArraysByType.c_typeJSON.push(question);
                    //console.log("C array: ", questionsArraysByType.c_typeJSON);
                } else if (question.type == 'B') {
                    questionsArraysByType.b_typeJSON.push(question);
                }
            }

            lines++;
        })
        .on('done',(error)=>{
            //console.log("before shuffle :" ,questionsArraysByType.p_typeJSON);

            shuffle(questionsArraysByType.p_typeJSON);
            shuffle(questionsArraysByType.f_typeJSON);
            shuffle(questionsArraysByType.b_typeJSON);

//            console.log("after shuffle :" ,questionsArraysByType.p_typeJSON);

            //formJSON = reOrderFormJSON(p_typeJSON, f_typeJSON, c_typeJSON, b_typeJSON);
            form = reOrderFormJSON(questionsArraysByType.p_typeJSON, questionsArraysByType.f_typeJSON,
                questionsArraysByType.c_typeJSON, questionsArraysByType.b_typeJSON);
            //console.log(form);


            res.render('form', { title: '' ,
                formjson: form,
                isInEnglish: isInEnglish,
                textDirection: textDirection,
                terms : terms,
                submitText : submitText
            });
        })
}

function parseQuestions(qJSON) {
    var parsedQuestion = {};
    parsedQuestion.id = qJSON['Q_ID'];
    parsedQuestion.item = isInEnglish ? qJSON['ITEM ENGLISH'] : qJSON['ITEM HEBREW'];
    var answerOptions = isInEnglish ? qJSON['ANS_OPT_ENGLISH'].split(",") : qJSON['ANS_OPT_HEBREW'].split(",");

    if (qJSON['TYPE'] == 'B') {
        parsedQuestion.type = 'B';
        var parsedAnswers = [];
        var parsedAnswersWeight = [];
        var answersOptionsArray = isInEnglish ? qJSON['ANSWER ENGLISH'].split(";") : qJSON['ANSWER HEBREW'].split(";");
        for (var answerIndex = 0; answerIndex < answersOptionsArray.length; answerIndex++) {
            var answer = answersOptionsArray[answerIndex].split(":");
            if (answer.length == 2) {
                parsedAnswers.push(answer[0]);
                parsedAnswersWeight.push(answer[1]);
                //console.log(answer);
            }
            else {
                console.log("Wrong structure for question type B: " + qJSON);
            }
        }
        parsedQuestion.answer = parsedAnswers;
        parsedQuestion.dataTitle = parsedAnswersWeight;
    }
    else if(qJSON['TYPE'] == 'P' || qJSON['TYPE'] == 'F') {
        parsedQuestion.type = (qJSON['TYPE'] == 'P') ? 'P' : 'F';
        var scalaOptionsNumber = 5;
        var scalaArray = [];
        for (var index = 1; index <= scalaOptionsNumber; index++) {
            scalaArray.push(index);
        }

        parsedQuestion.answerOptions = scalaArray;
        parsedQuestion.dataTitle = scalaArray;
        var scalaEdges = answerOptions.toString().split("-");//.reverse().join("");

        if (scalaEdges.length == 2) {
            scalaEdges[0] = scalaEdges[0].replace(/\s+/g, '<br>');
            scalaEdges[1] = scalaEdges[1].replace(/\s+/g, '<br>');
        }


        parsedQuestion.scalaEdges = isInEnglish ?
            ((qJSON['TYPE'] == 'P') ? ["Disagree","Agree"] : ["Not <br>important <br>at all","Very <br> important"]) :
            ((qJSON['TYPE'] == 'P') ? scalaEdges : ['הכי חשוב <br> לי', 'הכי פחות <br> חשוב לי']);


    } else if (qJSON['TYPE'] == 'C') {
        parsedQuestion.type = 'C';
        parsedQuestion.dataTitle = (answerOptions.length == 2) ? [5, 1] : answerOptions;
        parsedQuestion.answerOptions = answerOptions;
    }
    return parsedQuestion;
}

function shuffle(typeArray) {
    var numOfElements = typeArray.length;
    var index, temp;

    while (numOfElements > 0) {
        index = Math.floor(Math.random() * numOfElements);
        numOfElements--;
        // And swap the last element with element at index
        swap(typeArray, numOfElements, index);
    }
}

function swap(array, element1Index, element2Index) {
    var temp = array[element1Index];
    array[element1Index] = array[element2Index];
    array[element2Index] = temp;
}

function reOrderFormJSON(pType, fType, cType, bType) {
    var orderedForm = [];
    var numOfPTypeQuestion = 20;
    var numOfFTypeQuestion = 5;

    //console.log(pType);

    while(pType.length > 0 || fType.length > 0 ||
    cType.length > 0) {

        var elementsToPush = numOfPTypeQuestion;

        while (elementsToPush > 0 && pType.length > 0){
            /*var nextQuestion = arrayFrom.pop();
            if (arrayTo.length > 0) {
                setNext(arrayTo[arrayTo.length - 1], nextQuestion)
            }
            arrayTo.push(nextQuestion);*/
            var elementToPush = pType.pop();
            //console.log("P type: ", elementToPush);
            pushQuestion(elementToPush, orderedForm);
            elementsToPush--;
            //console.log(pType.length);
        }



        //pushQuestionsToForm(numOfPTypeQuestion, questionsArraysByType.p_typeJSON, form);
        if(cType.length > 0) {

            //var next = typeC.pop();
            //console.log(typeC.length);
            var elementToPush = cType.pop()
            pushQuestion(elementToPush, orderedForm);
            /*
            var nextQuestion = typeC.pop();
            if(orderedForm.length > 0) {
                setNext(orderedForm[orderedForm.length - 1], nextQuestion);
            }
            orderedForm.push(nextQuestion);
            */
        }

        var elementsToPush = numOfFTypeQuestion;

        while (elementsToPush > 0 && fType.length > 0){
            /*var nextQuestion = arrayFrom.pop();
            if (arrayTo.length > 0) {
                setNext(arrayTo[arrayTo.length - 1], nextQuestion)
            }
            arrayTo.push(nextQuestion);*/
            var elementToPush = fType.pop();
            pushQuestion(elementToPush, orderedForm);
            elementsToPush--;
        }

       // pushQuestionsToForm(numOfFTypeQuestion, questionsArraysByType.f_typeJSON, form);
    }

    while(bType.length > 0) {
        //var next = typeB.pop();
        var elementToPush = bType.pop();
        pushQuestion(elementToPush, orderedForm);
        /*
        var nextQuestion = typeB.pop();
        if (orderedForm.length > 0) {
            setNext(orderedForm[orderedForm.length - 1], nextQuestion);
        }
        orderedForm.push(nextQuestion);
        */
    }

    /* For testing
    for (var i = 0; i < orderedForm.length; i++) {
        console.log("question Number " + i + " " + orderedForm[i]['TYPE']);
    }*/

    //console.log(orderedForm);
    return orderedForm;
}

/*
function pushQuestionsToForm(numOfElements, arrayFrom, arrayTo) {
    var elementsToPush = numOfElements;

    while (elementsToPush > 0 && form.length > 0){
        /*var nextQuestion = arrayFrom.pop();
        if (arrayTo.length > 0) {
            setNext(arrayTo[arrayTo.length - 1], nextQuestion)
        }
        arrayTo.push(nextQuestion);*/
        /*pushQuestion(arrayFrom.pop(), form);
        elementsToPush--;
    }
}
*/
function pushQuestion(nextQuestion, arrayTo) {
   // var nextQuestion = arrayFrom.pop();
    if (arrayTo.length > 0) {
        var currentQuestion = arrayTo[arrayTo.length - 1];
        //setNext(arrayTo[arrayTo.length - 1], nextQuestion)
        currentQuestion.next = nextQuestion;
    }
    //console.log(nextQuestion);
    arrayTo.push(nextQuestion);
}