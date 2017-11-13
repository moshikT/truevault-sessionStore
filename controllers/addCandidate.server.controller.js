// addCandidate controller
// Allows adding a new candidate to a specific client
// let express = require('express');   //Express
// let fs = require('fs');             //Node.js file I/O
// let path = require('path');          //Node.js file & directory
let Candidate = require('../models/candidate.server.model.js');
let generateLink = require('../controllers/linkGenerator.server.controller');
let formGenerator_Ctrl = require('../controllers/formGenerator.server.controller');
let textGenerator_Ctrl = require('../controllers/textGenerator.server.controller');
let uuidv1 = require('uuid/v1');

// object storing all candidate data entered on this view
class userData {
    constructor(fullName, id, email, phoneNumber, company, gender, recruitmentSource, linkToCV) {
        this.fullName = fullName;
        this.id = id;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.company = company;
        this.gender = gender;
        this.recruitmentSource = recruitmentSource;
        this.linkToCV = linkToCV;
    }
}

// Called on GET request to addCandidate
// Initialize the language-dependent text and render the addCandidate page
exports.getAddCandidatePage = function (req, res) {
    const isEnglish = (req.client.language === 'en');
    const title = (isEnglish ? 'Add Candidate' : 'הוסף מועמד') + ' - ' + req.client.name;
    const subTitle = (isEnglish ? 'Add candidate for' : 'הוסף מועמד עבור ') + ' - ' + req.client.name;
    // Get the field names based on client language
    fieldNames = textGenerator_Ctrl.initCandidateFieldNames(req.client.name, req.client.isDemo, isEnglish);
    res.render('addCandidate', {
        title: title,
        subTitle: subTitle,
        fieldNames: fieldNames,
        client: req.client
    });
};

// Called on POST request to addCandidate
// Add a new candidate to the DB and render the displayLink page which shows the new candidate's data
exports.addCandidate = function (req, res) {
    const newUser = new userData(req.body['user_fullName'], req.body['user_id'],
        req.body['user_email'], req.body['user_tel'], req.client.name, req.body['gender'],
        req.body['recruitmentSource'], req.body['linkToCV']);

    // FIXME: Removed search for candidate because we would like to create a new entry for the candidate in any case
    // If this is returned to active state then the behavior MUST change because currently it appears to the admin
    //  as if he's creating a new candidate even if one is already found but behind the scenes just the existing candidate
    //  entry is used and this is BAD (Amit)
    /*Candidate.findOne({id: req.body['user_id']}, function (err, candidate) {
        if (err) throw err;
        // load default params
        if (candidate) {
            console.log("%s.%s:%s -", __file, __ext, __line, "found candidate");
            res.render('displayLink', {
                title: '',
                candidate : candidate,
                //url: candidate.linkToForm,
                client: req.client
            });
        }
        else  {*/
    console.log("%s.%s:%s -", __file, __ext, __line, "Creating candidate for keyword:", req.client.keyword);
    const isInEnglish = (req.client.language === 'en');
    // Start by generating a questions form for the candidate
    // FIXME: generateForm, generateLink & (mongoose)save are all async calls that use callbacks, causing the following code
    //   to be a bit messy. We have to convert them to promises in order the make the following more readable
    formGenerator_Ctrl.generateForm(isInEnglish, req.client.keyword, function (form) {
        //initialize session data
        const sid = uuidv1();
        const session = {
            id: sid,
            expired: false
        };

        // construct a full URL for the recruiter report so that we'll be able to use it with a URL shortener
        const recruiterReportUrl = req.protocol + '://' + req.get('host') + '/clients/' + req.client._id + '/recruiterReport?sid=' + session.id;
        // Prepare the report JSON to store in the DB
        const report = {
            link: recruiterReportUrl,
            completed: false
        };

        console.log("%s.%s:%s -", __file, __ext, __line, recruiterReportUrl);

        // call URL shortener to create a short URL for the recruiter report
        //let shortUrlToReport = 'test';
        generateLinkProm(recruiterReportUrl)
            .then(shortUrlToReport => {
                newUser.linkToReport = shortUrlToReport;
                console.log("%s.%s:%s -", __file, __ext, __line, "shortUrlToReport: ", shortUrlToReport);

                // construct a full URL for the form so that we'll be able to use it with a URL shortener
                const formUrl = req.protocol + '://' + req.get('host') + '/clients/' + req.client._id + '/?sid=' + session.id;
                console.log("%s.%s:%s -", __file, __ext, __line, "formUrl: ", formUrl);
                console.log("%s.%s:%s -", __file, __ext, __line, "Form length:", form.length);

                // call URL shortener to create a short URL for the form
                // let shortUrlToForm = 'test';
                return generateLinkProm(formUrl);
            })
            .then(shortUrlToForm => {
                newUser.linkToForm = shortUrlToForm;
                console.log("%s.%s:%s -", __file, __ext, __line, "shortUrlToForm: ", shortUrlToForm);
                // Now create a new candidate object with all the data generated above
                const newCandidateEntry = new Candidate({
                    fullName: newUser.fullName,
                    id: newUser.id,
                    cid: req.client._id,
                    email: newUser.email,
                    phoneNumber: newUser.phoneNumber,
                    company: newUser.company,
                    formDurationInMinutes: 0,
                    form: form,
                    formCompleted: false,
                    session: session,
                    linkToForm: shortUrlToForm,
                    gender: newUser.gender,
                    report: report,
                    recruitmentSource: newUser.recruitmentSource,
                    dateCompleted: '',
                    dateTimeCreated: new Date(),
                    linkToCV: newUser.linkToCV
                });

                // Save the new candidate in the DB
                newCandidateEntry.save(function (err) {
                    if (err) {
                        // FIXME: Do more than just log the error to the console
                        console.log("%s.%s:%s -", __file, __ext, __line, err);
                    }
                    //console.log("%s.%s:%s -", __file, __ext, __line, newCandidateEntry);

                    // TODO: Trigger the next step in the process, such as sending an SMS or notifying the ATS etc.

                    res.render('displayLink', {
                        title: '',
                        candidate: newUser,
                        client: req.client
                    });
                });
            })
            .catch(error => console.log("%s.%s:%s -", __file, __ext, __line, error));
    });
    //}
    //}); //This belongs to the 'findOne' that was disabled above
}

