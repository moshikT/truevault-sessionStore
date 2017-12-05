const express = require('express');
const dateTime = require('node-datetime');
const json2csv = require('json2csv');
const fs = require('fs');
const csv = require("csvtojson");
const formGenerator_Ctrl = require('../controllers/formGenerator.server.controller');
const textGenerator_Ctrl = require('../controllers/textGenerator.server.controller');
const Candidate = require('../models/candidate.server.model.js');
const Client = require('../models/addClient.server.model.js');
const uuidv1 = require('uuid/v1');
const recruiterReport_Ctrl = require('../controllers/recruiterReportGenerator.server.controller');
const email_Ctrl = require('../controllers/email.server.controller');
const Mixpanel = require('mixpanel');
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

var isCandidate = true;

var newLine = "\r\n";

class userData {
    constructor(fullName, id, email, phoneNumber, company) {
        this.fullName = fullName;
        this.id = id;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.company = company;
    }
}

// This is where we go to after user submits the intro pages "form", meaning clicks 'next'
exports.getInfo = function (req, res) {
    var newUser = new userData(req.body['user_fullName'], req.body['user_id'],
        req.body['user_email'], req.body['user_tel'], req.customer.name);

    // Find the candidate entry
    Candidate.findOne({'session.id': req.sid}, function (err, candidate) {
        if (err) { // There was an error - doesn't mean anything but we can't show the form without a candidate
            console.log("%s.%s:%s -", __file, __ext, __line, "Error searching for candidate: ", req.sid);
            res.redirect('/clients/' + req.customer._id + '/thankYou'); // FIXME: This should be an error page
        }
        if (candidate) { // Candidate was found - redirect him to the form
            res.redirect('/clients/' + req.customer._id + '/form/?sid=' + candidate.session.id);
        }
        else { // Candidate was not found - possibly malicious or old sid that has been deleted or just an error in url
            console.log("%s.%s:%s -", __file, __ext, __line, "Candidate wasn't found: ", req.sid);
            res.redirect('/clients/' + req.customer._id + '/thankYou'); // FIXME: This should be an error page
        }
    });
};

// This is where we go to after the user submits the questionnaire form
exports.saveFormResults = function (req, res) {
    console.log("%s.%s:%s -", __file, __ext, __line, "form details", req.body);
    var formData = req.body;
    delete formData['agree'];
    delete formData['submit_btn'];
    delete  formData['isCompleted'];
    Candidate.findOne({'session.id': req.query.sid}, function (err, candidate) {
        if (err) throw err;
        /* load default params */
        if (candidate) {
            candidate.markModified('form');
            candidate.markModified('formCompleted');
            candidate.markModified('session');

            var recruiterReportUrl = req.protocol + '://' + req.get('host') +
                '/clients/' + req.customer._id + '/recruiterReport?sid=' + req.query.sid;//+ req.originalUrl;
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
            for (var qIndex = 0; qIndex < candidate.form.length; qIndex++) {
                // If final answer does not exist update from form
                if (!candidate.form[qIndex].finalAnswer) {
                    candidate.form[qIndex].finalAnswer = formData[candidate.form[qIndex].id];
                    console.log("%s.%s:%s -", __file, __ext, __line, "updated final answer for " + candidate.form[qIndex].id + " to be ", formData[candidate.form[qIndex].id]);
                }
            }
            candidate.save(function (err, entry) {
                console.log("%s.%s:%s -", __file, __ext, __line, "req: ", req);
                if (err) {
                    console.log("%s.%s:%s -", __file, __ext, __line, "unable To save", err);
                    mixpanel.track('Form Submit Failed', {
                        distinct_id: req.query ? req.query.sid : 0,
                        server_name: process.env.SERVER_NAME,
                        user_agent: req.headers['user-agent'],
                        from: req.headers['from'],
                        cid: req.params ? req.params.cid : 0,
                        error: err
                    });
                }
                else {
                    mixpanel.track('Form Submit', {
                        distinct_id: req.query ? req.query.sid : 0,
                        server_name: process.env.SERVER_NAME,
                        user_agent: req.headers['user-agent'],
                        from: req.headers['from'],
                        cid: req.params ? req.params.cid : 0,
                    });
                    console.log("%s.%s:%s -", __file, __ext, __line, "Finished storing form submission");
                    console.log("%s.%s:%s -", __file, __ext, __line, "Calculating report data");
                    // Calculate the report data
                    recruiterReport_Ctrl.calcRecruiterReport(req, res); // we don't provide a callback because we don't have anything to do here if it didn't work. Will calc the report when needed instead.

                    //  if newUser.notifyNewCandidate == true send email to recruiter
                    if (candidate.notifyNewCandidateReport) {
                        const emailTxt = req.customer.candidateReportEmailText.replace('$candidateName', candidate.fullName)
                            .replace('$reportLink', candidate.linkToReport);
                        const emailSubject = req.customer.candidateReportEmailSubject.replace('$candidateName', candidate.fullName);
                        email_Ctrl.send(req.customer.emailFrom, req.customer.emailFromPswd, req.customer.emailTo,
                            emailSubject, emailTxt);
                    }
                }
            });

        }
        else {
            console.log("%s.%s:%s -", __file, __ext, __line, "Unable to save all form data");
        }
        res.redirect('/clients/' + req.customer._id + '/thankYou');
    });
};

