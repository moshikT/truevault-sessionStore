var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var candidateSchema = new Schema({
    fullName: String,
    id : Number,//{type: Number, required: true},
    email: String,
    phoneNumber : Number,
    formDuration : String,
    formResults : JSON
});

module.exports = mongoose.model('Candidate', candidateSchema);
