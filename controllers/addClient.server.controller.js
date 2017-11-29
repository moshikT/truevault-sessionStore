const express = require('express');
const fs = require('fs');
const path = require('path');
const Client = require('../models/addClient.server.model.js');
//var Candidate = require('../models/candidate.server.model.js');
const generateLink = require('../controllers/linkGenerator.server.controller');

exports.getAddClientPage = function (req, res) {
    res.render('addClient', {title: 'Add New Client', client: ''});
};

exports.addClient = function (req, res) {
    //console.log("%s.%s:%s -", __file, __ext, __line, "Request body: ", req.body);
    let companyName = req.body.name;

    // Search for this client in the db
    Client.findOne({name: companyName.trim()}, function (err, client) { // callback
        if (err) { // Error checking the db - abort
            res.render('niceError', {
                title: 'Add Client',
                errorText: 'Add client failed!'
            });
            return;
        }

        let newClientEntry; // place to hold found client or new client entry (if not found)
        if (client) { // found this client in db
            newClientEntry = client;
        }
        else { // didn't find
            // prepare a new entry
            newClientEntry = new Client({
                name: companyName.trim()
            });
        }
        if (req.body.isDemo) {
            newClientEntry.isDemo = (req.body.isDemo === 'on');
            delete req.body.isDemo;
        }

        /** Go through all the elements in the request and set client's entry */
        for (let element in req.body) {
            newClientEntry[element] = req.body[element];
        }

        // Save all the fields that were entered in the form
        /*if (req.body.logoStyle) {
            newClientEntry.logoStyle = req.body.logoStyle;
        }
        if (req.body.title) {
            newClientEntry.title = req.body.title;
        }
        if (req.body.headlineText) {
            newClientEntry.headlineText = req.body.headlineText;
        }
        if (req.body.companyDescription) {
            newClientEntry.companyDescription = req.body.companyDescription;
        }
        if (req.body.instructionText) {
            newClientEntry.instructionText = req.body.instructionText;
        }
        if (req.body.language) {
            newClientEntry.language = req.body.language;
        }
                if (req.body.isDemo) {
                    newClientEntry.isDemo = (req.body.isDemo == 'on');
                }
        if (req.body.keyword) {
            newClientEntry.keyword = req.body.keyword;
        }
        if (req.body.SMSText) {
            newClientEntry.SMSText = req.body.SMSText;
        }
        if (req.body.emailTo) {
            newClientEntry.emailTo = req.body.emailTo;
        }
        if (req.body.emailFrom) {
            newClientEntry.emailFrom = req.body.emailFrom;
        }
        if (req.body.newCandidateEmailText) {
            newClientEntry.newCandidateEmailText = req.body.newCandidateEmailText;
        }
        if (req.body.candidateReportEmailText) {
            newClientEntry.candidateReportEmailText = req.body.candidateReportEmailText;
        }
        if (req.body.emailFromPswd) {
            newClientEntry.emailFromPswd = req.body.emailFromPswd;
        }*/
        if (req.file) {
            var logoImg = {};
            logoImg.fileName = req.file.originalname;
            logoImg.data = fs.readFileSync(req.file.path);
            logoImg.contentType = 'image/png';

            newClientEntry.markModified('logoImg');
            newClientEntry.logoImg = logoImg;
            console.log("%s.%s:%s -", __file, __ext, __line, "file exists!!", client.logoImg);
        }
        newClientEntry.save(function (err) {
            if (err) {
                console.log("%s.%s:%s -", __file, __ext, __line, err);
                res.render('niceError', {
                    title: 'Add Client',
                    errorText: 'Saving client failed!'
                });
                return;
            }
            else {
                console.log("%s.%s:%s -", __file, __ext, __line, "Saved client data");
                res.redirect('addClient');
            }
        });

    });


};


exports.loadClient = function (req, res) {
    if (req.customer) { // Page was called with a cid in URL
        res.render('addClient', {title: 'Update Client', client: req.customer});
    }
    else { // Page was called with a POST of the client name
        const clientName = req.body.clientName ? req.body.clientName : '';

        const query = Client.findOne({name: clientName.trim()});
        query.exec(function (err, client) {
            if (client) {
                res.render('addClient', {title: 'Update Client', client: client});
            }
            else {
                res.status(404).send("A client with that name could not be found");
            }
        });
    }
}