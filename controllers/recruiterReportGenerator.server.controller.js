"use strict";
var express = require('express');
var csv = require("csvtojson");
var fs = require('fs');
var Candidate = require('../models/candidate.server.model.js');
var textGenerator_Ctrl = require('../controllers/textGenerator.server.controller');
const addFile_Ctrl = require('../controllers/addFile.server.controller');


//['EQ', 'LEARNING', 'OUTCOME DRIVEN', 'EMOTIONAL STABILITY', 'ASSERTIVENESS',
//'MOTIVATION TO MAKE MONEY', 'SOCIAL DESIRABILITY', 'ATTENTIVENESS TO DETAILS', 'WORK TENDENCY'];

// calcRecruiterReport
exports.calcRecruiterReport = function (req, res, callback) {
    // Lookup the candidate
    Candidate.findOne({'session.id': req.sid}, function (err, candidate) {
        if (err) {
            console.log("%s.%s:%s -", __file, __ext, __line, "couldn't load candidate", err);
        }
        if (candidate) { // Safety
            if (!candidate.formCompleted) {
                console.log("%s.%s:%s -", __file, __ext, __line, "Can't calculate for an incomplete form", err);
                // If form wasn't completed don't try to calculate the report
                if (callback) {
                    callback(candidate);
                }
                return;
            }
            if ((candidate.report) && (candidate.report.completed)) {
                // Report was already calculated before
                if (callback) {
                    callback(candidate);
                }
                return;
            }

            // Calculate factor averages
            getFactorsAvg(candidate, function (factorsData, finalScore) {
                console.log("%s.%s:%s -", __file, __ext, __line, "factorsData: ", factorsData);
                if (!factorsData)
                { // Couldn't read factors data file
                    callback(candidate, false);
                    return;
                }
                var isMale = (candidate.gender == 'male'); // Gender adjustment
                // Get text based on factor averages
                getVerbalText(factorsData, isMale, req.client.keyword, function (strengths, weaknesses) {
                    if (!strengths) { // verbal text wasn't retrieved
                        callback(candidate, false);
                        return;
                    }
                    // Prepare report object for storage
                    var report = {}
                    report.strengths = strengths;
                    report.weaknesses = weaknesses;
                    report.finalScore = finalScore;
                    report.factorsData = factorsData;
                    report.completed = true;

                    candidate.report = report;

                    // Store report data in DB
                    candidate.save(function (err, entry) {
                        if (err) {
                            console.log("%s.%s:%s -", __file, __ext, __line, "unable To save report data", err);
                        }
                        else {
                            console.log("%s.%s:%s -", __file, __ext, __line, "Stored report data");
                        }
                    });
                    if (callback) {
                        callback(candidate);
                    }
                });
            });
        }
    });
}

exports.generateRecruiterReport = function (req, res) {
    console.log("%s.%s:%s -", __file, __ext, __line);
    exports.calcRecruiterReport(req, res, function (candidate, status = true) {
        // console.log("%s.%s:%s -", __file, __ext, __line, "candidate: ", candidate);
        const langHeb = (req.client.language !== 'en');
        if ((status) && (candidate) && (candidate.report) && (candidate.report.completed)) { // Safety
            // console.log("%s.%s:%s -", __file, __ext, __line, "candidate: ", candidate);
            textGenerator_Ctrl.initRecruiterReportText(!langHeb, function (recruiterReportText) {
                res.render('recruiterReport', {
                    title: (langHeb ? 'דוח מועמד - ' : 'Candidate Report - ') + candidate.fullName,
                    client: req.client,
                    sid: req.sid,
                    candidate: candidate,
                    text: recruiterReportText
                });
            });
        }
        else {
            res.render('niceError', {
                title: (langHeb ? 'דוח מועמד - ' : 'Candidate Report - ') + candidate.fullName,
                errorText: langHeb ? 'המועמד טרם השלים את מילוי השאלון' : 'The candidate has not completed the questionnaire yet'
            });
        }
    });
};

