// Candidates status controller
// Displays a list of all the candidates for a certain client with a few details on questionnaire status
// let express = require('express');   //Express
// let fs = require('fs');             //Node.js file I/O
// let path = require('path');          //Node.js file & directory
const textGenerator_Ctrl = require('../controllers/textGenerator.server.controller');

const ejsLint = require('ejs-lint');

const Candidate = require('../models/candidate.server.model.js');    //import candidate schema
const trueVault_Ctrl = require('../controllers/truevault.server.controller');

exports.candidatesStatus = function (req, res) {
    // Retrieve all candidates
    // batchSize = 1000000 - allows up to 1000000 documents in each batch in order to make the response much faster
    // exahust = true - doesn't wait for the client to process the results before proceeding to next batch
    const fields = (req.includeAnswers) ? '' : '-form'; // If not necessary don't include form to minimize transfer
    Candidate.find({'cid': req.customer._id}, fields, {
        exhaust: true,
        batchSize: 1000000
    }, function (err, candidateItems) {
        if (err) {
            return;
        }

        // extract all candidates personal data ids.
        let candidatesPersonalDataIds = [];
        for (let candidatesIndex = 0; candidatesIndex < candidateItems.length; candidatesIndex++) {
            if(candidateItems[candidatesIndex].personalDataId) { // safety
                candidatesPersonalDataIds.push(candidateItems[candidatesIndex].personalDataId);
            }
        }

        // find all candidates personal data by their personal data ids
        let candidatesWithPersonalData = [];
        // TODO: replace to lookup instead of two for loops
        trueVault_Ctrl.findAll(candidatesPersonalDataIds) // return an array of json obj with id & data
            .then(candidatesPersonalData => {
                // bind candidates to their personal data retrieved from vault
                for(let pdIndex = 0; pdIndex < candidatesPersonalData.length; pdIndex++) {
                    for (let cIndex = 0; cIndex < candidateItems.length; cIndex++) {
                        if(candidatesPersonalData[pdIndex]['id'] == candidateItems[cIndex]['personalDataId']) {
                            candidateItems[cIndex].personalData = candidatesPersonalData[pdIndex]['data'];
                            break;
                        }
                    }
                }

                // Render the candidates view in a callback because the retrieval from the DB is async
                const options = {
                    title: 'Manage Candidates',
                    advanced: (req.tableMode === 'advanced'),
                    answers: (req.tableMode === 'answers'),
                    customer: req.customer,
                    textDirection: textGenerator_Ctrl.getLangDir(req.customer.language),
                    textAlign: textGenerator_Ctrl.getLangAlign(req.customer.language),
                    candidates: candidateItems
                };
                res.render('candidates', options); // Clients management page
            })
            .catch(err => {
                console.log("%s.%s:%s -", __file, __ext, __line, "error while fetching candidates personal data: ", err);
                // try render page anyway
                const options = {
                    title: 'Manage Candidates',
                    advanced: (req.tableMode === 'advanced'),
                    answers: (req.tableMode === 'answers'),
                    customer: req.customer,
                    textDirection: textGenerator_Ctrl.getLangDir(req.customer.language),
                    textAlign: textGenerator_Ctrl.getLangAlign(req.customer.language),
                    candidates: candidateItems
                };
                res.render('candidates', options); // Clients management page
            })
    });
};


exports.candidatesSaveExp = function (req, res) {
    // Retrieve all candidates
    // batchSize = 1000000 - allows up to 1000000 documents in each batch in order to make the response much faster
    // exahust = true - doesn't wait for the client to process the results before proceeding to next batch
    console.log("%s.%s:%s -", __file, __ext, __line, "Retrieving candidates");
    Candidate.find({'cid': req.customer._id}, 'form appExp session', {
        exhaust: true,
        batchSize: 1000000
    }, function (err, candidateItems) {
        if (err) {
            console.log("%s.%s:%s -", __file, __ext, __line, "Error retrieving candidates: ", err);
            return;
        }
        console.log("%s.%s:%s -", __file, __ext, __line, "Reviewing candidates");

        for (i=0;i<candidateItems.length;i++) {
            const candidate = candidateItems[i];
            const formjson = candidate.form;
            if (typeof candidate.appExp === 'undefined') { // appExp hasn't been calculated for this candidate
                console.log("%s.%s:%s -", __file, __ext, __line, "appExp not calculated for candidate");
                for (let j = 0; j < formjson.length; j++) {
                    if (formjson[j] && formjson[j].hasOwnProperty('type')) { // safety
                        if (formjson[j].type === 'A') { //is this an app exp type question?
                            if (formjson[j].hasOwnProperty('finalAnswer')) { // safety
                                candidate.appExp = formjson[j].finalAnswer; //save the final answer
                                candidate.markModified('appExp');
                                candidate.save(function (err, entry) {
                                    if (err) {
                                        console.log("%s.%s:%s -", __file, __ext, __line, "error saving appExp! ", err);
                                        res.status(500).send("Error saving appExp (" + __file + ":" + __line + ") - " + err);
                                    }
                                    else {
                                        console.log("%s.%s:%s -", __file, __ext, __line, "Updated candidate: ", candidate.session.id);
                                    }
                                });
                            }
                            break;
                        }
                    }
                }
            }
        }
        console.log("%s.%s:%s -", __file, __ext, __line, "Done");
    });
};

