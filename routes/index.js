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
    var cid = parts[1].toNumber;
    if (isNaN(cid)) {
        next();
    }
    else Client.findById(parts[1], function (err, client) {
        if (err) {
            res.status(500).send(err)
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
router.get('/:cid', function(req, res) {
    return form_Ctrl.getIndex(req, res);
});

router.post('/:cid', function (req, res) {
    return form_Ctrl.getInfo(req, res);
});

router.post('/:cid/form', function(req, res) {
    return form_Ctrl.saveFormResults(req, res);
});

router.get('/:cid/form', function(req, res) {
    return form_Ctrl.getForm(req, res);
});

router.get('/:cid/thankYou', function(req, res) {
    return form_Ctrl.getThankYouPage(req, res);
});

router.get('/addClient', function(req, res) {
    return addClient_Ctrl.getAddClientPage(req, res);
});

/* submit file object with form */
router.post('/addClient', upload.single('logo'), function(req, res) {
    return addClient_Ctrl.addClient(req, res);
});

router.get('/test', function (req, res) {
    return form_Ctrl.getTest(req, res);
});

module.exports = router;