function getFactorsAvg(candidate, callback) {
    var factors = [];
    var testScore = 0;


    addFile_Ctrl.getFile(['report factors - factorsTranspose.csv'])
        .then(fileName => {
            console.log("%s.%s:%s -", __file, __ext, __line, "File found: ", fileName);
            csv({noheader: true})
                .fromFile(fileName)
                .on('csv', (csvRow) => {
                    // csvRow is an array
                    var factorAvg = 0;
                    var numOfElementsInFactor = 0;
                    var factor = csvRow[0];
                    //var isRevereRelation = csvRow[1];
                    //console.log("%s.%s:%s -", __file, __ext, __line, "reverse realtion: ", isRevereRelation);
                    for (var factorElementIndex = 1; factorElementIndex < csvRow.length; factorElementIndex++) {
                        if (csvRow[factorElementIndex] == '') {
                        }
                        else {
                            numOfElementsInFactor++;
                            for (var qIndex = 0; qIndex < candidate.form.length; qIndex++) {
                                if (candidate.form[qIndex].id == csvRow[factorElementIndex]) {
                                    if (candidate.form[qIndex].type == 'C') {
                                        var score = (candidate.form[qIndex].optAnswer == candidate.form[qIndex].finalAnswer) ? 7 : 1;
                                    }
                                    else if (candidate.form[qIndex].id.trim().charAt(candidate.form[qIndex].id.length - 1) == 'r') {
                                        var score = Math.abs(Number(candidate.form[qIndex].finalAnswer) - 8);
                                    }
                                    else {
                                        var score = Number(candidate.form[qIndex].finalAnswer);
                                    }
                                    factorAvg += score;
                                    //console.log("%s.%s:%s -", __file, __ext, __line, "question id: " + candidate.form[qIndex].id + " score: " + score);
                                }
                            }
                        }
                    }
                    var factorData = {};
                    factorData.name = factor;
                    factorData.avg = factorAvg / numOfElementsInFactor;
                    //factorData.isRevereRelation = isRevereRelation;
                    testScore += factorData.avg;

                    // console.log("%s.%s:%s -", __file, __ext, __line, "factor: " + factor + " avg: " + factorData.avg);
                    factors.push(factorData);
                })
                .on('data', (data) => {
                    //data is a buffer object
                    //const jsonStr= data.toString('utf8');
                    //var factor = JSON.parse(jsonStr);
                })
                .on('done', (error) => {
                    var testScoreAvg = testScore / factors.length;
                    console.log("%s.%s:%s -", __file, __ext, __line, "test score ", testScore);
                    console.log("%s.%s:%s -", __file, __ext, __line, "num of factors ", factors.length);
                    console.log("%s.%s:%s -", __file, __ext, __line, "test avg ", testScoreAvg);
                    if (testScoreAvg < 1.5) {
                        var finalScore = Math.round(testScoreAvg);
                    }
                    else if (testScoreAvg >= 1.5 && testScoreAvg < 3) {
                        var finalScore = 2;
                    }
                    else if (testScoreAvg >= 3 && testScoreAvg < 5) {
                        var finalScore = 3;
                    }
                    else if (testScoreAvg >= 5 && testScoreAvg < 6.5) {
                        var finalScore = 4;
                    }
                    else {
                        var finalScore = 5;//;Math.round(testScoreAvg-2);
                    }

                    console.log("%s.%s:%s -", __file, __ext, __line, "test avg conversion to 1-5 ", finalScore);
                    callback(factors, finalScore);
                })
                .on('error', (err) => {
                    console.log("%s.%s:%s -", __file, __ext, __line, "Unable to read csv file 'factorsTranspose.csv ", err)
                })
        })
        .catch(error => { // 'report factors - factorsTranspose.csv' not found
            console.log("%s.%s:%s -", __file, __ext, __line, "Error: ", error);
            callback(null);
        });
}

function getVerbalText(factorsData, isMale, companyKeyword, callback) {
    var strengths = [];
    var weaknesses = [];
    const baseFileName = 'report factors - verbal';

    addFile_Ctrl.getFile([baseFileName + '.' + companyKeyword + '.csv', baseFileName + '.csv'])
        .then(fileName => {
            console.log("%s.%s:%s -", __file, __ext, __line, "File found: ", fileName);
            csv()
                .fromFile('/tmp/' + fileName)
                .on('data', (data) => {
                    //data is a buffer object
                    //parseVerbalData(factorsData, isMale, data);
                    const jsonStr = data.toString('utf8');
                    var factorVerbal = JSON.parse(jsonStr);

                    factorsData.forEach(function (factor) {
                        //console.log("%s.%s:%s -", __file, __ext, __line, factor.name);
                        if (factor.name == factorVerbal['SHORT NAME']) {
                            /* if reverse relation exists (0) thank put the factor in the opposite column. */
                            var isStrength = ((factor.avg >= 4.5 && factorVerbal['isReverseRelation'] == '1') ||
                                (factor.avg <= 3.5 && factorVerbal['isReverseRelation'] == '0'));
                            var isWeakness = ((factor.avg <= 3.5 && factorVerbal['isReverseRelation'] == '1') ||
                                (factor.avg >= 4.5 && factorVerbal['isReverseRelation'] == '0'));
                            var verbalKey = (factor.avg >= 4.5) ? (isMale) ? 'HE HIGH MALE' : 'HE HIGH FEMALE'
                                : (factor.avg <= 3.5) ? (isMale) ? 'HE LOW MALE' : 'HE LOW FEMALE'
                                    : (isMale) ? 'HE AVG MALE' : 'HE AVG FEMALE';

                            var verbalData = {};
                            verbalData.id = factorVerbal['SHORT NAME'];
                            verbalData.title = factorVerbal['HE FACTOR'];
                            verbalData.text = factorVerbal[verbalKey].split('\n');

                            if (isStrength) {
                                console.log("%s.%s:%s -", __file, __ext, __line, "strength added ", factor);
                                strengths.push(verbalData);
                            }
                            else if (isWeakness) {
                                console.log("%s.%s:%s -", __file, __ext, __line, "weaknes added ", factor);
                                weaknesses.push(verbalData);
                            }
                        }
                    })
                })
                .on('done', (error) => {
                    if (!error) {
                        console.log("%s.%s:%s -", __file, __ext, __line, "weaknesses: " + weaknesses);
                        console.log("%s.%s:%s -", __file, __ext, __line, "strengths: " + strengths);
                        callback(strengths, weaknesses);
                    }
                    else {
                        console.log("%s.%s:%s -", __file, __ext, __line, "Error reading csv: ", error);
                        callback(null);
                    }

                })
                .on('error', (error) => {
                    console.log("%s.%s:%s -", __file, __ext, __line, "Error reading csv: ", error);
                    callback(null);
                })
        })
        .catch(error => { // report factors - verbal not found
            console.log("%s.%s:%s -", __file, __ext, __line, "Error: ", error);
            callback(null);
        });
}

