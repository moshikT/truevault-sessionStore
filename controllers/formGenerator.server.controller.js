"use strict";
var express = require('express');
var csv = require("csvtojson");
var fs = require('fs');
var Candidate = require('../models/candidate.server.model.js');
const addFile_Ctrl = require('../controllers/addFile.server.controller');

var question = {
    type: null,
    item: null,
    answer: null,
    dataTitle: null,
    answerOptions: null,
    scalaEdges: null,
    next: null
}

exports.generateForm = function (isInEnglish, companyKeyword, callback) {
    var lines = 0;
    var companyForm = companyKeyword;
    const baseFileName = 'items key';

    var questionsArraysByType = {
        p_typeJSON: [],
        f_typeJSON: [],
        c_typeJSON: [],
        b_typeJSON: [],
        a_typeJSON: []
    };

    // make sure file is retrieved from the db
    addFile_Ctrl.getFile([baseFileName + '.' + companyKeyword + '.csv', baseFileName + '.csv'])
        .then(filePath => {
            console.log("%s.%s:%s -", __file, __ext, __line, "File found: ", filePath);
            csv()
                .fromFile(filePath)
                .on('json', (jsonObj) => {
                    // combine csv header row and csv line to a json object
                    // jsonObj.a ==> 1 or 4
                    // formJSON = jsonObj
                    //console.log("%s.%s:%s -", __file, __ext, __line, jsonObj);
                })
                .on('data', (data) => {
                    //console.log("%s.%s:%s -", __file, __ext, __line, "CSV data read");
                    //data is a buffer object
                    const jsonStr = data.toString('utf8');
                    var questionsJSON = JSON.parse(jsonStr);

                    //console.log("%s.%s:%s -", __file, __ext, __line, questionsJSON);
                    //console.log("%s.%s:%s -", __file, __ext, __line, questionsJSON['INCLUDED']);
                    //console.log("%s.%s:%s -", __file, __ext, __line, questionsJSON['INCLUDED'].indexOf(companyForm));

                    if (questionsJSON['INCLUDED'].indexOf(companyForm) !== -1) {
                        question = parseQuestions(questionsJSON, isInEnglish);
                        if (question.type == 'P') {
                            questionsArraysByType.p_typeJSON.push(question);
                        } else if (question.type == 'F' && question.answerOptions.length > 2) {
                            //console.log("%s.%s:%s -", __file, __ext, __line, "pushed f type: ", question.id);
                            //questionsArraysByType.f_typeJSON.push(question);
                        } else if (question.type == 'C') {
                            questionsArraysByType.c_typeJSON.push(question);
                        } else if (question.type == 'B') {
                            questionsArraysByType.b_typeJSON.push(question);
                        } else if (question.type == 'A') {
                            questionsArraysByType.a_typeJSON.push(question);
                        }
                    }

                    lines++;
                })
                .on('done', (error) => {
                    console.log("%s.%s:%s -", __file, __ext, __line, "CSV done. Error: ", error);

                    shuffle(questionsArraysByType.p_typeJSON);
                    //shuffle(questionsArraysByType.f_typeJSON);
                    shuffle(questionsArraysByType.b_typeJSON);

                    const form = reOrderFormJSON(questionsArraysByType.p_typeJSON, questionsArraysByType.f_typeJSON,
                        questionsArraysByType.c_typeJSON, questionsArraysByType.b_typeJSON, questionsArraysByType.a_typeJSON);

                    callback(form);
                });
        })
        .catch(error => {
            console.log("%s.%s:%s -", __file, __ext, __line, "Error: ", error);
            callback(null);
        });
}


function parseQuestions(qJSON, isInEnglish) {
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
                //console.log("%s.%s:%s -", __file, __ext, __line, answer);
            }
            else {
                //console.log("%s.%s:%s -", __file, __ext, __line, "Wrong structure for question type B: " + qJSON);
            }
        }
        parsedQuestion.answer = parsedAnswers;
        /* TODO: check if possible to change to answer options for uniformity between questions types */
        parsedQuestion.dataTitle = parsedAnswersWeight;
    }
    else if (qJSON['TYPE'] == 'P' || qJSON['TYPE'] == 'A') {
        parsedQuestion.type = (qJSON['TYPE'] == 'P') ? 'P' : 'A';
        var scalaOptionsNumber = 7;
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

        /*$$$ Old code - hardcoded text for answer scale
        parsedQuestion.scalaEdges = isInEnglish ?
            ((qJSON['TYPE'] == 'P' || qJSON['TYPE'] == 'A') ? ["Disagree","Agree"] : ["Not <br>important <br>at all","Very <br> important"]) :
            ((qJSON['TYPE'] == 'P' || qJSON['TYPE'] == 'A') ? scalaEdges : ['הכי חשוב <br> לי', 'הכי פחות <br> חשוב לי']); */

        // Use text for answer scale as provided in the CSV
        parsedQuestion.scalaEdges = scalaEdges;


    }
    /*else if (qJSON['TYPE'] == 'F') {
        parsedQuestion.type = 'F';
        var fitItemString = qJSON['FIT HEBREW'].toString();
        //if()
        var itemsCollection = fitItemString.split(/\,\s?(?![^\(]*\))/);
        //console.log("%s.%s:%s -", __file, __ext, __line, "coltural fit qid: ", parsedQuestion.id);
        //console.log("%s.%s:%s -", __file, __ext, __line, "coltural fit asnwers: ", itemsCollection);
        parsedQuestion.answerOptions = itemsCollection;
        parsedQuestion.dataTitle = itemsCollection;
    }*/
    else if (qJSON['TYPE'] == 'C') {
        parsedQuestion.type = 'C';
        parsedQuestion.dataTitle = (answerOptions.length == 2) ? [7, 1] : answerOptions;
        parsedQuestion.answerOptions = answerOptions;
        parsedQuestion.optAnswer = isInEnglish ? qJSON['ANSWER ENGLISH'] : qJSON['ANSWER HEBREW'];
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

function reOrderFormJSON(pType, fType, cType, bType, aType) {
    var orderedForm = [];
    var numOfPTypeQuestion = 20;
    var numOfFTypeQuestion = 0;//5;

    while (pType.length > 0 || fType.length > 0 || cType.length > 0) {
        var elementsToPush = numOfPTypeQuestion;
        while (elementsToPush > 0 && pType.length > 0) {
            var elementToPush = pType.pop();
            pushQuestion(elementToPush, orderedForm);
            elementsToPush--;
        }
        if (cType.length > 0) {
            var elementToPush = cType.pop()
            pushQuestion(elementToPush, orderedForm);
        }
        var elementsToPush = numOfFTypeQuestion;
        while (elementsToPush > 0 && fType.length > 0) {
            var elementToPush = fType.pop();
            pushQuestion(elementToPush, orderedForm);
            elementsToPush--;
        }
    }
    while (bType.length > 0) {
        var elementToPush = bType.pop();
        pushQuestion(elementToPush, orderedForm);
    }

    while (aType.length > 0) {
        var elementToPush = aType.pop();
        pushQuestion(elementToPush, orderedForm);
    }
    return orderedForm;
}

function pushQuestion(nextQuestion, arrayTo) {
    if (arrayTo.length > 0) {
        var currentQuestion = arrayTo[arrayTo.length - 1];
        currentQuestion.next = nextQuestion.id;
    }
    arrayTo.push(nextQuestion);
}
