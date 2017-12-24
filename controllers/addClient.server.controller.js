const express = require('express');
const fs = require('fs');
const path = require('path');
const Client = require('../models/addClient.server.model.js');
//var Candidate = require('../models/candidate.server.model.js');
const generateLink = require('../controllers/linkGenerator.server.controller');

exports.getAddClientPage = function (req, res) {
    res.render('addClient', {title: 'Add New Client', customer: ''});
};

exports.addClient = function (req, res) {
    //console.log("%s.%s:%s -", __file, __ext, __line, "Request body: ", req.body);
    let companyName = req.body.name;

    // Search for this client in the db
    console.log(`${__file}.${__ext}:${__line} -`, `Searching for customer '${companyName}'; trimmed '${companyName.trim()}'`);
    Client.findOne({name: companyName.trim()}, function (err, client) { // callback
        if (err) { // Error checking the db - abort
            res.render('niceError', {
                title: 'Add Client',
                errorText: 'Add client failed!'
            });
            return;
        }

        let newClientEntry; // place to hold found client or new client  entry (if not found)
        if (client) { // found this client in db
            console.log(`${__file}.${__ext}:${__line} -`, `Found: ${client}`);
            newClientEntry = client;
        }
        else { // didn't find
            // prepare a new entry
            console.log(`${__file}.${__ext}:${__line} -`, `Not found`);
            newClientEntry = new Client({
                name: companyName.trim()
            });
        }
        if (req.body.isDemo) {
            newClientEntry.isDemo = (req.body.isDemo === 'on');
            delete req.body.isDemo;
        }

        // Go through all the elements in the request and set client's entry
        for (let element in req.body) {
            //console.log("%s.%s:%s -", __file, __ext, __line, "Saving property: ", element, " = ", req.body[element]);
            newClientEntry[element] = req.body[element];
        }


        if (req.file) {
            var logoImg = {};
            logoImg.fileName = req.file.originalname;
            logoImg.data = fs.readFileSync(req.file.path);
            logoImg.contentType = 'image/png';

            newClientEntry.markModified('logoImg');
            newClientEntry.logoImg = logoImg;
            console.log("%s.%s:%s -", __file, __ext, __line, "file exists!!", client.logoImg);
        }
        // Make sure the company name is trimmed - otherwise the search is different than the way we store data and the entries would be duplicated for each update
        newClientEntry.name = companyName.trim();
        // Save the entry
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
        res.render('addClient', {title: 'Update Client', customer: req.customer});
    }
    else { // Page was called with a POST of the client name
        const clientName = req.body.clientName ? req.body.clientName : '';

        const query = Client.findOne({name: clientName.trim()});
        query.exec(function (err, client) {
            if (client) {
                res.render('addClient', {title: 'Update Client', customer: client});
            }
            else {
                res.status(404).send("A client with that name could not be found");
            }
        });
    }
}