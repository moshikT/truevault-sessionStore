var express = require('express');
var fs = require('fs');
var path = require('path')
var multer  = require('multer');
var upload = multer({ dest: '/tmp/uploads/' });
var Client = require('../models/addClient.server.model.js');

exports.getAddClientPage = function (req, res) {
    res.render('addClient', { title: '' });
}

exports.addClient = function (req, res) {
    var logoImg = {};
    logoImg.data = fs.readFileSync(req.file.path);
    logoImg.contentType = 'image/png';

    var newClientEntry = new Client({
        name: req.body.name,
        logoImg : logoImg,
        logoStyle : req.body.logoStyle,
        title : req.body.title,
        introText : req.body.introText,
        language : req.body.language,
        isDemo : (req.body.isDemo == 'on')
    });
    newClientEntry.save(function (err, a) {
        if (err) throw err;
        console.log("new client entry " + newClientEntry);
    });

    res.redirect('/addClient');
}