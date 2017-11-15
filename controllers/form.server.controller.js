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
var recruiterReport_Ctrl = require('../controllers/recruiterReportGenerator.server.controller');

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

// get users data (currently setted via addCandidate) and generate form f user is new
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
                        console.log("%s.%s:%s -", __file, __ext, __line, err);
                    }
                    // TODO: send SMS with varification code
                    res.redirect('/clients/' + req.client._id + '/form/?sid=' + sid);
                });
            });
        }
    });
}

exports.saveFormResults = function (req, res) {
    console.log("%s.%s:%s -", __file, __ext, __line, "form details", req.body);
    var formData = req.body;
    delete formData['agree'];
    delete formData['submit_btn'];
    delete  formData['isCompleted'];
    Candidate.findOne({'session.id' : req.query.sid}, function(err, candidate) {
        if (err) throw err; /* load default params */
        if(candidate) {
            candidate.markModified('form');
            candidate.markModified('formCompleted');
            candidate.markModified('session');

            var recruiterReportUrl = req.protocol + '://' + req.get('host') +
                '/clients/' + req.client._id + '/recruiterReport?sid=' + req.query.sid;//+ req.originalUrl;
            var report = {};
            report.link = recruiterReportUrl;

            var dateCompleted = new Date();

            candidate.formCompleted = true;
            candidate.session.expired = true;
            candidate.dateCompleted = convertDate(dateCompleted);
            candidate.dateTimeCompleted = dateCompleted;
            //candidate.report.completed = true;
            candidate.report = report;

            // Iterate through the candidates form and update all failed patch request -
            // unAnswered question with the users' final answer.
            for(var qIndex = 0; qIndex < candidate.form.length; qIndex++) {
                /* If final answer does not exist update from form */
                if(!candidate.form[qIndex].finalAnswer) {
                    candidate.form[qIndex].finalAnswer = formData[candidate.form[qIndex].id];
                    console.log("%s.%s:%s -", __file, __ext, __line, "updated final answer for " + candidate.form[qIndex].id + " to be ", formData[candidate.form[qIndex].id]);
                }
            }
            candidate.save(function(err, entry){
                if(err) {
                    console.log("%s.%s:%s -", __file, __ext, __line, "unable To save", err);
                }
                else {
                    console.log("%s.%s:%s -", __file, __ext, __line, "Finished storing form submission");
                    console.log("%s.%s:%s -", __file, __ext, __line, "Calculating report data");
                    recruiterReport_Ctrl.calcRecruiterReport(req, res); // Calculate the report data
                }
            });

        }
        else {
            console.log("%s.%s:%s -", __file, __ext, __line, "Unable to save all form data");
        }
        res.redirect('/clients/' + req.client._id + '/thankYou');
    });
}

exports.getIndex = function (req, res) {
    //indexText = textGenerator_Ctrl.initCandidateFieldNames(req.client.name, req.client.isDemo, (req.client.language === 'en'));
    console.log("%s.%s:%s -", __file, __ext, __line, "Rendering client: ", req.client.name);
    res.render('index', {
        title: '',
        indexPageText : (req.client.language == 'en') ? {direction: 'ltr', align: 'left'} : {direction: 'rtl', align: 'right'} ,
        client: req.client,
        sid: req.sid
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
                            //terms : formText.terms,
                            submitText : formText.submitText,
                            sid: candidate.session.id,
                            client: req.client,
                            fullName: candidate.fullName
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

// Set Date Time object to the format of dd/mm/yyyy
function convertDate(date) {
    var yyyy = date.getFullYear().toString();
    var mm = (date.getMonth()+1).toString();
    var dd  = date.getDate().toString();

    var mmChars = mm.split('');
    var ddChars = dd.split('');

    return (ddChars[1]?dd:"0"+ddChars[0])  + '/' + (mmChars[1]?mm:"0"+mmChars[0]) + '/' + yyyy;
}
