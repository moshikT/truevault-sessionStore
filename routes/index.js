var express = require('express');
var router = express.Router();
var form_Ctrl = require('../controllers/form.server.controller');
var mailParser_Ctrl = require('../controllers/mailParser.server.controller');
var addClient_Ctrl = require('../controllers/addClient.server.controller');
var addCandidate_Ctrl = require('../controllers/addCandidate.server.controller');
var recruiterReport_Ctrl = require('../controllers/recruiterReportGenerator.server.controller');
let mngClients_Ctrl = require('../controllers/clients.server.controller'); // Controller for clients management page
let candidatesStatus_Ctrl = require('../controllers/candidatesStatus.server.controller'); // Controller for candidates status management page
var multer  = require('multer');
var upload = multer({ dest: '/tmp/uploads/' });
var fs = require('fs');
var Client = require('../models/addClient.server.model.js');

//router.use('/api', questionRouter);
//mailParser_Ctrl.onMailArrived();

/* Middleware in order to add company details (cid) to the form pages */
router.use(function (req, res, next) {
    var parts = req.path.split('/');
    console.log("%s.%s:%s -", __file, __ext, __line, "Path: ", req.path);
    console.log("%s.%s:%s -", __file, __ext, __line, "Parts: ", parts);
    if ((parts[1]!="clients") ||
        (!parts[2])) {
        next();
        return;
    }
    var cid = parts[2];
    if (!cid) {
        next();
        return;
    }
    console.log("%s.%s:%s -", __file, __ext, __line, "cid: ", cid);
    Client.findById(cid, function (err, client) {
        if (err) {
            console.log("%s.%s:%s -", __file, __ext, __line, "Client not found: ", cid);
            next();
            return;
        };
        if(client) {
            console.log("%s.%s:%s -", __file, __ext, __line, "client found: ", client.name);
           /* console.log("%s.%s:%s -", __file, __ext, __line, "client name: ", client.name);
            console.log("%s.%s:%s -", __file, __ext, __line, "client id: ", client._id);
            console.log("%s.%s:%s -", __file, __ext, __line, "client logo style: ", client.logoStyle);
            //console.log("%s.%s:%s -", __file, __ext, __line, "client intro text ", client.introText);
            //console.log("%s.%s:%s -", __file, __ext, __line, "client form language", client.language);
            //console.log("%s.%s:%s -", __file, __ext, __line, "client link to form", client.link);
            console.log("%s.%s:%s -", __file, __ext, __line, "client logo img data:  ", client.logoImg.data);
            console.log("%s.%s:%s -", __file, __ext, __line, "client logo image content type", client.logoImg.contentType);
            //console.log("%s.%s:%s -", __file, __ext, __line, "cid", cid[1]);

            //console.log("%s.%s:%s -", __file, __ext, __line, "url param", req);
            /* Add the question found to the request and pass it to the next action - get or patch */
           if(req.query.sid) {
               req.sid = req.query.sid;
           }
            req.client = client;
            next();
        }
        else {
            res.status(404).send("No form type were found");
            // TODO: in the future add default form template
        }

    });
})

/* GET home page. */
router.get('/clients/:cid', function(req, res) {
    return form_Ctrl.getIndex(req, res);
});

router.post('/clients/:cid', function (req, res) {
    return form_Ctrl.getInfo(req, res);
});

router.post('/clients/:cid/form', function(req, res) {
    return form_Ctrl.saveFormResults(req, res);
});

router.get('/clients/:cid/form', function(req, res) {
    return form_Ctrl.getForm(req, res);
});

router.get('/clients/:cid/thankYou', function(req, res) {
    return form_Ctrl.getThankYouPage(req, res);
});

router.get('/addClient', function(req, res) {
    return addClient_Ctrl.getAddClientPage(req, res);
});

router.get('/clients/:cid/addCandidate', function(req, res) {
    return addCandidate_Ctrl.getAddCandidatePage(req, res);
});

router.post('/clients/:cid/addCandidate', function(req, res) {
    return addCandidate_Ctrl.addCandidate(req, res);
});

/* submit file object with form */
router.post('/addClient', upload.single('logo'), function(req, res) {
    return addClient_Ctrl.addClient(req, res);
});

router.get('/test', function (req, res) {
    return form_Ctrl.getTest(req, res);
});

// Candidates status
router.get('/clients/:cid/candidates', function(req, res) {
    return candidatesStatus_Ctrl.candidatesStatus(req, res);
});

// Clients management
router.get('/clients', function(req, res) {
    return mngClients_Ctrl.mngClients(req, res);
});

router.get('/clients/:cid/recruiterReport', function(req, res) {
    return recruiterReport_Ctrl.generateRecruiterReport(req, res);
});

router.post('/loadClient', function(req, res) {
    return addClient_Ctrl.loadClient(req,res);
});

router.get('/terms', function(req, res) {
    res.render('terms');
});

router.get('/privacy', function(req, res) {
    res.render('privacy');
});
module.exports = router;
