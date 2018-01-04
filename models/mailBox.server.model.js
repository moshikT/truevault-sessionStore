var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var mailBoxSchema = new Schema({
    cid : String,
    uidnext : String,
    password : String,
    userName : String
});

module.exports = mongoose.model('MailBox', mailBoxSchema);