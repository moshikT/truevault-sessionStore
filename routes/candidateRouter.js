// Restful API for candidate updates
"use strict";
let express = require('express');
let router = express.Router();
let Candidate = require('../models/candidate.server.model.js');
const Mixpanel = require('mixpanel');
// initialize mixpanel client configured to communicate over https
const mixpanel = Mixpanel.init('c7c569d0adcc1f4cc5a52fbc9002a43e', {
    protocol: 'https'
});

// Use a middleware to retrieve the sid
router.use('/:sid/:field', function (req, res, next) {
    console.log("%s.%s:%s -", __file, __ext, __line, "Middleware");
    console.log("%s.%s:%s -", __file, __ext, __line, "Middleware. sid: ", req.params.sid);
    Candidate.findOne({'session.id': req.params.sid}, function (err, candidate) {
        console.log("%s.%s:%s -", __file, __ext, __line, "err: ", err, '; candidate: ', candidate.fullName);
        if (err)  { // Error
            // Return an error to the API caller
            res.status(500).send("Error (" + __file + ":" + __line + ") - " + err);
            return;
        }
        if (!candidate) { // No candidate was found
            // Return an error to the API caller
            res.status(500).send("Candidate not found (" + __file + ":" + __line + ")");
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
        /*if (['phoneNumber', 'department', 'team', 'cvScreenDate', 'cvScreenResult', 'phoneInterviewDate', 'phoneInterviewResult',
                'interviewDate', 'interviewResult', 'auditDate', 'auditResult', 'hrResult', 'refCallDate', 'refCallResult',
                'contractDate', 'reportRating', 'hired', 'workDate', 'processUpdate', 'startedWork', 'recruiterNotes', 'ehNotes'
            ].indexOf(field) >= 0) { // Valid field - update the record*/
        if ((typeof Candidate.schema.paths[field]) != 'undefined') { // Valid field - update the record
            // Mark the field as modified
            req.candidate.markModified(field);
            // Save the value in the field
            req.candidate[field] = req.body.value;

            // If this is the 'called' field - might need to send an event to mixPanel
            if (field == 'called') {
                if (req.body.value) {
                    mixpanel.track('Create Candidate', { // We reuse this event because MixPanel doesn't allow optional events
                        distinct_id: req.params.sid,
                        server_name: process.env.SERVER_NAME,
                        user_agent: req.headers['user-agent'],
                        from: req.headers['from'],
                        cid: req.params ? req.params.cid : 0,
                        called: true,
                    });
                }
            }

            // Save the modified candidate in the db
            req.candidate.save(function(err, entry){
                if(err) { // There was an error saving
                    res.status(500).send("Error while saving candidate (" + __file + ":" + __line + ") - " + err);
                }
                else { // Successfully saved
                    console.log("%s.%s:%s -", __file, __ext, __line, "Entry saved!");
                    res.status(200).end();
                }
            });
        }
        else { // Invalid field
            res.status(500).send("Field not in allowed list (" + __file + ":" + __line + ")");
            return;
        }
    });

module.exports = router;