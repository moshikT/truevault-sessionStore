var express = require('express');
var csv = require("csvtojson");
var fs = require('fs');
var isInEnglish = false;
var textDirection = isInEnglish ? "lfr" : "rtl";

exports.generateForm = function (req, res) {
    var formJSON = [];
    var p_typeJSON = [];
    var f_typeJSON = [];
    var c_typeJSON = [];
    var b_typeJSON = [];
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

            if (questionsJSON['AYALON'] == 'yes' && lines < 25) {
                parseQuestions(questionsJSON);
                if (questionsJSON['TYPE'] == 'P') {
                    p_typeJSON.push(questionsJSON);
                } else if (questionsJSON['TYPE'] == 'F') {
                    f_typeJSON.push(questionsJSON);
                } else if (questionsJSON['TYPE'] == 'C') {
                    // FOR DEMO c_typeJSON.push(questionsJSON);
                } else if (questionsJSON['TYPE'] == 'B') {
                    // FOR DEMO b_typeJSON.push(questionsJSON);
                }
            }

            lines++;
        })
        .on('done',(error)=>{
            shuffle(p_typeJSON);
            shuffle(f_typeJSON);
            shuffle(b_typeJSON);

            formJSON = reOrderFormJSON(p_typeJSON, f_typeJSON, c_typeJSON, b_typeJSON);

            //console.log(formJSON);

            res.render('form', { title: '' ,
                formjson: formJSON,
                isInEnglish: textDirection});
        })
}

function parseQuestions(qJSON) {
    isInEnglish ? qJSON['item'] = qJSON['ITEM ENGLISH'] : qJSON['item'] = qJSON['ITEM HEBREW'];
    var answerOptions = isInEnglish ? qJSON['ANS_OPT_ENGLISH'].split(",") : qJSON['ANS_OPT_HEBREW'].split(",");

    if (qJSON['TYPE'] == 'B') {
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
        //isInEnglish ? qJSON['ANSWER ENGLISH'] = parsedAnswers : qJSON['ANSWER HEBREW'] = parsedAnswers;
        qJSON['answer'] = parsedAnswers;
        qJSON['data-title'] = parsedAnswersWeight;
    }
    else if(qJSON['TYPE'] == 'P' || qJSON['TYPE'] == 'F') {
        var scalaOptionsNumber = 5;
        var scalaArray = [];
        for (var index = 1; index <= scalaOptionsNumber; index++) {
            scalaArray.push(index);
        }

        qJSON['data-title'] = scalaArray;
        //isInEnglish ? qJSON['ANS_OPT_ENGLISH'] = scalaArray: qJSON['ANSWER HEBREW'] = scalaArray;
        qJSON['answer-options'] = scalaArray;
        var scalaEdges = answerOptions.toString().split("-");//.reverse().join("");

        if (scalaEdges.length == 2) {
            scalaEdges[0] = scalaEdges[0].replace(/\s+/g, '<br>');
            scalaEdges[1] = scalaEdges[1].replace(/\s+/g, '<br>');
        }
        qJSON['ANS_OPT_HEBREW'] = scalaEdges;
        //console.log(qJSON['ANS_OPT_HEBREW']);
        //qJSON['ANS_OPT_HEBREW'][0] = scalaEdges[0];
        //qJSON['ANS_OPT_HEBREW'][1] = scalaEdges[1];/* UNTIL EXCEL UPDATE */
        //isInEnglish ? qJSON['ANS_OPT_ENGLISH'] = scalaEdges : qJSON['ANS_OPT_HEBREW'] = scalaEdges;
        //console.log("TEST VALUE: " + qJSON['ANS_OPT_ENGLISH']);
    } else if (qJSON['TYPE'] == 'C') {
        (answerOptions.length == 2) ? qJSON['data-title'] = [5, 1] : qJSON['data-title'] = answerOptions;
        //isInEnglish ? qJSON['ANS_OPT_ENGLISH'] = answerOptions : qJSON['ANS_OPT_HEBREW'] = answerOptions;
        qJSON['answer-options'] = answerOptions;
        //console.log("answer - options: " + qJSON['answer-options']);
    }
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

function reOrderFormJSON(typeP, typeF, typeC, typeB) {
    var orderedForm = [];
    var numOfPTypeQuestion = 20;
    var numOfFTypeQuestion = 5;

    while(typeP.length > 0 || typeF.length > 0 || typeC.length > 0) {
        pushQuestionsToForm(numOfPTypeQuestion, typeP, orderedForm);
        if(typeC.length > 0) {
            orderedForm.push(typeC.pop());
        }
        pushQuestionsToForm(numOfFTypeQuestion, typeF, orderedForm);
    }

    while(typeB.length > 0) {
        orderedForm.push(typeB.pop());
    }

    /* For testing
    for (var i = 0; i < orderedForm.length; i++) {
        console.log("question Number " + i + " " + orderedForm[i]['TYPE']);
    }*/

    return orderedForm;
}

function pushQuestionsToForm(numOfElements, arrayFrom, arrayTo) {
    var elementsToPush = numOfElements;
    while (elementsToPush > 0 && arrayFrom.length > 0){
        arrayTo.push(arrayFrom.pop());
        elementsToPush--;
    }
}