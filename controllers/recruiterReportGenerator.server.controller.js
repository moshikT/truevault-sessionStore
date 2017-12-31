"use strict";
var express = require('express');
var csv = require("csvtojson");
var fs = require('fs');
var Candidate = require('../models/candidate.server.model.js');
var textGenerator_Ctrl = require('../controllers/textGenerator.server.controller');
const addFile_Ctrl = require('../controllers/addFile.server.controller');
const trueVault_Ctrl = require('../controllers/truevault.server.controller');

//['EQ', 'LEARNING', 'OUTCOME DRIVEN', 'EMOTIONAL STABILITY', 'ASSERTIVENESS',
//'MOTIVATION TO MAKE MONEY', 'SOCIAL DESIRABILITY', 'ATTENTIVENESS TO DETAILS', 'WORK TENDENCY'];

// calcRecruiterReport
exports.calcRecruiterReport = function (req, res, callback) {
    // Lookup the candidate
    Candidate.findOne({'session.id': req.sid}, function (err, candidate) {
        if (err) {
            console.log("%s.%s:%s -", __file, __ext, __line, "couldn't load candidate", err);
            callback(null);
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
                console.log("%s.%s:%s -", __file, __ext, __line, req.query);
                if ((req.query.force !== '1') && (req.query.test !== '1')) { // Not instructed to force recalc of report
                    console.log("%s.%s:%s -", __file, __ext, __line, req.query.force);
                    if (callback) {
                        callback(candidate);
                    }
                    return;
                }
            }

            // Initialize the factors scale conversion data
            getFactorsScaleConversion(req.customer.keyword, function (scaleConversion) {
                if (scaleConversion == null) { // There was an error reading the file
                    console.log("%s.%s:%s -", __file, __ext, __line, "Error reading scale conversion");
                    // If form wasn't completed don't try to calculate the report
                    if (callback) {
                        callback(candidate);
                    }
                    return;
                }

                // Calculate factor averages
                getFactorsAvg(candidate, req.customer.keyword, scaleConversion, function (subDims, finalScore) {
                    //console.log("%s.%s:%s -", __file, __ext, __line, "subDims: ", subDims);
                    if (!subDims) { // Couldn't read factors data file
                        callback(candidate, false);
                        return;
                    }
                    var isMale = (candidate.gender == 'male'); // Gender adjustment
                    // Get text based on factor averages
                    getVerbalText(req.lang, subDims, isMale, req.customer.keyword, function (strengths, weaknesses) {
                        if (!strengths) { // verbal text wasn't retrieved
                            callback(candidate, false);
                            return;
                        }
                        // Prepare report object for storage
                        var report = {}
                        report.strengths = strengths;
                        report.weaknesses = weaknesses;
                        report.finalScore = finalScore;
                        report.subDims = subDims;
                        report.completed = true;

                        candidate.report = report;

                        if (req.query.test !== '1') { // This is not a test report
                            // Store report data in DB
                            candidate.save(function (err, entry) {
                                if (err) {
                                    console.log("%s.%s:%s -", __file, __ext, __line, "unable To save report data", err);
                                }
                                else {
                                    console.log("%s.%s:%s -", __file, __ext, __line, "Stored report data");
                                }
                            });
                        }
                        trueVault_Ctrl.getDocumentById(candidate.personalDataId) // Return one document that equal to the documentId.
                            .then(candidatePersonalData => {
                                console.log("candidatesPersonalData", candidatePersonalData);
                                candidate.personalData = candidatePersonalData;

                                if (callback) {
                                    callback(candidate);
                                }
                            })
                            .catch(err => {
                                console.log("%s.%s:%s -", __file, __ext, __line, "error while fetching candidates personal data: ", err);
                                // try render page anyway
                                if (callback) {
                                    callback(candidate);
                                }
                            })
                    });
                });

            });
        }
    });
}

