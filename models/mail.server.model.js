var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var mailSchema = new Schema({
    cid : String,
    mailBoxId : String,
    text : String,
    from : String,
    to : String,
    subject : String,
    date: String,
    uid : String,
    attachmentFileName : String,
    attachment : JSON,
    status : { completed: Boolean }
});

module.exports = mongoose.model('mail', mailSchema);