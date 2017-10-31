var express = require('express');
var Candidate = require('../models/candidate.server.model.js');
var generateLink = require('../controllers/linkGenerator.server.controller');
var formGenerator_Ctrl = require('../controllers/formGenerator.server.controller');
var uuidv1 = require('uuid/v1');

class userData {
    constructor(fullName, id, email, phoneNumber, company, gender, recruitmentSource) {
        this.fullName = fullName;
        this.id = id;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.company = company;
        this.gender = gender;
        this.recruitmentSource = recruitmentSource;
    }
}

exports.getAddCandidatePage = function (req, res) {
    var addCandidateText = {};
    addCandidateText.personalInfoText = "Please fill your personal details";
    addCandidateText.nameField = "Full Name";
    addCandidateText.phoneField = "Phone Number";
    addCandidateText.idField = "ID";
    addCandidateText.emailField = "Email";
    addCandidateText.recruitmentSourcelField = "Recruitment Source";
    //textGenerator_Ctrl.initIndexText(req.client.name, req.client.isDemo, isCandidate, (req.client.language == 'en'), function (indexText) {
    res.render('addCandidate', {
        title: '',
        indexPageText : addCandidateText,
        client: req.client
    });
}

exports.addCandidate = function (req, res) {
    var newUser = new userData(req.body['user_fullName'], req.body['user_id'],
        req.body['user_email'], req.body['user_tel'], req.client.name, req.body['gender'], req.body['recruitmentSource']);

    // Removed search for candidate because we would like to create a new entry for the candidate in any case
    // If this is returned to active state then the behavior MUST change because currently it appears to the admin
    //  as if he's creating a new candidate even if one is already found but behind the scenes just the existing candidate
    //  entry is used and this is BAD (Amit)
    /*Candidate.findOne({id: req.body['user_id']}, function (err, candidate) {
        if (err) throw err;
        // load default params
        if (candidate) {
            console.log("found candidate");
            res.render('displayLink', {
                title: '',
                candidate : candidate,
                //url: candidate.linkToForm,
                client: req.client
            });
        }
        else */ {
        console.log("Creating candidate for keyword:", req.client.keyword);
        var isInEnglish = (req.client.language == 'en');
        formGenerator_Ctrl.generateForm(isInEnglish, req.client.keyword, function (form) {
            var sid = uuidv1();
            var session = {};
            session.id = sid;
            session.expired = false;

            var recruiterReportUrl = req.protocol + '://' + req.get('host') + '/clients/' + req.client._id + '/recruiterReport?sid=' + session.id;//+ req.originalUrl;
            console.log(recruiterReportUrl);
            generateLink(recruiterReportUrl, function(shortendLinkToReport) {

                var report = {};
                report.link = recruiterReportUrl;
                report.completed = false;

                //var report = {};
                //report.completed = false;

                var url = req.protocol + '://' + req.get('host') + '/clients/' + req.client._id + '/?sid=' + session.id;//+ req.originalUrl;
                console.log("URL: ", url);
                console.log("Form length:", form.length);
                generateLink(url, function(shortendLink) {
                    var newCandidateEntry = new Candidate({
                        fullName: newUser.fullName,
                        id: newUser.id,
                        email: newUser.email,
                        phoneNumber: newUser.phoneNumber,
                        company: newUser.company,
                        formDurationInMinutes: 0,
                        form: form,
                        formCompleted: false,
                        session: session,
                        linkToForm: shortendLink,
                        gender: newUser.gender,
                        report: report,
                        recruitmentSource: newUser.recruitmentSource,
                        dateCompleted: ''
                    });

                    newCandidateEntry.save(function (err) {
                        if (err) {
                            console.log(err);
                        }
                        console.log(newCandidateEntry);
                        // TODO: send SMS with varification code
                        newUser.linkToForm = shortendLink;
                            newUser.linkToReport = shortendLinkToReport;
                            res.render('displayLink', {
                                title: '',
                                candidate: newUser,
                                client: req.client
                            });
                        });
                    });
            });
        });
    }
    //res.redirect('/addClient');
    //}); //This belongs to the 'findone' that was disabled above
}

