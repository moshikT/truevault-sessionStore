var express = require('express');
var dateTime = require('node-datetime');
var json2csv = require('json2csv');
var fs = require('fs');
var csv = require("csvtojson");
var formGenerator_Ctrl = require('../controllers/formGenerator.server.controller');
var Candidate = require('../models/candidate.server.model.js');
var Client = require('../models/addClient.server.model.js');
var uuid = require('uuid/v1');

var isCandidate = true;

var newLine= "\r\n";
class userData {
    constructor(fullName, id, email, phoneNumber, company) {
        this.fullName = fullName;
        this.id = id;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.company = company;
    }
}

exports.getInfo = function (req, res) {
    var newUser = new userData(req.body['user_fullName'], req.body['user_id'],
        req.body['user_email'], req.body['user_tel'], req.client.name);

    var isInEnglish = (req.client.language == 'en');
    var formPageText = initFormPageText(isInEnglish);

    // TODO: send SMS with varification code

    /* If user exists and session not expired load form - else generate new form */
    Candidate.findOne({id : req.body['user_id']}, function(err, candidate) {
        if (err) throw err; /* load default params */
        if(candidate) {
            res.redirect('/' + req.client._id + '/form/?sid=' + candidate.session.id);
        }
        else {
            formGenerator_Ctrl.generateForm(isInEnglish, function (form) {
                var sid = uuidv1();
                var session = {};
                session.id = sid;
                session.expired = false;

                var entry = new Candidate({
                    fullName: newUser.fullName,
                    id: newUser.id,
                    email: newUser.email,
                    phoneNumber: newUser.phoneNumber,
                    company : newUser.company,
                    formDurationInMinutes: 0,
                    form : form,
                    formCompleted: false,
                    session: session
                });
                entry.save(function (err) {
                    if(err) {
                        console.log(err);
                    }
                    res.redirect('/' + req.client._id + '/form/?sid=' + sid);
                });
            });
        }
    });
}

exports.saveFormResults = function (req, res) {
    console.log("sid: ", req.query.sid);
    Candidate.update({'session.id': req.query.sid},{
        'formCompleted' : true,
        'session.expired' : true
    }, function (err) {
        if (err) throw err;
        res.redirect('/' + req.client._id + '/thankYou');
    });
}

exports.getIndex = function (req, res) {
    // TODO: export to different module
    var indexPageText = initPageText(req.client.name, req.client.isDemo, isCandidate, (req.client.language == 'en'));
    res.render('index', {
        title: '',
        indexPageText : indexPageText,
        client: req.client
    });
}

exports.getForm = function (req, res) {
    if(!req.query.sid) {
        /* no session id; redirect to home page in order to get user data */
        res.redirect('/' + req.client._id + '/');
    }
    else {
        Candidate.findOne({'session.id': req.query.sid}, function (err, candidate) {
            if (err) throw err;
            if (candidate) {
                if(candidate.session.expired) {
                    res.redirect('/' + req.client._id + '/thankYou');
                }
                else {
                    var isInEnglish = (req.client.language == 'en');
                    var formPageText = initFormPageText(isInEnglish);

                    // TODO: update and delete unnecessary fields render.
                    res.render('form', {
                        title: '' ,
                        formjson: candidate.form,
                        isInEnglish: isInEnglish,
                        textDirection: isInEnglish ? 'ltr' : 'rtl',
                        terms : formPageText.terms,
                        submitText : formPageText.submitText,
                        sid: candidate.session.id,
                        client: req.client,
                        formDurationInMinutes: candidate.formDurationInMinutes
                    });
                }
            }
            else {
                res.status(500).send("No User found");
            }
        });
    }
}

