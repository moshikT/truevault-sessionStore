/*
Restful API for questions submissions
 */
"use strict";
var express = require('express');
var router = express.Router();
var Candidate = require('../models/candidate.server.model.js');
var Client = require('../models/addClient.server.model.js');
let Mixpanel = require('mixpanel');
// initialize mixpanel client configured to communicate over https
const mixpanel = Mixpanel.init('c7c569d0adcc1f4cc5a52fbc9002a43e', {
    protocol: 'https'
});
/*
// Track event in mixpanel
mixpanel.track('Event Name', {
    distinct_id: session.id,
    cid: req.customer._id
});
*/


/* get form by user */
router.use('/:sid', function (req, res, next) {
    console.log("%s.%s:%s -", __file, __ext, __line, "send patch request to sid: ", req.params.sid);
    Candidate.findOne({'session.id': req.params.sid}, function (err, candidate) {
        if (err) {
            res.status(500).send("Error while searching for sid (" + __file + ":" + __line + ") - " + err);
            return;
        }
        /* Add the question found to the request and pass it to the next action - get or patch */
        req.candidate = candidate;
        next();
    });
})
router.route('/:sid')
    .get(function (req, res, next) {
        res.json(req.candidate);
    })
    .patch(function (req, res, next) {
        req.candidate.markModified('form');
        console.log("%s.%s:%s -", __file, __ext, __line, "request body", req.body);

        for (var index = 0; index < req.candidate.form.length; index++) {
            if(req.candidate.form[index].type == 'S') {
                var setIDs = req.candidate.form[index].itemsID;
                var setData = {};
                setData.answersSets = [];
                var currentSet = [];
                setData.setReordered = req.body.movesCounter;
                console.log("%s.%s:%s -", __file, __ext, __line, "question set ", setIDs);
                for(var setIndex = 0; setIndex < setIDs.length; setIndex++) {
                    for (var reqIndex = 0; reqIndex < req.body.data.length; reqIndex++) {
                        if(req.body.data[reqIndex].id.trim() == setIDs[setIndex].trim()) {
                            currentSet.push(req.body.data[reqIndex]);
                        }
                    }
                }

                /** Update current set data */
                if(req.candidate.form[index].setAnswersData) {
                    var set = req.candidate.form[index].setAnswersData;
                    set.answersSets.push(currentSet);
                    set.setReordered += setData.setReordered;
                    req.candidate.form[index].setAnswersData = set;
                }
                else {
                    setData.answersSets.push(currentSet);
                    req.candidate.form[index].setAnswersData = setData;
                }
            }
            /*else {
                // TODO: add id field to each question sent and uncomment for all types of questions
                // TODO: update time duration as well
                /**if(req.candidate.form[index].id == req.body.qid) {
                    if(req.body._id) {
                        delete req.body._id;
                    }
                    for (var p in req.body) {
                        req.candidate.form[index][p] = req.body[p];
                    }
                    req.candidate.formDurationInMinutes = (req.candidate.formDurationInMinutes + req.candidate.form[index].timeAnsweredInSeconds / 60).toFixed(2);
                    req.candidate.save(function(err, entry){
                        if(err) {
                            res.status(500).send(err);
                        }
                        else {
                            console.log("%s.%s:%s -", __file, __ext, __line, "entry saved!");
                            res.json(entry);
                        }
                    });
                }
            }*/
        }
        /** Update f type questions exists in the request */
        for (var reqIDIndex = 0; reqIDIndex < req.body.data.length; reqIDIndex++) {
            for(var fIndex = 0; fIndex < req.candidate.form.length; fIndex++) {
                if (req.candidate.form[fIndex].type == 'F' &&
                    req.body.data[reqIDIndex].id.trim() == req.candidate.form[fIndex].id.trim()) {
                    req.candidate.form[fIndex].finalAnswer = req.body.data[reqIDIndex].answer;
                    console.log("%s.%s:%s -", __file, __ext, __line,
                        "updated F type question: ", req.candidate.form[fIndex]);
                }
            }
        }

        // TODO: for simple q: req.candidate.formDurationInMinutes = (req.candidate.formDurationInMinutes + req.candidate.form[index].timeAnsweredInSeconds / 60).toFixed(2);
        req.candidate.save(function(err, entry){
            if(err) {
                console.log("%s.%s:%s -", __file, __ext, __line, "error saving question data! ", err);
                res.status(500).send("Error saving question data (" + __file + ":" + __line + ") - " + err);
            }
            else {
                res.json(entry);
            }
        });
    });