exports.generateRecruiterReport = function (req, res) {
    console.log("%s.%s:%s -", __file, __ext, __line);
    exports.calcRecruiterReport(req, res, function (candidate, status = true) {
        console.log("%s.%s:%s -", __file, __ext, __line, "Candidate report for '", candidate.fullName, "' - Completed: ", candidate.report.completed);
        if ((status) && (candidate) && (candidate.report) && (candidate.report.completed)) { // Safety
            // console.log("%s.%s:%s -", __file, __ext, __line, "candidate: ", candidate);
            textGenerator_Ctrl.initRecruiterReportText(req.lang, function (pageText) {
                res.render('recruiterReport', {
                    title: pageText.title + candidate.fullName,
                    textDirection: pageText.textDir,
                    textAlign: pageText.textAlign,
                    customer: req.customer,
                    sid: req.sid,
                    candidate: candidate,
                    text: pageText
                });
            });
        }
        else {
            res.render('niceError', { // FIXME: These texts should also be provided externally
                title: (req.lang === 'he') ? 'דוח מועמד - ' : 'Candidate Report - ' + candidate.fullName,
                errorText: (req.lang === 'he') ? 'המועמד טרם השלים את מילוי השאלון' : 'The candidate has not completed the questionnaire yet'
            });
        }
    });
};

function getFactorsScaleConversion(companyKeyword, callback) {
    let scaleConversion = {};
    const baseFileName = 'report.scale.conversion';

    addFile_Ctrl.getFile([baseFileName + '.' + companyKeyword + '.csv', baseFileName + '.csv'])
        .then(filePath => {
            console.log("%s.%s:%s -", __file, __ext, __line, "File found: ", filePath);
            csv({noheader: true})
                .fromFile(filePath)
                .on('csv', (csvRow) => {
                    // factor id, weight, range 1-3
                    if (csvRow[3] != '') {
                        scaleConversion[csvRow[0]] = {
                            weight: parseFloat(csvRow[2]),
                            factor: csvRow[1],
                            ranges: [parseFloat(csvRow[3]), parseFloat(csvRow[4]), parseFloat(csvRow[5])]
                        };
                    }
                    else {
                        scaleConversion[csvRow[0]] = {weight:  parseFloat(csvRow[2]), factor: csvRow[1], ranges: [4.08, 4.98, 6.1]};
                    }
                    console.log("%s.%s:%s -", __file, __ext, __line, "scaleConversion[", csvRow[0], "] = ", scaleConversion[csvRow[0]]);
                })
                .on('done', (error) => {
                    if (!error) {
                        callback(scaleConversion);
                    }
                    else {
                        console.log("%s.%s:%s -", __file, __ext, __line, "Error reading csv: ", error);
                        callback(null);
                    }
                })
                .on('error', (err) => {
                    console.log("%s.%s:%s -", __file, __ext, __line, "Unable to read csv file ", baseFileName, "; error: ", err);
                    callback(null);
                })
        })
        .catch(error => { // file not found
            console.log("%s.%s:%s -", __file, __ext, __line, "Error: ", error);
            callback(null);
        });
}

