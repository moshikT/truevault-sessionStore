var express = require('express');
var fs = require('fs');
var path = require('path')
var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });
var Client = require('../models/addClient.server.model.js');

/*
var clientData = {
    name: String,
    //id : Number,//{type: Number, required: true},
    logo : String,
    logoStyle : Number,
    title : String,
    introText : String,
    language : String,
    isDemo: Boolean
}
*/
exports.getAddClientPage = function (req, res) {
    res.render('addClient', { title: '' });
}

exports.addClient = function (req, res) {
//console.log(req.files);

    //var imageData = fs.readFileSync(req.file.path);
    //console.log(imageData);
    //console.log(req.file.filename);
    //console.log(req.body);

    var logostyle = "style='height: 100px;padding-top:20px;'";

    var logoImg = {};
    logoImg.data = fs.readFileSync(req.file.path);
    logoImg.contentType = 'image/png';

    var newClientEntry = new Client({
        name: req.body.name,
        //id : Number,//{type: Number, required: true},
        logoImg : logoImg,
        logoStyle : logostyle,//req.body.logoStyle,
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