exports.getThankYouPage = function (req, res) {
    res.render('thankYou', { title: 'Empiricalhire',
        isInEnglish: (req.client.language == 'en'),
        textDirection: (req.client.language == 'en') ? 'ltr' : 'rtl',
        client: req.client
    });
}
/* export this functions to different module */
function initPageText(companyName, isDemo, isCandidate, isInEnglish) {
    return indexPageText = {
        //company : '',
        textDirection : isInEnglish ? "ltr" : "rtl",
        personalInfoText : isInEnglish ? "Please fill your personal details" : "להתחלת השאלון נא מלא/י את הפרטים הבאים:",
        emailField : isInEnglish ? "Email" : "דואר אלקטרוני",
        phoneField : isInEnglish ? "Phone Number" : "מספר טלפון",
        idField : isInEnglish ? "ID" : "ת.ז.",
        nameField : isInEnglish ? "Full Name" : "שם מלא",
        submitBtn : isInEnglish ? "Start Questionnaire" : "להתחלת השאלון",
        next : isInEnglish ? "next" : "הבא",
        instructionText: isInEnglish ?
            (isDemo ? 'Demo Text in English' :
                (isCandidate) ? 'Candidate Text in English' : 'employee Text in English') :
            (isDemo ? 'לפניך שאלון לדוגמא/דמו למבחן מיון למועמדים לתפקיד נציגי שירות ו/או מכירה ב' + companyName + '.\n' +
                'יש להשיב על השאלון בכנות וברצינות ולמלא בסביבה נטולת הפרעות וברצף.\n' +
                'בתודה ובהערכה, צוות ההנהלה.' :
                (isCandidate ?
                    /* Hebrew text for candidates */
                    'לפניך שאלון שמילויו אורך כחצי שעה.\n' +
                    'השאלון הנו מבחן מיון למועמדים לתפקיד נציגי שירות ו/או מכירה ב' + companyName + '.\n' +
                    'יש להשיב בסביבה נטולת הפרעות וברצף.\n' +
                    'פרט לשאלות שכותרתן \'שאלות חשיבה\', אין תשובות נכונות או לא נכונות בשאלון, עלייך לבחור בתשובה המשקפת בצורה הטובה ביותר את עמדתך/התנהגותך. \n' +
                    'השאלון יודע לאבחן דפוסי תשובה כנים יותר ופחות ולכן מומלץ להשיב בכנות ובפתיחות.\n' +
                    'בשאלות החשיבה יש לסמן את התשובה הנכונה לדעתך, במידה ואינך בטוח/ה - יש לנחש.\n' +
                    'לא ניתן למלא את השאלון יותר מפעם אחת וכן לא ניתן להעבירו.\n' +
                    'חובה להשיב על כל השאלות בשאלון.\n' +
                    '\n' +
                    'אני מסכים לתנאי השימוש\n' +
                    'בהצלחה,\n' +
                    'צוות הגיוס' :
                    /* Hebrew text for employees */
                    'לפניך שאלון שמילויו אורך כחצי שעה.\n' +
                    'השאלון הנו מבחן מיון למועמדים לתפקיד נציגי שירות ו/או מכירה ב' + companyName + '.\n' +
                    'הסיבה שאת/ה מתבקש/ת להשיב על השאלון היא על מנת שנוכל להבין כיצד העובדים הקיימים משיבים על השאלון.\n' +
                    'השאיפה שלנו היא לגייס עוד עובדים טובים כמוך!\n' +
                    'מטרה נוספת היא לקבל משוב מקדים על חוויית מילוי השאלון.\n' +
                    'חשוב מאוד לציין שלא נעשה בשאלון שום שימוש לטובת הערכה אישית שלך וכי נתוני השאלון שלך מעובדים באופן מוצפן על ידי חברה חיצונית.\n' +
                    'סומכים עלייך שתירתם למטרה של יצירת סביבת עבודה מצוינת ותשיב על השאלון בכנות וברצינות.\n' +
                    'את השאלון יש למלא בסביבה נטולת הפרעות וברצף.\n' +
                    'פרט לשאלות שכותרתן שאלות חשיבה, אין תשובות נכונות או לא נכונות בשאלון, עלייך לבחור בתשובה המשקפת בצורה הטובה ביותר את עמדתך/התנהגותך. השאלון יודע לאבחן דפוסי תשובה כנים יותר ופחות ולכן מומלץ להשיב בכנות ובפתיחות.\n' +
                    'בשאלות החשיבה יש לסמן את התשובה הנכונה לדעתך, במידה ואינך בטוח/ה - יש לנחש.\n' +
                    'לא ניתן למלא את השאלון יותר מפעם אחת וכן לא ניתן להעבירו.\n' +
                    'חובה למלא את כל השאלות בשאלון.\n' +
                    'בתודה ובהערכה, צוות ההנהלה.'))
    }
}

function initFormPageText(isInEnglish) {
    var pageText = {};
    pageText.submitText = isInEnglish ? "Submit" : "להגשת המבחן לחץ כאן";
    pageText.terms = {
        title : isInEnglish ? "Please confirm our Terms of service" : "* בבקשה אשר את תנאי השימוש",
        prefix : isInEnglish ? "I confirm our" : "אני מאשר את",
        postfix : isInEnglish ? " Terms of service" : " תנאי השימוש"
    }
    return pageText;
}