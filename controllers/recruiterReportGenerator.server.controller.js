var express = require('express');
var csv = require("csvtojson");
var fs = require('fs');
var Candidate = require('../models/candidate.server.model.js');

//['EQ', 'LEARNING', 'OUTCOME DRIVEN', 'EMOTIONAL STABILITY', 'ASSERTIVENESS',
    //'MOTIVATION TO MAKE MONEY', 'SOCIAL DESIRABILITY', 'ATTENTIVENESS TO DETAILS', 'WORK TENDENCY'];

exports.generateRecruiterReport = function (req, res) {
    Candidate.findOne({'session.id': req.sid }, function (err, candidate) {
        if(err) {
            console.log("couldn't loac candidate", err);
        }
        if (candidate) {
            // TODO: calculate average by formula

            getFactorsAvg(candidate, function (factorsData, finalScore) {

                var isMale = (candidate.gender == 'male'); // TODO: get from candidate's doc
                getVerbalText(factorsData, isMale, req.client.keyword, function (strengths, weaknesses) {
                    //console.log("strengths ", strengths);
                    //console.log("weaknesses ", weaknesses);
                    var report = {}
                    report.strengths = strengths;
                    report.weaknesses = weaknesses;
                    report.finalScore = finalScore;

                    candidate.report = report;

                    candidate.save(function(err, entry){
                        if(err) {
                            console.log("unable To save", err);
                        }
                        else {
                            console.log("succeed update final answer");
                        }
                    });
                    /*
                    // TODO: save candidate average in the db

                    candidate.totalAvg = calculatedAVG;

                    candidate.save(function(err, entry){
                        if(err) {
                            console.log("unable To save", err);
                        }
                        else {
                            console.log("succeed update final answer");
                        }
                    });*/

                    res.render('recruiterReport', {
                        title: '',
                        client: req.client,
                        sid: req.sid,
                        candidate: candidate
                    });
                });
            });
        }
    });
}

function getFactorsAvg(candidate, callback) {
    var factors = [];
    var testScore = 0;

    csv({noheader:true})
        .fromFile('report factors - factorsTranspose.csv')
        .on('csv',(csvRow)=>{
            // csvRow is an array
            var factorAvg = 0;
            var numOfElementsInFactor = 0;
            var factor  = csvRow[0];
            //var isRevereRelation = csvRow[1];
            //console.log("reverse realtion: ", isRevereRelation);
            for (var factorElementIndex = 1; factorElementIndex < csvRow.length; factorElementIndex++) {
                if (csvRow[factorElementIndex] == '') {}
                else {
                    numOfElementsInFactor++;
                    for(var qIndex = 0; qIndex < candidate.form.length; qIndex++) {
                        if(candidate.form[qIndex].id == csvRow[factorElementIndex]) {
                            if(candidate.form[qIndex].type == 'C') {
                                var score = (candidate.form[qIndex].optAnswer == candidate.form[qIndex].finalAnswer) ? 7 : 1;
                            }
                            else if (candidate.form[qIndex].id.trim().charAt(candidate.form[qIndex].id.length - 1) == 'r') {
                                var score = Math.abs(Number(candidate.form[qIndex].finalAnswer) - 8);
                            }
                            else {
                                var score = Number(candidate.form[qIndex].finalAnswer);
                            }
                            factorAvg += score;
                            console.log("question id: " + candidate.form[qIndex].id + " score: " + score);
                        }
                    }
                }
            }
            var factorData = {};
            factorData.name = factor;
            factorData.avg = factorAvg/numOfElementsInFactor;
            //factorData.isRevereRelation = isRevereRelation;
            testScore += factorData.avg;

            console.log("factor: " + factor + " avg: " + factorData.avg);
            factors.push(factorData);
        })
        .on('data',(data)=>{
            //data is a buffer object
            //const jsonStr= data.toString('utf8');
            //var factor = JSON.parse(jsonStr);
        })
        .on('done',(error)=>{
            var testScoreAvg = testScore/factors.length;
            console.log("test score ", testScore);
            console.log("num of factors ", factors.length);
            console.log("test avg ", testScoreAvg);
            if(testScoreAvg < 1.5) {
                var finalScore = Math.round(testScoreAvg);
            }
            else if(testScoreAvg >= 1.5 && testScoreAvg < 3) {
                var finalScore = 2;
            }
            else if(testScoreAvg >= 3 && testScoreAvg < 5) {
                var finalScore = 3;
            }
            else if(testScoreAvg >= 5 && testScoreAvg < 6.5) {
                var finalScore = 4;
            }
            else {
                var finalScore = 5;//;Math.round(testScoreAvg-2);
            }

            console.log("test avg conversion to 1-5 ", finalScore);
            callback(factors, finalScore);
        })
        .on('error',(err)=>{
            console.log("Unable to read csv file 'factorsTranspose.csv ", err)
        })
}

function getVerbalText(factorsData, isMale, companyKeyword, callback) {
    var strengths = [];
    var weaknesses = [];
    var fileName = 'report factors - verbal.csv';


    if(companyKeyword != 'default' && companyKeyword != '') {
        fileName = 'report factors - verbal' + '.' + companyKeyword + '.csv'
    }

    console.log("file name: ", fileName);

    csv()
        .fromFile(fileName)
        .on('data',(data)=>{
            //data is a buffer object
            //parseVerbalData(factorsData, isMale, data);
            const jsonStr= data.toString('utf8');
            var factorVerbal = JSON.parse(jsonStr);

            factorsData.forEach(function (factor) {
                //console.log(factor.name);
                if(factor.name == factorVerbal['SHORT NAME']) {
                    /* if reverse relation exists (0) thank put the factor in the opposite column. */
                    var isStrength = ((factor.avg >= 4.5 && factorVerbal['isReverseRelation'] == '1') ||
                                        (factor.avg <= 3.5 && factorVerbal['isReverseRelation'] == '0'));
                    var isWeakness = ((factor.avg <= 3.5 && factorVerbal['isReverseRelation'] == '1')||
                                        (factor.avg >= 4.5 && factorVerbal['isReverseRelation'] == '0'));
                    var verbalKey = isStrength ? (isMale) ? 'HE HIGH MALE' : 'HE HIGH FEMALE'
                        : isWeakness ? (isMale) ? 'HE LOW MALE' : 'HE LOW FEMALE'
                        : (isMale) ? 'HE AVG MALE' : 'HE AVG FEMALE';

                    var verbalData = {};
                    verbalData.id = factorVerbal['SHORT NAME'];
                    verbalData.title = factorVerbal['HE FACTOR'];
                    verbalData.text = factorVerbal[verbalKey].split('\n');

                    if(isStrength) {
                        console.log("strength added ", factor);
                        strengths.push(verbalData);
                    }
                    else if (isWeakness) {
                        console.log("weaknes added ", factor);
                        weaknesses.push(verbalData);
                    }
                }
            })
        })
        .on('done',(error)=>{
            if(!error) {
                console.log("weaknesses: " + weaknesses);
                console.log("strengths: " + strengths);
                callback(strengths, weaknesses);
            }
            else {
                console.log("error occur at done ", error);
                getVerbalText(factorsData, isMale, 'default', callback);
            }

        })
        .on('error',(err)=>{
            console.log("Unable to read csv file " + fileName + ", err: " + err + "! reading default instead");
        })
}
