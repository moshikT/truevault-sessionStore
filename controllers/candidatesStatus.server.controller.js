// Candidates status controller
// Displays a list of all the candidates for a certain client with a few details on questionnaire status
// let express = require('express');   //Express
// let fs = require('fs');             //Node.js file I/O
// let path = require('path');          //Node.js file & directory
const textGenerator_Ctrl = require('../controllers/textGenerator.server.controller');

const ejsLint = require('ejs-lint');

let Candidate = require('../models/candidate.server.model.js');    //import candidate schema

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
        const lintErr = ejsLint('candidates', options); // Lint check the template
        if (lintErr) {
            console.log("%s.%s:%s -", __file, __ext, __line, "candidates.ejs error: ", lintErr);
            return;
        }
        res.render('candidates', options); // Clients management page
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