/* Using a middleware, in order to pass question found by id, from the form */
router.use('/:sid/:qid', function (req, res, next) {
    //console.log("%s.%s:%s -", __file, __ext, __line, "api params: ", req.params);
    Candidate.findOne({'session.id': req.params.sid}, function (err, candidate) {
        if (err) {
            console.log("%s.%s:%s -", __file, __ext, __line, "Error retrieving session: ", err);
            res.status(500).send("Error retrieving session (" + __file + ":" + __line + ") - " + err);
            return;
        };
        /* Add the question found to the request and pass it to the next action - get or patch */
        req.candidate = candidate;
        next();
    });
})

router.route('/:sid/:qid')
    .get(function (req, res, next) {
        for (var index = 0; index < req.candidate.form.length; index++) {
            if(req.candidate.form[index].id == req.params.qid) {
                var question = req.candidate.form[index];
            }
        }
        if(question) {
            res.json(question);
        }
        else {
            res.status(404).send("Question not found");
        }
    })
    .patch(function (req, res, next) {
        req.candidate.markModified('form');
        console.log("%s.%s:%s -", __file, __ext, __line, "patch question: ", req.params.qid);
        for (let index = 0; index < req.candidate.form.length; index++) {
            if (req.candidate.form[index].id === req.params.qid) {
                console.log("%s.%s:%s -", __file, __ext, __line, "qid: ", req.params.qid);
                let appExpId = false;
                if (req.candidate.form[index].type === 'A') {
                    appExpId = true;
                }
                if(req.body._id) {
                    delete req.body._id;
                }
                // Loop through the fields in the request body (finalAnswer, AnswerSwitched etc.) and copy them to the relevant qid in the form
                for (let p in req.body) {
                    req.candidate.form[index][p] = req.body[p];
                }
                if (appExpId) { // This is an appExp question so need to store the appExp separately
                    console.log("%s.%s:%s -", __file, __ext, __line, "App experience - ", req.candidate.form[index].finalAnswer);
                    req.candidate.appExp = req.candidate.form[index].finalAnswer;
                }
                console.log("%s.%s:%s -", __file, __ext, __line, "formDurationInMinutes: ", req.candidate.formDurationInMinutes, "; timeAnsweredInSeconds", req.candidate.form[index].timeAnsweredInSeconds);
                req.candidate.formDurationInMinutes = (req.candidate.formDurationInMinutes + req.candidate.form[index].timeLastAnswered / 60).toFixed(2);
                const timeToAnswer = req.candidate.form[index].timeAnsweredInSeconds;
                const answer = req.candidate.form[index].finalAnswer;
                req.candidate.save(function(err, entry){
                    if(err) {
                        console.log("%s.%s:%s -", __file, __ext, __line, "Question answered error: ", err);
                        mixpanel.track('Question Answered Error', {
                            distinct_id: req.params.sid,
                            server_name: process.env.SERVER_NAME,
                            user_agent: req.headers['user-agent'],
                            from: req.headers['from'],
                            cid: req.candidate.cid,
                            qid: req.params.qid,
                            final_answer: answer,
                            time_to_answer: timeToAnswer,
                            error: err
                        });
                        res.status(500).send("Error while saving answer (" + __file + ":" + __line + ") - " + err);
                    }
                    else {
                        mixpanel.track('Question Answered', {
                            distinct_id: entry.session.id,
                            server_name: process.env.SERVER_NAME,
                            user_agent: req.headers['user-agent'],
                            from: req.headers['from'],
                            cid: req.candidate.cid,
                            qid: req.params.qid,
                            final_answer: answer,
                            time_to_answer: timeToAnswer,
                        });
                        console.log("%s.%s:%s -", __file, __ext, __line, "entry saved!");
                        res.json(entry);
                    }
                });
                break; // after qid found - stop searching for it...
            }
        }
    });

module.exports = router;