function getFactorsAvg(candidate, companyKeyword, scaleConversion, callback) {
    let factors = {};
    let subDims = [];
    let testScore = 0;
    let testWeight = 0;
    const baseFileName = 'report.items';
    let answers = {}

    // First create an object indexed by qids for all the answer data
    for (let qIndex = 0; qIndex < candidate.form.length; qIndex++) {
        let score;
        if (candidate.form[qIndex].type == 'C') {
            score = (candidate.form[qIndex].optAnswer == candidate.form[qIndex].finalAnswer) ? 7 : 1;
            //console.log("%s.%s:%s -", __file, __ext, __line, "Question ID: ", candidate.form[qIndex].id, "; score: ", score);
        }
        else if (candidate.form[qIndex].id.trim().charAt(candidate.form[qIndex].id.length - 1) == 'r') {
            score = 8 - Number(candidate.form[qIndex].finalAnswer);
            //console.log("%s.%s:%s -", __file, __ext, __line, "Question ID: ", candidate.form[qIndex].id, "; score: ", score);
        }
        else {
            score = Number(candidate.form[qIndex].finalAnswer);
            //console.log("%s.%s:%s -", __file, __ext, __line, "Question ID: ", candidate.form[qIndex].id, "; score: ", score);
        }
        answers[candidate.form[qIndex].id] = score;
    }
    console.log("%s.%s:%s -", __file, __ext, __line, "Answers: ", answers);


    addFile_Ctrl.getFile([baseFileName + '.' + companyKeyword + '.csv', baseFileName + '.csv'])
        .then(filePath => {
            console.log("%s.%s:%s -", __file, __ext, __line, "File found: ", filePath);
            csv({noheader: true})
                .fromFile(filePath)
                .on('csv', (csvRow) => {
                    // csvRow is an array
                    var subDimAvg = 0;
                    var numOfElementsInSubDim = 0;
                    var subDim = csvRow[0];
                    //var isRevereRelation = csvRow[1];
                    //console.log("%s.%s:%s -", __file, __ext, __line, "csvRow : ", csvRow);
                    //console.log("%s.%s:%s -", __file, __ext, __line, "subDim : ", subDim);

                    for (var subDimElementIndex = 1; subDimElementIndex < csvRow.length; subDimElementIndex++) {
                        if (csvRow[subDimElementIndex] == '') {
                        }
                        else {
                            const score = answers[csvRow[subDimElementIndex]];
                            if (!score) {
                                console.log("%s.%s:%s -", __file, __ext, __line, "Question id not found: ", csvRow[subDimElementIndex]);
                            }
                            else {
                                subDimAvg += answers[csvRow[subDimElementIndex]];
                                numOfElementsInSubDim++;
                            }
                        }
                    }
                    let subDimData = {};
                    let subDimScale = 7;
                    // Calculate the subDim average on a scale of 1-7
                    subDimAvg = subDimAvg / numOfElementsInSubDim;
                    subDimData.subDimension = subDim;
                    let subDimScaleConversion = scaleConversion[subDim];
                    if (!subDimScaleConversion) {
                        subDimScaleConversion = {weight: 0, ranges: [4.08, 4.98, 6.1]};
                    }
                    subDimData.scaleConversion = subDimScaleConversion;
                    if (subDimScale == 4) { // Convert sub-dimension from 1-7 to 1-4 scale based on distribution
                        // Convert to a scale of 1-4
                        subDimData.avg =
                            (subDimAvg <= subDimScaleConversion.ranges[0]) ? 1 :
                                ((subDimAvg <= subDimScaleConversion.ranges[1]) ? 2 :
                                        ((subDimAvg <= subDimScaleConversion.ranges[2]) ? 3 :
                                                4
                                        )
                                );
                    }
                    else { // Keep the sub-dimension on a scale of 1-7
                        subDimData.avg = subDimAvg;
                    }
                    let subDimAvgAfterDirection = subDimData.avg; // At this point the average isn't reversed
                    if (scaleConversion[subDim].weight < 0) { // If it's a negative weight, we need to include the subDim average reversed (1-4 --> 4-1) (1-7 --> 7-1)
                        subDimAvgAfterDirection = subDimScale + 1 - subDimAvgAfterDirection;
                    }
                    // Should we include this sub dimension in the factor average?
                    if (scaleConversion[subDim].weight !== 0) { // Yes
                        // Get the current accumulated data for this factor
                        subDimData.factorName = scaleConversion[subDim].factor;
                        let factorData = factors[subDim.factorName];
                        if (!factorData) { // No data has been accumulated yet - so start from zero
                            factorData = {count: 1, total: subDimAvgAfterDirection};
                        }
                        else { // There's data already - so just add to it
                            factorData.count++;
                            factorData.total += subDimAvgAfterDirection;
                        }
                        // Save/update the data for this factor
                        factors[scaleConversion[subDim].factor] = factorData;
                    }
                    else {
                        console.log("%s.%s:%s -", __file, __ext, __line, "Not including subDim in average - ", subDim);
                    }
                    /*
                    testScore += (subDimData.avg * Math.abs(subDimScaleConversion.weight));
                    testWeight += Math.abs(subDimScaleConversion.weight);
                    */
                    // Note that we keep the subDim average not reversed for the verbal
                    subDims.push(subDimData);
                })
                .on('data', (data) => {
                    //data is a buffer object
                    //const jsonStr= data.toString('utf8');
                    //var subDim = JSON.parse(jsonStr);
                })
                .on('done', (error) => {
                    //console.log("%s.%s:%s -", __file, __ext, __line, "Subdims: ", subDims);
                    for (let i=0;i<subDims.length;i++) {
                        const subDim = subDims[i];
                        console.log(`${__file}.${__ext}:${__line} -`,
                            `subDim ${subDim.subDimension} - factor: ${subDim.factorName}; weight: ${subDim.scaleConversion.weight}; `,
                            `ranges: ${subDim.scaleConversion.ranges}; avg: ${subDim.avg}; `/*,
                            `${(isWeakness) ? 'is weakness' : (isStrength ? 'is strength' : '')}`*/);
                    }

                    console.log("%s.%s:%s -", __file, __ext, __line, "Factors: ", factors);
                    let testScoreAvg = 0;
                    let count = 0;
                    // Loop through all the factors and add them to the total
                    for (var property in factors) {
                        if (factors.hasOwnProperty(property)) {
                            factors[property] = factors[property].total / factors[property].count;
                            testScoreAvg += factors[property];
                            count++;
                        }
                    }
                    // Now divide the total by the number of factors to get the average
                    testScoreAvg /= count;
                    console.log("%s.%s:%s -", __file, __ext, __line, "Test average: ", testScoreAvg);
                    /*
                    var testScoreAvg = testScore / testWeight;
                    console.log("%s.%s:%s -", __file, __ext, __line, "test score ", testScore);
                    console.log("%s.%s:%s -", __file, __ext, __line, "total weight ", testWeight);
                    console.log("%s.%s:%s -", __file, __ext, __line, "test avg ", testScoreAvg);
                    */
                    const finalScore =
                        scaleConversion.total ?
                            ((testScoreAvg <= scaleConversion.total.ranges[0]) ? 1 :
                            ((testScoreAvg <= scaleConversion.total.ranges[1]) ? 2 :
                                    ((testScoreAvg <= scaleConversion.total.ranges[2]) ? 3 : 4)
                            )) :
                            (testScoreAvg - 1) * 4 / 6 + 1;
                    console.log("%s.%s:%s -", __file, __ext, __line, "Final score (1-4): ", finalScore);
                    callback(subDims, finalScore);
                })
                .on('error', (err) => {
                    console.log("%s.%s:%s -", __file, __ext, __line, "Unable to read csv file 'report.items ", err);
                    callback(null);
                })
        })
        .catch(error => { // 'report factors - factorsTranspose.csv' not found
            console.log("%s.%s:%s -", __file, __ext, __line, "Error: ", error);
            callback(null);
        });
}

