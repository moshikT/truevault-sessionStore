var express = require('express');
var fs = require('fs');
var path = require('path')
var multer  = require('multer');
var upload = multer({ dest: '/tmp/uploads/' });
var Client = require('../models/addClient.server.model.js');
var generateLink = require('../controllers/linkGenerator.server.controller');

exports.getAddClientPage = function (req, res) {
    res.render('addClient', { title: '' });
}

exports.addClient = function (req, res) {
    var logoImg = {};
    logoImg.data = fs.readFileSync(req.file.path);
    logoImg.contentType = 'image/png';

    var companyName = req.body.name;

    var url = req.protocol + '://' + req.get('host') + '/?id=' + req.body.name;//+ req.originalUrl;
    console.log(url);

    generateLink(url, function(shortendLink) {
       // console.log("generate Link " , shortendLink);
        var newClientEntry = {
            name: req.body.name,
            logoImg : logoImg,
            logoStyle : req.body.logoStyle,
            title : req.body.title,
            introText : req.body.introText,
            language : req.body.language,
            isDemo : (req.body.isDemo == 'on'),
            link: shortendLink
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
                    console.log("unpdate doc: ", doc);
                }
            }
        );
    });
    res.redirect('/addClient');
}

