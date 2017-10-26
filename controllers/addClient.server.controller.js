var express = require('express');
var fs = require('fs');
var path = require('path')
var multer  = require('multer');
var upload = multer({ dest: '/tmp/uploads/' });
var Client = require('../models/addClient.server.model.js');
var Candidate = require('../models/candidate.server.model.js');
var generateLink = require('../controllers/linkGenerator.server.controller');
var formGenerator_Ctrl = require('../controllers/formGenerator.server.controller');
var uuidv1 = require('uuid/v1');

class userData {
    constructor(fullName, id, email, phoneNumber, company) {
        this.fullName = fullName;
        this.id = id;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.company = company;
    }
}

exports.getAddClientPage = function (req, res) {
    res.render('addClient', { title: '' });
}

exports.addClient = function (req, res) {
    var logoImg = {};
    logoImg.data = fs.readFileSync(req.file.path);
    logoImg.contentType = 'image/png';

    var companyName = req.body.name;

    var url = req.protocol + '://' + req.get('host') + '/clients/' + req.client._id;//+ req.originalUrl;
    console.log(url);

    generateLink(url, function(shortendLink) {
       // console.log("generate Link " , shortendLink);
        var newClientEntry = {
            name: req.body.name,
            logoImg : logoImg,
            logoStyle : req.body.logoStyle,
            title : req.body.title,
            introText : req.body.introText,
            instructionText: req.body.instructionText,
            language : req.body.language,
            isDemo : (req.body.isDemo == 'on'),
            link: shortendLink,
            keyword: req.body.questionsKeyword
        }

        Client.findOneAndUpdate(
            {name: req.body.name}, // find a document with that filter
            newClientEntry, // document to insert when nothing was found
            {upsert: true, new: true, runValidators: true}, // options
            function (err, doc) { // callback
                if (err) {
                     throw err;
                } else {
                    doc = newClientEntry;// handle document
                    console.log("update doc: ", doc);
                }
            }
        );
    });
    res.redirect('/addClient');
}

exports.getAddCandidatePage = function (req, res) {
    var addCandidateText = {};
    addCandidateText.personalInfoText = "Please fill your personal details";
    addCandidateText.nameField = "Full Name";
    addCandidateText.phoneField = "Phone Number";
    addCandidateText.idField = "ID";
    addCandidateText.emailField = "Email";
    //textGenerator_Ctrl.initIndexText(req.client.name, req.client.isDemo, isCandidate, (req.client.language == 'en'), function (indexText) {
        res.render('addCandidate', {
            title: '',
            indexPageText : addCandidateText,
            client: req.client
        });
    //});
    //res.render('addClient', { title: '' });
}

exports.addCandidate = function (req, res) {
    var newUser = new userData(req.body['user_fullName'], req.body['user_id'],
        req.body['user_email'], req.body['user_tel'], req.client.name);

    Candidate.findOne({id: req.body['user_id']}, function (err, candidate) {
        if (err) throw err;
        /* load default params */
        if (candidate) {
            console.log("found candidate");
            res.render('displayLink', {
                title: '',
                candidate : candidate,
                //url: candidate.linkToForm,
                client: req.client
            });
        }
        else {
            var isInEnglish = (req.client.language == 'en');
            formGenerator_Ctrl.generateForm(isInEnglish, req.client.keyword, function (form) {
                var sid = uuidv1();
                var session = {};
                session.id = sid;
                session.expired = false;
                var url = req.protocol + '://' + req.get('host') + '/clients/' + req.client._id + '/?sid=' + session.id;//+ req.originalUrl;
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
                        linkToForm: shortendLink
                    });

                    newCandidateEntry.save(function (err) {
                        if (err) {
                            console.log(err);
                        }
                        // TODO: send SMS with varification code
                        newUser.linkToForm = shortendLink;
                        res.render('displayLink', {
                            title: '',
                            candidate : newUser,
                            client: req.client
                        });
                    });
                });
            });
        }
        //res.redirect('/addClient');
    });
}