function getVerbalText(lang, subDimsData, isMale, companyKeyword, callback) {
    var strengths = [];
    var weaknesses = [];
    const baseFileName = 'report.verbal';

    addFile_Ctrl.getFile([baseFileName + '.' + companyKeyword + '.csv', baseFileName + '.csv'])
        .then(filePath => {
            console.log("%s.%s:%s -", __file, __ext, __line, "File found: ", filePath);
            csv()
                .fromFile(filePath)
                .on('data', (data) => {
                    //data is a buffer object
                    //parseVerbalData(subDimsData, isMale, data);
                    const jsonStr = data.toString('utf8');
                    var subDimVerbal = JSON.parse(jsonStr);

                    //console.log("%s.%s:%s -", __file, __ext, __line, "subDimVerbal: ", subDimVerbal);
                    for (let i=0;i<subDimsData.length;i++) {
                        const subDim = subDimsData[i];
                        //console.log("%s.%s:%s -", __file, __ext, __line, subDim.factorName);
                        if (subDim.subDimension == subDimVerbal['SUB_DIMENSION']) {
                            subDim.factorName = subDimVerbal['SHORT NAME'];
                            const loRange = subDim.scaleConversion.ranges[0];
                            const hiRange = subDim.scaleConversion.ranges[2];
                            // if reverse relation exists (0) than put the subDim in the opposite column.
                            const isStrength = ((subDim.avg >= hiRange && subDimVerbal['isReverseRelation'] == '1') ||
                                (subDim.avg <= loRange && subDimVerbal['isReverseRelation'] == '0'));
                            // Use env variable for setting whether to include average scores in the verbal report or not
                            const includeAvg = (process.env.INCLUDE_AVG === 'yes') ? true : false; // Default is don't include
                            // If included, treat average scores as weaknesses in the report
                            const isWeakness = ((subDim.avg < (includeAvg ? hiRange : loRange) && subDimVerbal['isReverseRelation'] == '1') ||
                                (subDim.avg > (includeAvg ? loRange : hiRange) && subDimVerbal['isReverseRelation'] == '0'));
                            const langPrefix = lang.toUpperCase();
                            const genderSuffix = (textGenerator_Ctrl.isLangGenderless(lang)) ? '' : ((isMale) ? ' MALE' : ' FEMALE');
                            const verbalKey = (subDim.avg >= hiRange) ? (isMale) ? (langPrefix + ' HIGH' + genderSuffix) : (langPrefix + ' HIGH' + genderSuffix)
                                : (subDim.avg <= loRange) ? (isMale) ? (langPrefix + ' LOW' + genderSuffix) : (langPrefix + ' LOW' + genderSuffix)
                                    : (isMale) ? (langPrefix + ' AVG' + genderSuffix) : (langPrefix + ' AVG' + genderSuffix);

                            /** Go through the weaknesses and strengths array and if id already exists
                             *  concat text else create new verbalData object */
                            let verbalData = {};
                            verbalData.id = subDimVerbal['SHORT NAME'];
                            verbalData.title = subDimVerbal[langPrefix + ' FACTOR'];
                            //console.log("%s.%s:%s -", __file, __ext, __line, "verbalKey: ", verbalKey, "; subDimVerbal[verbalKey] - ", subDimVerbal[verbalKey]);
                            verbalData.text = subDimVerbal[verbalKey] ? subDimVerbal[verbalKey].split('\n') : '';

                            let elementExists = false;
                            if (isStrength) {
                                for (let strengthsIndex = 0; strengthsIndex < strengths.length; strengthsIndex++) {
                                    // if factor existed add subDimension to text
                                    if (strengths[strengthsIndex].id === verbalData.id) {
                                        elementExists = true;
                                        //console.log("%s.%s:%s -", __file, __ext, __line, "Prev text: ", strengths[strengthsIndex].text);
                                        strengths[strengthsIndex].text = strengths[strengthsIndex].text.concat(verbalData.text);
                                        //console.log("%s.%s:%s -", __file, __ext, __line, "New text: ", strengths[strengthsIndex].text);
                                    }
                                }
                                if (!elementExists) { // This is a subDim for a new factor
                                    strengths.push(verbalData);
                                }
                                else { // This subDim was added to an existing factor
                                    // console.log(`${__file}.${__ext}:${__line} -`, `Factor exists in strengths - text was added to ${verbalData.id} text: ${verbalData.text});
                                }
                                //console.log("%s.%s:%s -", __file, __ext, __line, "strength added ", subDim);
                            }
                            else if (isWeakness) {
                                for (let WeaknessIndex = 0; WeaknessIndex < weaknesses.length; WeaknessIndex++) {
                                    // if factor existed add subDimension to text
                                    if (weaknesses[WeaknessIndex].id === verbalData.id) {
                                        elementExists = true;
                                        weaknesses[WeaknessIndex].text = weaknesses[WeaknessIndex].text.concat(verbalData.text);
                                    }
                                }
                                if (!elementExists) { // This is a subDim for a new factor
                                    weaknesses.push(verbalData);
                                }
                                else {
                                    // console.log(`${__file}.${__ext}:${__line} -`, `Factor exists in weaknesses - text was added to ${verbalData.id} text: ${verbalData.text});
                                }

                                //console.log("%s.%s:%s -", __file, __ext, __line, "weakness added ", subDim);
                            }
                        }
                    }
                })
                .on('done', (error) => {
                    if (!error) {
                        //console.log("%s.%s:%s -", __file, __ext, __line, "weaknesses: " + weaknesses);
                        //console.log("%s.%s:%s -", __file, __ext, __line, "strengths: " + strengths);
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

