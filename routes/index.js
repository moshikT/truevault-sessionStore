var express = require('express');
var router = express.Router();
var form_Ctrl = require('../controllers/form.server.controller');
var mailParser_Ctrl = require('../controllers/mailParser.server.controller');
var addClient_Ctrl = require('../controllers/addClient.server.controller');
var multer  = require('multer');
var upload = multer({ dest: '/tmp/uploads/' });
var fs = require('fs');
var Client = require('../models/addClient.server.model.js');

//router.use('/api', questionRouter);
//mailParser_Ctrl.onMailArrived();

/* Middleware in order to add company details (cid) to the form pages */
router.use(function (req, res, next) {
    var parts = req.path.split('/');
    console.log("Path: ", req.path);
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
    console.log("cid: ", cid);
    Client.findById(cid, function (err, client) {
        if (err) {
            next();
            return;
        };
        if(client) {
           /* console.log("client name: ", client.name);
            console.log("client id: ", client._id);
            console.log("client logo style: ", client.logoStyle);
            //console.log("client intro text ", client.introText);
            //console.log("client form language", client.language);
            //console.log("client link to form", client.link);
            console.log("client logo img data:  ", client.logoImg.data);
            console.log("client logo image content type", client.logoImg.contentType);
            //console.log("cid", cid[1]);

            //console.log("url param", req);
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
    return addClient_Ctrl.getAddCandidatePage(req, res);
});

router.post('/clients/:cid/addCandidate', function(req, res) {
    return addClient_Ctrl.addCandidate(req, res);
});

/* submit file object with form */
router.post('/addClient', upload.single('logo'), function(req, res) {
    return addClient_Ctrl.addClient(req, res);
});

router.get('/test', function (req, res) {
    return form_Ctrl.getTest(req, res);
});

module.exports = router;
