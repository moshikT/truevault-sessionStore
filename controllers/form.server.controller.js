var express = require('express');
var dateTime = require('node-datetime');
var json2csv = require('json2csv');
var fs = require('fs');
var csv = require("csvtojson");
var formGenerator_Ctrl = require('../controllers/formGenerator.server.controller');
var Candidate = require('../models/candidate.server.model.js');
var Client = require('../models/addClient.server.model.js');
var Guid = require('Guid');

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
        req.body['user_email'], req.body['user_tel'], req.client.name);//= req.body;

/*    var companyLogo = {};
    companyLogo.data = req.body['logoImgData'];
    companyLogo.contentType = req.body['logoImgContentType'];
    //company.companyLogo = companyLogo;

  */  var isInEnglish = (req.client.language == 'en');
    var formPageText = initFormPageText(isInEnglish);

    /*
    var company = {};
    company.name = req.body['companyName'];
    company.language = req.body['language'];
    var companyLogo = {};
    companyLogo.data = req.body['logoImgData'];
    companyLogo.contentType = req.body['logoImgContentType'];
    company.companyLogo = companyLogo;
    company.logoStyle = req.body['logoStyle'];
*/
    // TODO: test if user exists in db - if not generate form, else check if form completed if true prompt error code,
    // TODO: else load form.
    /*Candidate.findOne({name : companyId}, function(err, candidate) {
        if (err) throw err; /* load default params */
       // console.log("loaded from db: ", candidate.fullName);

        /* Load page with the loaded company from client db */
        /*
        res.render('index', {
            title: '',
            isInEnglish: (company.language == 'en'),
            indexPageText : indexPageText,
            companyLogo: companyLogo,
            language: company.language,
            logoStyle: company.logoStyle,
            companyName: company.name,
            companyDescription: company.introText
        });*/

    //});
    // TODO: send SMS with varification code



    formGenerator_Ctrl.generateForm(isInEnglish, function (form) {
        var guid = Guid.create();

        var entry = new Candidate({
            fullName: newUser.fullName,
            id: newUser.id,
            email: newUser.email,
            phoneNumber: newUser.phoneNumber,
            company : newUser.company,
            formDuration: '0 minutes',
            form : form,
            formCompleted: false,
            sessionID: guid.value
        });
        entry.save(function (err) {
            if(err) {
                console.log(err);
            }
        });

        /* REDIRECT to '/form?sid=guid.value' */
        res.redirect('/' + req.client._id + '/form/?sid=' + guid.value);
        /* TODO: Temporary commented
        req.params.sid = guid.value;

        res.render('form', { title: '' ,
            companyLogo: companyLogo,
            companyName: req.body['companyName'],
            logoStyle: req.body['logoStyle'],
            language: req.body['language'],
            formjson: form,
            isInEnglish: isInEnglish,
            textDirection: isInEnglish ? 'ltr' : 'rtl',
            terms : formPageText.terms,
            submitText : formPageText.submitText,
            candidateData: newUser,
            sid: guid.value
        });*/
    });
}

exports.saveFormResults = function (req, res) {
    //Candidate.markModified('formCompleted');
    //Candidate.markModified('formDuration');
console.log("sid val: ", req.query.sid);
    var formResults = req.body;
    var totalTime = formResults['formDuration'];
// TODO: add date completed
    Candidate.update({sessionID: req.query.sid}, {
            formCompleted : true,
            formDuration : totalTime// handle document
    }, function(err, numberAffected, rawResponse) {
        if(err) throw err;
        console.log("Duration and Completed updated!!", numberAffected);
        console.log("response ", rawResponse);
        res.redirect('/' + req.client._id + '/thankYou');
    });


};

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
        //res.redirect('' + req.client._id + '/');
        console.log("no sid");
    }
    /*
    *  else if(req.query.sid.isExpired)
    *  {
    *       // user already fill the form
    *       //res.redirect('' + req.client._id + '/thankYou');
    *  }
    * */
    else {
        /* Load form */
        Candidate.findOne({sessionID: req.query.sid}, function (err, candidate) {
            if (err) throw err;
            if (candidate) {
                /*if (req.query.f == 0) {
                    res.json(candidate.form/* change to form *///)
                /*}
                else {
                    res.json(candidate);
                }*/
                var isInEnglish = (req.client.language == 'en');
                var formPageText = initFormPageText(isInEnglish);

                res.render('form', {
                    title: '' ,
                    formjson: candidate.form,
                    isInEnglish: isInEnglish,
                    textDirection: isInEnglish ? 'ltr' : 'rtl',
                    terms : formPageText.terms,
                    submitText : formPageText.submitText,
                    sid: candidate.sessionID,
                    client: req.client
                });
            }
            else {
                res.status(500).send("No User found");
            }
        });
                      }
                      /* TODO: check if req.params.sid !exist generateForm and load form
                         TODO: else if req.params.sid exist and session !expired load form from db and update view with question answered
                         TODO: else (sid exist and session expires) redirect to thank you page

                         Think to use middleware and REAST api for getting the form
                       */
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