var express = require('express');
var router = express.Router();
var Candidate = require('../models/candidate.server.model.js');
var Client = require('../models/addClient.server.model.js');


/* get form by user */
/*router.route('/:uid')
    .get(function (req, res, next) {
        Candidate.findOne({id: req.params.uid}, function (err, candidate) {
            if (err) throw err;
            if (candidate) {
                if (req.query.f == 0) {
                    res.json(candidate.form/* change to form *///)
  /*              }
                else {
                    res.json(candidate);
                }
            }
            else {
                res.status(500).send("No User found");
            }

        });
    })
    .post(function (req, res, next) {
        res.json(req.body);
    });
*/
/* Using a middleware, in order to pass question found by id, from the form */
router.use('/:sid/:qid', function (req, res, next) {
    console.log("api params: ", req.params);
    Candidate.findOne({'session.id': req.params.sid}, function (err, candidate) {
        if (err) {
            res.status(500).send(err)
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
        for (var index = 0; index < req.candidate.form.length; index++) {
            if(req.candidate.form[index].id == req.params.qid) {
                if(req.body._id) {
                    delete req.body._id;
                }
                for (var p in req.body) {
                    req.candidate.form[index][p] = req.body[p];
                }
                req.candidate.formDurationInMinutes = (req.candidate.formDurationInMinutes + req.candidate.form[index].timeAnsweredInSeconds / 60).toFixed(2);
                req.candidate.save(function(err, entry){
                    if(err) {
                        res.send(500).send(err);
                    }
                    else {
                        console.log("entry saved!");
                        res.json(entry);
                    }
                });
            }
        }
    });

module.exports = router;