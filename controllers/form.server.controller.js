var express = require('express');
var dateTime = require('node-datetime');
var json2csv = require('json2csv');
var fs = require('fs');
var csv = require("csvtojson");
var formGenerator_Ctrl = require('../controllers/formGenerator.server.controller');
var textGenerator_Ctrl = require('../controllers/textGenerator.server.controller');
var Candidate = require('../models/candidate.server.model.js');
var Client = require('../models/addClient.server.model.js');
var uuidv1 = require('uuid/v1');

var isCandidate = true;

var newLine= "\r\n";
class userData {
    constructor(fullName, id, email, phoneNumber, company) {
        this.fullName = fullName;
        this.id = id;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.company = company;
    }
}

exports.getInfo = function (req, res) {
    var newUser = new userData(req.body['user_fullName'], req.body['user_id'],
        req.body['user_email'], req.body['user_tel'], req.client.name);

    /* If user exists and session not expired load form - else generate new form */
    Candidate.findOne({'session.id' : req.sid}, function(err, candidate) {
        if (err) throw err; /* load default params */
        if(candidate) {
            res.redirect('/clients/' + req.client._id + '/form/?sid=' + candidate.session.id);
        }
        else {
            var isInEnglish = (req.client.language == 'en');
            formGenerator_Ctrl.generateForm(isInEnglish, req.client.keyword , function (form) {
                var sid = uuidv1();
                var session = {};
                session.id = sid;
                session.expired = false;

                var entry = new Candidate({
                    fullName: newUser.fullName,
                    id: newUser.id,
                    email: newUser.email,
                    phoneNumber: newUser.phoneNumber,
                    company : newUser.company,
                    formDurationInMinutes: 0,
                    form : form,
                    formCompleted: false,
                    session: session
                });
                entry.save(function (err) {
                    if(err) {
                        console.log(err);
                    }
                    // TODO: send SMS with varification code
                    res.redirect('/clients/' + req.client._id + '/form/?sid=' + sid);
                });
            });
        }
    });
}

exports.saveFormResults = function (req, res) {
    console.log("form details", req.body);
    var formData = req.body;
    delete formData['agree'];
    delete formData['submit_btn'];
    Candidate.findOne({'session.id' : req.query.sid}, function(err, candidate) {
        if (err) throw err; /* load default params */
        if(candidate) {
            candidate.markModified('form');
            candidate.markModified('formCompleted');
            candidate.markModified('session');

            candidate.formCompleted = true;
            candidate.session.expired = true;
            //candidate.report =

            for(var qIndex = 0; qIndex < candidate.form.length; qIndex++) {
                /* If final answer does not exist update from form */
                if(!candidate.form[qIndex].finalAnswer) {
                    candidate.form[qIndex].finalAnswer = formData[candidate.form[qIndex].id];
                    console.log("updated final answer for " + candidate.form[qIndex].id + " to be ", formData[candidate.form[qIndex].id]);
                }
            }
            candidate.save(function(err, entry){
                if(err) {
                    console.log("unable To save", err);
                }
                else {
                    console.log("succeed update final answer");
                }
            });

        }
        else {
            console.log("Unable to save all form data");
        }
        res.redirect('/clients/' + req.client._id + '/thankYou');
    });
}

exports.getIndex = function (req, res) {
    // TODO: export to different module
    textGenerator_Ctrl.initIndexText(req.client.name, req.client.isDemo, isCandidate, (req.client.language == 'en'), function (indexText) {
        res.render('index', {
            title: '',
            indexPageText : indexText,
            client: req.client,
            sid: req.sid
        });
    });
}

exports.getForm = function (req, res) {
    if(!req.query.sid) {
        /* no session id; redirect to home page in order to get user data */
        res.redirect('/clients/' + req.client._id + '/');
    }
    else {
        Candidate.findOne({'session.id': req.query.sid}, function (err, candidate) {
            if (err) throw err;
            if (candidate) {
                if(candidate.session.expired) {
                    res.redirect('/clients/' + req.client._id + '/thankYou');
                }
                else {
                    var isInEnglish = (req.client.language == 'en');
                    textGenerator_Ctrl.initFormPageText(isInEnglish, function (formText) {
                        res.render('form', {
                            title: '' ,
                            formjson: candidate.form,
                            isInEnglish: isInEnglish,
                            textDirection: isInEnglish ? 'ltr' : 'rtl',
                            terms : formText.terms,
                            submitText : formText.submitText,
                            sid: candidate.session.id,
                            client: req.client
                        });
                    })
                    // TODO: update and delete unnecessary fields render.
                }
            }
            else {
                res.status(500).send("No User found");
            }
        });
    }
}

exports.getThankYouPage = function (req, res) {
    res.render('thankYou', { title: 'Empiricalhire',
        isInEnglish: (req.client.language == 'en'),
        textDirection: (req.client.language == 'en') ? 'ltr' : 'rtl',
        client: req.client
    });
}