// This displays the intro pages
exports.getIndex = function (req, res) {
    //indexText = textGenerator_Ctrl.initCandidateFieldNames(req.customer.name, req.customer.isDemo, (req.customer.language === 'en'));
    console.log("%s.%s:%s -", __file, __ext, __line, "Rendering client: ", req.customer.name);
    mixpanel.track('Index Entered', {
        distinct_id: req ? req.sid : 0,
        server_name: process.env.SERVER_NAME,
        user_agent: req.headers['user-agent'],
        from: req.headers['from'],
        cid: req.params ? req.params.cid : 0
    });
    textGenerator_Ctrl.initIndexPageText(req.lang, function (pageText) {
        res.render('index', {
            title: '',
            pageText: pageText,
            customer: req.customer,
            sid: req.sid
        });
    });
};

// This displays the questionnaire form itself
exports.getForm = function (req, res) {
    if (!req.query.sid) {
        /* no session id; redirect to home page in order to get user data */
        res.redirect('/clients/' + req.customer._id + '/');
    }
    else {
        Candidate.findOne({'session.id': req.query.sid}, function (err, candidate) {
            if (err) throw err;
            if (candidate) {
                if (candidate.session.expired) {
                    mixpanel.track('Form Expired', {
                        distinct_id: req.query.sid,
                        server_name: process.env.SERVER_NAME,
                        user_agent: req.headers['user-agent'],
                        from: req.headers['from'],
                        cid: req.params ? req.params.cid : 0
                    });
                    res.redirect('/clients/' + req.customer._id + '/thankYou');
                }
                else {
                    mixpanel.track('Form Entered', {
                        distinct_id: req.query.sid,
                        server_name: process.env.SERVER_NAME,
                        user_agent: req.headers['user-agent'],
                        from: req.headers['from'],
                        cid: req.params ? req.params.cid : 0
                    });
                    textGenerator_Ctrl.initFormPageText(req.lang, function (pageText) {
                        res.render('form', {
                            title: '',
                            formjson: candidate.form,
                            lang: pageText.lang,
                            textDirection: pageText.textDir,
                            textAlign: pageText.textAlign,
                            submitText: pageText.submitText,
                            sid: candidate.session.id,
                            customer: req.customer,
                            fullName: candidate.fullName
                        });
                    });
                    // TODO: update and delete unnecessary fields render.
                }
            }
            else {
                res.status(500).send("No User found");
            }
        });
    }
};

// Display the thank you page, either after the form is submitted or upon re-entry (when it was submitted before)
exports.getThankYouPage = function (req, res) {
    textGenerator_Ctrl.initThankYouText(req.lang, function (pageText) {
        res.render('thankYou', {
            title: 'Empirical Hire',
            textDirection: pageText.textDir,
            textAlign: pageText.textAlign,
            customer: req.customer
        });
    });
};

// Set Date Time object to the format of dd/mm/yyyy
function convertDate(date) {
    var yyyy = date.getFullYear().toString();
    var mm = (date.getMonth() + 1).toString();
    var dd = date.getDate().toString();

    var mmChars = mm.split('');
    var ddChars = dd.split('');

    return (ddChars[1] ? dd : "0" + ddChars[0]) + '/' + (mmChars[1] ? mm : "0" + mmChars[0]) + '/' + yyyy;
}
