// Candidates status controller
// Displays a list of all the candidates for a certain client with a few details on questionnaire status
// let express = require('express');   //Express
// let fs = require('fs');             //Node.js file I/O
// let path = require('path');          //Node.js file & directory

let Candidate = require('../models/candidate.server.model.js');    //import candidate schema
let candidates;

exports.candidatesStatus = function (req, res) {
    // Retrieve all candidates
    Candidate.find({ 'cid': req.client.cid }, 'fullName formCompleted dateCompleted form', {sort: {'dateCompleted': -1}}, function(err, candidateItems) {
        // Render the candidates view in a callback because the retrieval from the DB is async
        res.render('candidates', { title: 'Manage Clients', candidates: candidateItems}); // Clients management page
    });
};