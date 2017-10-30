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

            getFactorsAvg(candidate, function (factorsData) {

                var isMale = true; // TODO: get from candidate's doc
                getVerbalText(factorsData, isMale, function (strengths, weaknesses) {
                    //console.log("strengths ", strengths);
                    //console.log("weaknesses ", weaknesses);

                    candidate.report = {};
                    candidate.report.strengths = strengths;
                    candidate.report.weaknesses = weaknesses;
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

    csv({noheader:true})
        .fromFile('report factors - factorsTranspose.csv')
        .on('csv',(csvRow)=>{
            // csvRow is an array
            var factorAvg = 0;
            var numOfElementsInFactor = 0;
            var factor  = csvRow[0];
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
                        }
                    }
                }
            }
            var factorData = {};
            factorData.name = factor;
            factorData.avg = factorAvg/numOfElementsInFactor;
            factors.push(factorData);
        })
        .on('data',(data)=>{
            //data is a buffer object
            //const jsonStr= data.toString('utf8');
            //var factor = JSON.parse(jsonStr);
        })
        .on('done',(error)=>{
            callback(factors);
        })
}

function getVerbalText(factorsData, isMale, callback) {
    var strengths = [];
    var weaknesses = [];

    csv()
        .fromFile('report factors - verbal.csv')
        .on('data',(data)=>{
            //data is a buffer object

            const jsonStr= data.toString('utf8');
            var factorVerbal = JSON.parse(jsonStr);

            factorsData.forEach(function (factor) {
                //console.log(factor.name);
                if(factor.name == factorVerbal['SHORT NAME']) {
                    var isStrength = (factor.avg > 4.5);
                    var isWeakness = (factor.avg < 4);
                    var verbalKey = isStrength ? (isMale) ? 'HE HIGH MALE' : 'HE HIGH FEMALE'
                        : isWeakness ? (isMale) ? 'HE LOW MALE' : 'HE LOW FEMALE'
                        : (isMale) ? 'HE AVG MALE' : 'HE AVG FEMALE';

                    var verbalData = {};
                    verbalData.id = factorVerbal['SHORT NAME'];
                    verbalData.title = factorVerbal['HE FACTOR'];
                    verbalData.text = factorVerbal[verbalKey].split('\n');

                    if(isStrength) {
                        strengths.push(verbalData);
                    }
                    else if (isWeakness) {
                        weaknesses.push(verbalData);
                    }
                }
            })
        })
        .on('done',(error)=>{
            callback(strengths, weaknesses);
        })
}