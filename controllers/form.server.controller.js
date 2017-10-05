var express = require('express');
var dateTime = require('node-datetime');
var json2csv = require('json2csv');
var fs = require('fs');
var csv = require("csvtojson");
var formGenerator_Ctrl = require('../controllers/formGenerator.server.controller');
var Candidate = require('../models/candidate.server.model.js');
var Client = require('../models/addClient.server.model.js');

var isInEnglish = false;
var isDemo = false;
var companyForm = isDemo ? 'DEMO' : 'Beta';
var indexPageText = {
    textDirection : isInEnglish ? "ltr" : "rtl",
    personalInfoText : isInEnglish ? "Please fill your personal details" : "להתחלת השאלון נא מלא/י את הפרטים הבאים:",
    emailField : isInEnglish ? "Email" : "דואר אלקטרוני",
    phoneField : isInEnglish ? "Phone Number" : "מספר טלפון",
    idField : isInEnglish ? "ID" : "ת.ז.",
    nameField : isInEnglish ? "Full Name" : "שם מלא",
    submitBtn : isInEnglish ? "Start Questionnaire" : "להתחלת השאלון",
    next : isInEnglish ? "next" : "הבא"
}

var newLine= "\r\n";
class userData {
    constructor(fullName, id, email, phoneNumber) {
        this.fullName = fullName;
        this.id = id;
        this.email = email;
        this.phoneNumber = phoneNumber;
    }
}

exports.getInfo = function (req, res) {
    var newUser = new userData(req.body['user_fullName'], req.body['user_id'],
        req.body['user_email'], req.body['user_tel']);//= req.body;

    // TODO: test if user exists in db - if not else prompt error code
    // TODO: send SMS with varification code

    getForm(req, res, newUser);
}

function getForm(req, res, candidate) {
    (candidate.id) ? formGenerator_Ctrl.generateForm(req, res, candidate) : res.redirect('/');
}

exports.saveFormResults = function (req, res) {
    var formResults = req.body;
    delete formResults['submit_btn'];
    delete formResults['agree'];
    var userFullName = formResults['fullName'];
    delete formResults['fullName'];
    var userId = formResults['id'];
    delete formResults['id'];
    var userEmail = formResults['email'];
    delete formResults['email'];
    var userPhoneNumber = formResults['phoneNumber'];
    delete formResults['phoneNumber'];

    var totalTime = formResults['formDuration'];
    delete formResults['formDuration'];

    //var candidate = Candidate.find({ name: id }, callback);

    var entry = new Candidate({
        fullName: userFullName,
        id: userId,
        email: userEmail,
        phoneNumber: userPhoneNumber,
        company : companyForm,
        formDuration: totalTime,
        formResults : formResults
    });
    entry.save();
    console.log("new candidate entry " + entry);

    /*
    var fields = Object.keys(req.body);
    fields.pop(); // remove checkbox from array
    fields.pop(); // remove agree from array
    fields.push("candidate_ID");

    fs.stat(companyForm + '.csv', function (err, stat) {
        if (err == null) {

            var toCsv = json2csv({ data: formResults, fields: fields, hasCSVColumnTitle: false}) + newLine;
            fs.appendFile(companyForm + ".csv", toCsv, function (err) {
                if (err) throw err;
                console.log("Inserted new row to CocaCola csv file");
            });
        }
        else {
            var toCsv = json2csv({ data: formResults, fields: fields}) + newLine;
            fs.writeFile(companyForm + '.csv', toCsv, function(err) {
                if (err) throw err;
                var dt = dateTime.create();
                var formatted = dt.format('Y-m-d H:M:S');
                console.log('file saved at ' + formatted);
            });
        }
    });
*/
    res.redirect('/thankYou');
};

exports.getIndex = function (req, res) {
    res.render('index', {
        title: '',
        isInEnglish: isInEnglish,
        indexPageText : indexPageText
    });
}

exports.getThankYouPage = function (req, res) {
    res.render('thankYou', { title: 'Empiricalhire',
        isInEnglish: isInEnglish,
    textDirection: indexPageText.textDirection});
}

exports.getTest = function (req, res) {
    var clientData;
    Client.findById('59d4ba0519a0861387f42a64', function (err, doc) {
        if (err) return next(err);
        //res.contentType(doc.img.contentType);
        //res.send(doc.img.data);
        console.log(doc.logoImg);

        res.render('test', {
            title: 'Empiricalhire',
            imgData: doc.logoImg.data,
            imgContentType: doc.logoImg.contentType,
            style : 'height:100px;padding-top:20px;zoom:40%;'
        });
    });
//console.log(clientData);


}
