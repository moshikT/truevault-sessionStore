// Candidates status controller
// Displays a list of all the candidates for a certain client with a few details on questionnaire status
// let express = require('express');   //Express
// let fs = require('fs');             //Node.js file I/O
// let path = require('path');          //Node.js file & directory

const ejsLint = require('ejs-lint');

let Candidate = require('../models/candidate.server.model.js');    //import candidate schema

exports.candidatesStatus = function (req, res) {
    // Retrieve all candidates
    // batchSize = 1000000 - allows up to 1000000 documents in each batch in order to make the response much faster
    // exahust = true - doesn't wait for the client to process the results before proceeding to next batch
    const fields = (req.includeAnswers) ? '' : '-form'; // If not necessary don't include form to minimize transfer
    Candidate.find({ 'cid': req.customer._id }, fields, {exhaust: true, batchSize: 1000000}, function(err, candidateItems) {
        if (err) {
            return;
        }

        // Render the candidates view in a callback because the retrieval from the DB is async
        const options = { title: 'Manage Candidates', advanced: (req.tableMode === 'advanced'), answers: (req.tableMode === 'answers'), candidates: candidateItems};
        const lintErr = ejsLint('candidates', options); // Lint check the template
        if (lintErr) {
            console.log("%s.%s:%s -", __file, __ext, __line, "candidates.ejs error: ", lintErr);
            return;
        }
        res.render('candidates', options); // Clients management page
    });
};