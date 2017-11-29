"use strict";
// addCandidate controller
// Allows adding a new candidate to a specific client
// let express = require('express');   //Express
// let fs = require('fs');             //Node.js file I/O
// let path = require('path');          //Node.js file & directory
const Candidate = require('../models/candidate.server.model.js');
const generateLink = require('../controllers/linkGenerator.server.controller');
const formGenerator_Ctrl = require('../controllers/formGenerator.server.controller');
const textGenerator_Ctrl = require('../controllers/textGenerator.server.controller');
const sms_Ctrl = require('../controllers/sms.server.controller');
const email_Ctrl = require('../controllers/email.server.controller');
const uuidv1 = require('uuid/v1');
let Mixpanel = require('mixpanel');
// initialize mixpanel client configured to communicate over https
const mixpanel = Mixpanel.init('c7c569d0adcc1f4cc5a52fbc9002a43e', {
    protocol: 'https'
});
/*
// Track event in mixpanel
mixpanel.track('Event Name', {
    distinct_id: session.id,
    cid: req.client._id
});
*/

// object storing all candidate data entered on this view
class userData {
    constructor(fullName,
                id,
                email,
                phoneNumber,
                company,
                gender,
                recruitmentSource,
                linkToCV,
                sendSMS,
                notifyNewCandidate,
                notifyNewCandidateReport) {
        this.fullName = fullName;
        this.id = id;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.company = company;
        this.gender = gender;
        this.recruitmentSource = recruitmentSource;
        this.linkToCV = linkToCV;
        this.sendSMS = sendSMS;
        this.notifyNewCandidate = notifyNewCandidate;
        this.notifyNewCandidateReport = notifyNewCandidateReport;
    }
}

// Called on GET request to addCandidate
// Initialize the language-dependent text and render the addCandidate page
exports.getAddCandidatePage = function (req, res) {
    const isEnglish = (req.client.language === 'en');
    const title = (isEnglish ? 'Add Candidate' : 'הוסף מועמד') + ' - ' + req.client.name;
    const subTitle = (isEnglish ? 'Add candidate for' : 'הוסף מועמד עבור ') + ' - ' + req.client.name;
    // Get the field names based on client language
    let fieldNames = textGenerator_Ctrl.initCandidateFieldNames(req.client.name, req.client.isDemo, isEnglish);
    res.render('addCandidate', {
        title: title,
        subTitle: subTitle,
        fieldNames: fieldNames,
        client: req.client
    });
};

