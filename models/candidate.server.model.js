var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var candidateSchema = new Schema({
    fullName: String,
    id : Number,//{type: Number, required: true},
    email: String,
    phoneNumber : Number,
    company: String,
    formDurationInMinutes : Number,
    form : JSON,
    formCompleted: Boolean,
    session: JSON,
    linkToForm: String
});

module.exports = mongoose.model('Candidate', candidateSchema);
