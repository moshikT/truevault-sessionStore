var express = require('express');
var dateTime = require('node-datetime');
var json2csv = require('json2csv');
var fs = require('fs');
var csv = require("csvtojson");
var formGenerator_Ctrl = require('../controllers/formGenerator.server.controller');

var isInEnglish = false;
var isDemo = false;
var companyForm = isDemo ? 'DEMO' : 'AYALON';
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
var userData;


exports.getInfo = function (req, res) {
    userData = req.body;
    delete userData['submit_btn'];
    //userData.pop();
    console.log(userData);
    // TODO: test if user exists in db - if not else prompt error code
    // TODO: send SMS with varification code
    //formGenerator_Ctrl.generateForm(req,res);
    res.render('index', { title: '',
                        isInEnglish: isInEnglish,
                        indexPageText : indexPageText
                        });
}

exports.getForm = function (req, res) {
    formGenerator_Ctrl.generateForm(req, res);
}

exports.exportToCsv = function (req, res) {
    var formResults = req.body;
    delete formResults['submit_btn'];
    delete formResults['agree'];
    formResults['candidate_ID'] = 'demo';// FOR DEMO  userData['user_id'];



    // FOR DEMO userData['FormTotalTime'] = formResults['FormTotalTime'];
    delete formResults['FormTotalTime'];

    //console.log(formResults);
    // FOR DEMO userData['formResults'] = formResults;

    //console.log(userDataArr);
    // FOR DEMO console.log(userData);

    var fields = Object.keys(req.body);
    fields.pop(); // remove checkbox from array
    fields.pop(); // remove agree from array
    fields.push("candidate_ID");

    //console.log(fields);

    //console.log("User " + "PUT PHONE NUMBER HERE" + " " + formResults);
    fs.stat(companyForm + '.csv', function (err, stat) {
        if (err == null) {

            var toCsv = json2csv({ data: formResults, fields: fields, hasCSVColumnTitle: false}) + newLine;
            fs.appendFile(companyForm + ".csv", toCsv, function (err) {
                if (err) throw err;
                console.log("Inserted new row to Nike csv file");
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

function setLanguage() {

}
