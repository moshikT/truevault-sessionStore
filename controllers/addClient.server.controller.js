var express = require('express');
var fs = require('fs');
var path = require('path')
var multer  = require('multer');
var upload = multer({ dest: '/tmp/uploads/' });
var Client = require('../models/addClient.server.model.js');
//var Candidate = require('../models/candidate.server.model.js');
var generateLink = require('../controllers/linkGenerator.server.controller');
//var formGenerator_Ctrl = require('../controllers/formGenerator.server.controller');
//var uuidv1 = require('uuid/v1');

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
                    for(var field in re.body) {
                        /* Update only unempty fields */
                        if(field !== '') {
                            doc[field] = newClientEntry[field];// handle document
                        }
                    }
                    console.log("update doc: ", doc);
                }
            }
        );
    });
    res.redirect('/addClient');
}