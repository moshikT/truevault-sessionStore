var express = require('express');
var router = express.Router();
var form_Ctrl = require('../controllers/form.server.controller');
var mailParser_Ctrl = require('../controllers/mailParser.server.controller');
var addClient_Ctrl = require('../controllers/addClient.server.controller');
//var multer  = require('multer');
//var upload = multer({ dest: '../uploads/' });
var fs = require('fs');
//var questionRouter = require('./routes/questionRouter');

//router.use('/api', questionRouter);
//mailParser_Ctrl.onMailArrived();

/* GET home page. */
router.get('/', function(req, res) {
    return form_Ctrl.getIndex(req, res);
});

router.post('/', function (req, res) {
    return form_Ctrl.getInfo(req, res);
});

router.post('/form', function(req, res) {
    return form_Ctrl.saveFormResults(req, res);
});

router.get('/thankYou', function(req, res) {
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
