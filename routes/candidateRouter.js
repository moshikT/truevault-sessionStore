// Restful API for candidate updates
"use strict";
let express = require('express');
let router = express.Router();
let Candidate = require('../models/candidate.server.model.js');

// Use a middleware to retrieve the sid
router.use('/:sid/:field', function (req, res, next) {
    console.log("%s.%s:%s -", __file, __ext, __line, "Middleware");
    console.log("%s.%s:%s -", __file, __ext, __line, "Middleware. sid: ", req.params.sid);
    Candidate.findOne({'session.id': req.params.sid}, function (err, candidate) {
        console.log("%s.%s:%s -", __file, __ext, __line, "err: ", err, '; candidate: ', candidate.fullName);
        if ((err) || // There was an error or
            (!candidate)) { // No candidate was found
            // Return an error to the API caller
            res.status(500).send(err);
            return;
        }
        // Pass the candidate to the request
        req.candidate = candidate;
        next();
    });
});

// Handler for requests
router.route('/:sid/:field')
    .get(function (req, res, next) { // Get request
        // Currently not in use
        res.status(404).send("Not supported");
        return;
    })
    .patch(function (req, res, next) { // Patch request
        const field = req.params.field;
        console.log("%s.%s:%s -", __file, __ext, __line, "Patch: sid - ", req.params.sid, '; field - ', field, '; data - ', req.body);
        // Verify that the field is one of the supported fields
        if (['phoneInterviewDate', 'phoneInterviewResult', 'interviewDate', 'interviewResult', 'reportRating',
                'hired', 'hireDate', 'startedWork', 'workDate'].indexOf(field) >= 0) { // Valid field - update the record
            // Mark the field as modified
            req.candidate.markModified(field);
            // Save the value in the field
            req.candidate[field] = req.body.value;

            // Save the modified candidate in the db
            req.candidate.save(function(err, entry){
                if(err) { // There was an error saving
                    res.status(500).send(err);
                }
                else { // Successfully saved
                    console.log("%s.%s:%s -", __file, __ext, __line, "Entry saved!");
                    res.json(entry);
                }
            });
        }
        else { // Invalid field
            res.status(500).send("Invalid field");
            return;
        }
    });

module.exports = router;