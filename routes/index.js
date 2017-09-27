var express = require('express');
var router = express.Router();
var form_Ctrl = require('../controllers/form.server.controller');
var mailParser_Ctrl = require('../controllers/mailParser.server.controller');


//mailParser_Ctrl.onMailArrived();
//const json = formGenerator_Ctrl.generateForm();
//while(json == undefined) {}
//console.log("Inside form " + json);


/* GET home page. */
router.get('/', function(req, res) {
    return form_Ctrl.getIndex(req, res);
});

router.get('/form', function(req, res) {
    return form_Ctrl.getForm(req, res);
});

router.post('/', function (req, res) {
    return form_Ctrl.getInfo(req, res);
});

router.post('/form', function(req, res) {
    return form_Ctrl.exportToCsv(req, res);
});

router.get('/thankYou', function(req, res) {
    return form_Ctrl.getThankYouPage(req, res);
});

module.exports = router;
