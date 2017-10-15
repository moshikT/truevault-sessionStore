var express = require('express');
var dateTime = require('node-datetime');
var json2csv = require('json2csv');
var fs = require('fs');
var csv = require("csvtojson");
var formGenerator_Ctrl = require('../controllers/formGenerator.server.controller');
var Candidate = require('../models/candidate.server.model.js');
var Client = require('../models/addClient.server.model.js');

var isCandidate = true;

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

    var company = {};
    company.name = req.body['companyName'];
    company.language = req.body['language'];
    var companyLogo = {};
    companyLogo.data = req.body['logoImgData'];
    companyLogo.contentType = req.body['logoImgContentType'];
    company.companyLogo = companyLogo;
    company.logoStyle = req.body['logoStyle'];

    // TODO: test if user exists in db - if not else prompt error code
    // TODO: send SMS with varification code

    formGenerator_Ctrl.generateForm(res, newUser, company);
}

exports.saveFormResults = function (req, res) {
    /* Remove duplicates from the form before insert to db */
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

    var companyName = formResults['companyName'];
    delete formResults['companyName'];

    var logoStyle = formResults['logoStyle'];
    delete formResults['logoStyle'];


    var logoImg = {}
    logoImg.data = formResults['logoImgData'];
    delete formResults['logoImgData'];
    logoImg.contentData = formResults['logoImgContentType'];
    delete formResults['logoImgContentType'];

    var language = formResults['language'];
    delete formResults['language'];

    var entry = new Candidate({
        fullName: userFullName,
        id: userId,
        email: userEmail,
        phoneNumber: userPhoneNumber,
        company : companyName,
        formDuration: totalTime,
        formResults : formResults
    });
    entry.save();
    console.log("new candidate entry " + entry);

    res.render('thankYou', { title: 'Empiricalhire',
        isInEnglish: (language == 'en'),
        textDirection: (language == 'en') ? 'ltr' : 'rtl',
        company: companyName,
        companyLogo: logoImg,
        logoStyle: logoStyle
    });
};

exports.getIndex = function (req, res) {
    /* if req.query.id undefined initiate with coca cola id as default for now. */


    var companyId = req.query.id ? req.query.id : 'קסטרו';
    Client.findOne({name : companyId}, function(err, company) {
        if (err) throw err; /* load default params */
        console.log("loaded from db: ", company.name);
        var indexPageText = initPageText(company.name, company.isDemo, isCandidate, (company.language == 'en'));
        var companyLogo = {};
        companyLogo.data = company.logoImg.data;
        companyLogo.contentType = company.logoImg.contentType;

        /* Load page with the loaded company from client db */
        res.render('index', {
            title: '',
            isInEnglish: (company.language == 'en'),
            indexPageText : indexPageText,
            companyLogo: companyLogo,
            language: company.language,
            logoStyle: company.logoStyle,
            companyName: company.name,
            companyDescription: company.introText
        });
    });
}

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