var express = require('express');
var fs = require('fs');
var path = require('path')
var Client = require('../models/addClient.server.model.js');
//var Candidate = require('../models/candidate.server.model.js');
var generateLink = require('../controllers/linkGenerator.server.controller');

/*
class userData {
    constructor(fullName, id, email, phoneNumber, company) {
        this.fullName = fullName;
        this.id = id;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.company = company;
    }
}
*/
exports.getAddClientPage = function (req, res) {
    res.render('addClient', {title: 'Add New Client', client: ''});
}

exports.addClient = function (req, res) {
    var logoImg = {};
    if (req.file) {
        logoImg.fileName = req.file.originalname;
        logoImg.data = fs.readFileSync(req.file.path);
        logoImg.contentType = 'image/png';
    }

    //console.log("%s.%s:%s -", __file, __ext, __line, "Request body: ", req.body);
    var companyName = req.body.name;

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

        // Save all the fields that were entered in the form
        if (req.body.logoStyle) {
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
        if (req.body.questionsKeyword) {
            newClientEntry.keyword = req.body.questionsKeyword;
        }
        if (req.file) {
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
    var clientName = req.body.clientName;
    //var filterbyClientName = "\"" + clientName + "\""

    //var query = Client.find({$text: {$search: filterbyClientName}});
    var query = Client.findOne({name: clientName.trim()});
    query.exec(function (err, client) {
        // console.log("%s.%s:%s -", __file, __ext, __line, "filter results: ", client);
        if (client) {
            res.render('addClient', {title: 'Update Client', client: client});
        }
        else {
            res.status(404).send("A client with that name could not be found");
        }
    });
}