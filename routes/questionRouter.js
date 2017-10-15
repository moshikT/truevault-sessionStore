var express = require('express');
var router = express.Router();

router.get('/Questions', function (req, res) {
        var responseJson = { key: "val"};
        res.json(responseJson);
    });
    //.post()
module.exports = router;