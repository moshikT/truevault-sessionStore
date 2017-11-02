var express = require('express');
var fs = require('fs');
var path = require('path')
var multer  = require('multer');
var upload = multer({ dest: '/tmp/uploads/' });
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
    res.render('addClient', { title: 'Add New Client', client: ''});
}

exports.addClient = function (req, res) {
    var logoImg = {};
    if(req.file) {
        logoImg.fileName = req.file.originalname;
        logoImg.data = fs.readFileSync(req.file.path);
        logoImg.contentType = 'image/png';
    }

    var companyName = req.body.name;

    var url = req.protocol + '://' + req.get('host') + '/clients/' + req.client._id;//+ req.originalUrl;
    console.log(url);

    generateLink(url, function(shortendLink) {
       // console.log("generate Link " , shortendLink);
        var newClientEntry = new Client ({
            name: companyName.trim(),
            logoImg : logoImg,
            logoStyle : req.body.logoStyle,
            title : req.body.title,
            headlineText: req.body.headlineText,
            companyDescription : req.body.companyDescription,
            instructionText: req.body.instructionText,
            thankYouText: req.body.thankYouText,
            language : req.body.language,
            isDemo : (req.body.isDemo == 'on'),
            link: shortendLink,
            keyword: req.body.questionsKeyword,
        });

        Client.findOne({name: companyName.trim()}, function (err, client) { // callback
                if (err) {
                    throw err;
                }
                if (client) {
                    for(var field in req.body ) {
                        console.log(field);
                        /* Update only unempty fields */
                         if(newClientEntry[field] != '') {
                             client[field] = newClientEntry[field];// handle document
                         }
                    }
                    if(req.file) {
                        client.markModified('logoImg');
                        client.logoImg = newClientEntry['logoImg'];
                        console.log("file exists!!", client.logoImg);
                    }
                    client.save(function (err) {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            console.log("update new client! ");
                        }
                    });
                }
                else {
                     newClientEntry.save(function (err) {
                         if (err) {
                             console.log(err);
                         }
                         else {
                             console.log("save new client! ");
                         }
                     });
                 }
         });
     });
    res.redirect('/addClient');
}

exports.loadClient = function(req, res) {
    var clientName = req.body.clientName;
    //var filterbyClientName = "\"" + clientName + "\""

    //var query = Client.find({$text: {$search: filterbyClientName}});
    var query = Client.findOne({name: clientName.trim()});
    query.exec(function(err, client) {
        console.log("filter results: ",  client);
        if(client) {
            res.render('addClient', {title: 'Update Client', client: client});
        }
        else {
            res.status(404).send("A client with that name could not be found");
        }
    });
}