// Called on POST request to addCandidate
// Add a new candidate to the DB and render the displayLink page which shows the new candidate's data
exports.addCandidate = function (req, res) {
    // Set client checkboxes values - because unchecked checkbox not exists in the Post request.
    let isSendSMS = (req.body['sendSMS'] === 'on');// ? true : false;
    let isNotifyNewCandidate = (req.body['notifyNewCandidate'] === 'on');// ? true : false;
    let isNotifyNewCandidateReport = (req.body['notifyNewCandidateReport'] === 'on');// ? true : false;

    const newUser = new userData(
        req.body['user_fullName'],
        req.body['user_id'],
        req.body['user_email'],
        req.body['user_tel'],
        req.client.name,
        req.body['gender'],
        req.body['recruitmentSource'],
        req.body['linkToCV'],
        isSendSMS,
        isNotifyNewCandidate,
        isNotifyNewCandidateReport
    );

    console.log("test if checked is equel to true = ", newUser);

    // FIXME: Removed search for candidate because we would like to create a new entry for the candidate in any case
    // If this is returned to active state then the behavior MUST change because currently it appears to the admin
    //  as if he's creating a new candidate even if one is already found but behind the scenes just the existing candidate
    //  entry is used and this is BAD (Amit)
    /*Candidate.findOne({id: req.body['user_id']}, function (err, candidate) {
        if (err) throw err;
        // load default params
        if (candidate) {
            console.log("%s.%s:%s -", __file, __ext, __line, "found candidate");
            res.render('displayLink', {
                title: '',
                candidate : candidate,
                //url: candidate.linkToForm,
                client: req.client
            });
        }
        else  {*/
    console.log("%s.%s:%s -", __file, __ext, __line, "Creating candidate for keyword:", req.client.keyword);
    const isInEnglish = (req.client.language === 'en');
    // Start by generating a questions form for the candidate
    // FIXME: generateForm, generateLink & (mongoose)save are all async calls that use callbacks, causing the following code
    //   to be a bit messy. We have to convert them to promises in order to make the following more readable
    formGenerator_Ctrl.generateForm(isInEnglish, req.client.keyword, function (form) {
        if ((form === undefined) || (!form)) { // if form wasn't generated
            res.render('niceError', {
                title: 'Add Candidate' + newUser.fullName,
                errorText: "Failed to generate form for: '" + newUser.fullName + "'"
            });

            return;
        }

        //initialize session data
        const sid = uuidv1();
        const session = {
            id: sid,
            expired: false
        };

        // construct a full URL for the recruiter report so that we'll be able to use it with a URL shortener
        const recruiterReportUrl = req.protocol + '://' + req.get('host') + '/clients/' + req.client._id + '/recruiterReport?sid=' + session.id;
        // Prepare the report JSON to store in the DB
        const report = {
            link: recruiterReportUrl,
            completed: false
        };

        console.log("%s.%s:%s -", __file, __ext, __line, recruiterReportUrl);

        // call URL shortener to create a short URL for the recruiter report
        //let shortUrlToReport = 'test';
        generateLinkProm(recruiterReportUrl)
            .then(shortUrlToReport => {
                newUser.linkToReport = shortUrlToReport;
                console.log("%s.%s:%s -", __file, __ext, __line, "shortUrlToReport: ", shortUrlToReport);

                // construct a full URL for the form so that we'll be able to use it with a URL shortener
                const formUrl = req.protocol + '://' + req.get('host') + '/clients/' + req.client._id + '/?sid=' + session.id;
                console.log("%s.%s:%s -", __file, __ext, __line, "formUrl: ", formUrl);
                console.log("%s.%s:%s -", __file, __ext, __line, "Form length:", form.length);

                // call URL shortener to create a short URL for the form
                // let shortUrlToForm = 'test';
                return generateLinkProm(formUrl);
            })
            .then(shortUrlToForm => {
                newUser.linkToForm = shortUrlToForm;
                console.log("%s.%s:%s -", __file, __ext, __line, "shortUrlToForm: ", shortUrlToForm);
                // Now create a new candidate object with all the data generated above
                const newCandidateEntry = new Candidate({
                    fullName: newUser.fullName,
                    id: newUser.id,
                    cid: req.client._id,
                    email: newUser.email,
                    phoneNumber: newUser.phoneNumber,
                    company: newUser.company,
                    formDurationInMinutes: 0,
                    form: form,
                    formCompleted: false,
                    session: session,
                    linkToForm: shortUrlToForm,
                    linkToReport: newUser.linkToReport,
                    gender: newUser.gender,
                    report: report,
                    recruitmentSource: newUser.recruitmentSource,
                    dateCompleted: '',
                    dateTimeCreated: new Date(),
                    linkToCV: newUser.linkToCV,
                    sendSMS: newUser.sendSMS,
                    notifyNewCandidate: newUser.notifyNewCandidate,
                    notifyNewCandidateReport: newUser.notifyNewCandidateReport
                });

                // Check if we need to send an SMS to candidate and prepare it if necessary
                let smsText;
                if (newUser.sendSMS) {
                    if (((!req.client.SMSTextA) || (req.client.SMSTextA === '')) &&
                        ((!req.client.SMSTextB) || (req.client.SMSTextB === ''))) {
                        const statusMsg = "SMS texts are empty. Please configure client '" + newUser.company + "' with correct text or clear checkbox.";
                        console.log("%s.%s:%s -", __file, __ext, __line, "Status msg: ", statusMsg);
                        res.render('niceError', {
                            title: 'Add Candidate' + newUser.fullName,
                            errorText: statusMsg
                        });
                        return;
                    }
                    else {
                        // Randomly choose between the two possible SMS texts
                        if (Math.random() >= 0.5) {
                            smsText = req.client.SMSTextA;
                            if ((!smsText) || (smsText === '')) {
                                // It's completely acceptable to provide only B version
                                smsText = req.client.SMSTextB;
                            }
                        }
                        else {
                            smsText = req.client.SMSTextB;
                            if ((!smsText) || (smsText === '')) {
                                // It's completely acceptable to provide only A version
                                smsText = req.client.SMSTextA;
                            }
                        }
                        // Save the SMS actually selected for the candidate, for future reference
                        newUser.smsUsed = smsText;
                        // Replace placeholders with candidate values
                        smsText = smsText
                            .replace('$candidateName', newUser.fullName)
                            .replace('$formLink', newUser.linkToForm);
                    }
                }

                console.log("req.client: ", req.client)
                const originatingNumber = req.client.smsOrigNum;
                // Save the new candidate in the DB
                newCandidateEntry.save(function (err) {
                        if (err) {
                            console.log("%s.%s:%s -", __file, __ext, __line, "Error: ", err);
                            console.log("%s.%s:%s -", __file, __ext, __line, err);
                            // Track candidate creation in mixpanel
                            mixpanel.track('Create Candidate', {
                                distinct_id: session ? session.id : 0,
                                cid: req.params.cid,
                                name: newUser ? newUser.fullName : 'N/A',
                                company: newUser ? newUser.company : 'N/A',
                                form_len: form ? form.length : 0,
                                link_to_form: shortUrlToForm,
                                link_to_report: newUser ? newUser.linkToReport : '',
                                error: err
                            });
                            res.render('niceError', {
                                title: 'Add Candidate' + newUser.fullName,
                                errorText: "Failed to save new candidate: '" + newUser.fullName + "'"
                            });
                            return;
                        }
                        //console.log("%s.%s:%s -", __file, __ext, __line, newCandidateEntry);

                        // If more than 5 questions and sms selected, Send SMS to the candidate.
                        if (form.length > 5) { // Form has more than 5 questions
                            if (smsText) { // There is a text message to send
                                console.log("%s.%s:%s -", __file, __ext, __line, "Sending SMS to candidate: ", smsText);
                                sms_Ctrl.send(newUser.phoneNumber, smsText, originatingNumber, function (isSent) {
                                    let statusMsg;
                                    if (isSent) {
                                        statusMsg = 'Candidate created and SMS message successfully sent: ' + newUser.fullName;
                                    }
                                    else {
                                        statusMsg = 'Candidate created but an error occurred while sending SMS: ' + newUser.fullName;
                                    }

                                    console.log("%s.%s:%s -", __file, __ext, __line, "Status msg: ", statusMsg);
                                    res.render('displayLink', {
                                        title: 'Add Candidate' + newUser.fullName,
                                        candidate: newUser,
                                        client: req.client,
                                        statusMsg: statusMsg
                                    });
                                    return;
                                });
                            }
                            else {
                                console.log("%s.%s:%s -", __file, __ext, __line, "Candidate created successfully: ", newUser.fullName);
                                res.render('displayLink', {
                                    title: 'Add Candidate' + newUser.fullName,
                                    candidate: newUser,
                                    client: req.client,
                                    statusMsg: 'Candidate created successfully:' + newUser.fullName
                                });
                                return;
                            }
                        }
                        else {
                            const statusMsg = 'Too few questions in form. Possible error: ';
                            console.log("%s.%s:%s -", __file, __ext, __line, "Status msg: ", statusMsg);
                            res.render('niceError', {
                                title: 'Add Candidate' + newUser.fullName,
                                errorText: statusMsg
                            });
                            return;
                        }

                        // Send new candidate email to notify the recruiter
                        if (newUser.notifyNewCandidate) {
                            console.log("%s.%s:%s -", __file, __ext, __line, "Notifying on new candidate: ", newUser.fullName);
                            const emailTxt = req.client.newCandidateEmailText.replace('$candidateName', newUser.fullName);
                            const emailSubject = req.client.newCandidateEmailSubject.replace('$candidateName', newUser.fullName);
                            email_Ctrl.send(req.client.emailFrom, req.client.emailFromPswd, req.client.emailTo,
                                emailSubject, emailTxt);
                        }
                    }
                );
            })
            .catch(error => {
                console.log("%s.%s:%s -", __file, __ext, __line, error)
                res.render('niceError', {
                    title: 'Add Candidate' + newUser.fullName,
                    errorText: "Failed to generate short URLs for: '" + newUser.fullName + "'"
                });
            });
//}
//}); //This belongs to the 'findOne' that was disabled above
    });
};




