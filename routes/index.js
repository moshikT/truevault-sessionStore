var express = require('express');
var router = express.Router();
var form_Ctrl = require('../controllers/form.server.controller');
var mailParser_Ctrl = require('../controllers/mailParser.server.controller');
var addClient_Ctrl = require('../controllers/addClient.server.controller');
const addFile_Ctrl = require('../controllers/addFile.server.controller');
var addCandidate_Ctrl = require('../controllers/addCandidate.server.controller');
var recruiterReport_Ctrl = require('../controllers/recruiterReportGenerator.server.controller');
const mngClients_Ctrl = require('../controllers/clients.server.controller'); // Controller for clients management page
const candidatesStatus_Ctrl = require('../controllers/candidatesStatus.server.controller'); // Controller for candidates status management page
var multer = require('multer');
var upload = multer({dest: '/tmp/uploads/'});
var fs = require('fs');
var Client = require('../models/addClient.server.model.js');

//router.use('/api', questionRouter);
//mailParser_Ctrl.onMailArrived();

// Middleware in order to add company details (cid) to the form pages
router.use(function (req, res, next) {
    const parts = req.path.split('/');
    console.log("%s.%s:%s -", __file, __ext, __line, "Path: ", req.path);
    console.log("%s.%s:%s -", __file, __ext, __line, "Parts: ", parts);
    switch (parts[1]) {
        case 'clients':
            // It's either <domain>/clients - clients management page or
            // <domain>/clients/<cid> - internal clients pages
            if (!parts[2])  // There's no cid provided?
            {
                // Check if there's a language override in the request (?lang=)
                if (req.query.lang) {
                    req.lang = req.query.lang;
                }
                next(); // Just move on to the next handler
                return;
            }
            cid = parts[2];
            console.log("%s.%s:%s -", __file, __ext, __line, "cid: ", cid);
            Client.findById(cid, function (err, client) { // Search for this cid in the clients collection
                if (err) { // There was an error - doesn't mean the item wasn't found
                    console.log("%s.%s:%s -", __file, __ext, __line, "Error searching for cid: ", cid, ': ', err);
                    res.render('niceError', { // Display an error message
                        //FIXME - do something nicer here
                        title: 'Empirical Hire',
                        errorText: 'Unexpected error. Please try again'
                    });
                }
                else if (client) { // cid was found
                    console.log("%s.%s:%s -", __file, __ext, __line, "client found: ", client.name);
                    req.customer = client;
                    req.lang = client.language; // By default use the client language as the interface language

                    // Check if there's a session ID in the request (?sid=)
                    if (req.query.sid) {
                        req.sid = req.query.sid;
                    }
                    // Check if there's a language override in the request (?lang=)
                    if (req.query.lang) {
                        req.lang = req.query.lang;
                    }
                    next(); // pass to the next handler
                }
                else { // cid wasn't found
                    res.render('niceError', { // Display an error message
                        //FIXME - do something nicer here
                        title: 'Empirical Hire',
                        // We don't display a specific error in case this is an attack fishing for valid cids
                        errorText: 'Invalid request. Please try again'
                    });
                }
            });
            break;
        case 'html': // html pages - display a static html file found in db or /tmp
            addFile_Ctrl.getFile([parts[2] + '.html'])
                .then(filePath => {
                    res.sendFile(filePath);
                })
                .catch(error => { // html file not found
                    console.log("%s.%s:%s -", __file, __ext, __line, "Error: ", error);
                    res.render('niceError', { // Display an error message
                        //FIXME - do something nicer here
                        title: 'Empirical Hire',
                        // We don't display a specific error in case this is an attack fishing for valid cids
                        errorText: 'Resource not found. Please try again'
                    });
                });
            break;
        case 'api': // This is an api call or
            console.log("%s.%s:%s -", __file, __ext, __line, "API call");
        default: // default action
            // just pass to the next handler
            next();
    }
});

/* GET home page. */
router.get('/clients/:cid', function (req, res) {
    return form_Ctrl.getIndex(req, res);
});

router.post('/clients/:cid', function (req, res) {
    return form_Ctrl.getInfo(req, res);
});

router.post('/clients/:cid/form', function (req, res) {
    console.log("%s.%s:%s -", __file, __ext, __line, "Path: ", "Storing form submission");
    return form_Ctrl.saveFormResults(req, res); // Store the form answers
});

router.get('/clients/:cid/form', function (req, res) {
    return form_Ctrl.getForm(req, res);
});

router.get('/clients/:cid/thankYou', function (req, res) {
    return form_Ctrl.getThankYouPage(req, res);
});

// Get handler for addClient - renders the page
router.get('/addClient', function (req, res) {
    return addClient_Ctrl.getAddClientPage(req, res);
});

// Post handler for addClient - uploads the logo file and processes the form
router.post('/addClient', upload.single('logo'), function (req, res) {
    return addClient_Ctrl.addClient(req, res);
});

// Get handler for addFile - renders the page
router.get('/addFile', function (req, res) {
    return addFile_Ctrl.getAddFilePage(req, res);
});

// Post handler for addFile - uploads the file and processes the form
router.post('/addFile', upload.single('filedata'), function (req, res) {
    return addFile_Ctrl.addFile(req, res);
});

router.get('/clients/:cid/addCandidate', function (req, res) {
    return addCandidate_Ctrl.getAddCandidatePage(req, res);
});

router.post('/clients/:cid/addCandidate', function (req, res) {
    return addCandidate_Ctrl.addCandidate(req, res);
});

router.get('/test', function (req, res) {
    return form_Ctrl.getTest(req, res);
});

// Candidates status
router.get('/clients/:cid/candidates', function (req, res) {
    req.tableMode = 'regular';
    return candidatesStatus_Ctrl.candidatesStatus(req, res);
});

// Candidates status - advanced
router.get('/clients/:cid/candidatesAdv', function (req, res) {
    req.tableMode = 'advanced';
    return candidatesStatus_Ctrl.candidatesStatus(req, res);
});

// Candidates form answers
router.get('/clients/:cid/answers', function (req, res) {
    req.tableMode = 'answers';
    return candidatesStatus_Ctrl.candidatesStatus(req, res);
});

// Clients management
router.get('/clients', function (req, res) {
    return mngClients_Ctrl.mngClients(req, res);
});

router.get('/clients/:cid/recruiterReport', function (req, res) {
    return recruiterReport_Ctrl.generateRecruiterReport(req, res);
});

router.post('/loadClient', function (req, res) {
    return addClient_Ctrl.loadClient(req, res);
});

router.get('/clients/:cid/loadClient', function (req, res) {
    return addClient_Ctrl.loadClient(req, res);
});

router.get('/terms', function (req, res) {
    res.render('terms');
});

router.get('/privacy', function (req, res) {
    res.render('privacy');
});

router.get('/html/:textfile', function (req, res) {
    console.log("%s.%s:%s -", __file, __ext, __line, textfile);
    res.render(textfile);
});

module.exports = router;
