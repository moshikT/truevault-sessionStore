var express = require('express');
var dateTime = require('node-datetime');
var json2csv = require('json2csv');
var fs = require('fs');
var csv = require("csvtojson");
var formGenerator_Ctrl = require('../controllers/formGenerator.server.controller');
var isInEnglish = false;
var textDirection = isInEnglish ? "lfr" : "rtl";

var newLine= "\r\n";

exports.getForm = function (req, res) {
    formGenerator_Ctrl.generateForm(req, res);
}

exports.exportToCsv = function (req, res) {
//var employee_ID = [{'employee_ID': "0547456081"}];
    var formResults = req.body;
    var fields = Object.keys(req.body);
    req.body.employee_ID = "0547546083";

    console.log(req.body);
    fields.pop(); // remove checkbox from array
    fields.pop(); // remove chweckbox from array
    fields.push("employee_ID");
    //console.log("User " + "PUT PHONE NUMBER HERE" + " " + formResults);
    fs.stat('Nike.csv', function (err, stat) {
        if (err == null) {

            var toCsv = json2csv({ data: formResults, fields: fields, hasCSVColumnTitle: false}) + newLine;
            fs.appendFile("Nike.csv", toCsv, function (err) {
                if (err) throw err;
                console.log("Inserted new row to Nike csv file");
            });
        }
        else {
            var toCsv = json2csv({ data: formResults, fields: fields}) + newLine;
            fs.writeFile('Nike.csv', toCsv, function(err) {
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
    res.render('index', { title: '',
        isInEnglish: textDirection });
}

exports.getThankYouPage = function (req, res) {
    res.render('thankYou', { title: 'Empiricalhire',
        isInEnglish: textDirection });
}
