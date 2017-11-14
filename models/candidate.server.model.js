var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var candidateSchema = new Schema({
    fullName: String,
    id : String,//{type: Number, required: true},
    cid: String,
    email: String,
    phoneNumber : String,
    company: String,
    formDurationInMinutes : Number,
    //formData: JSON,
    form : JSON,
    formCompleted: Boolean,
    session: JSON,
    linkToForm: String,
    linkToReport: String,
    report: JSON,
    gender: String,
    recruitmentSource: String,
    dateCompleted: String,
    dateTimeCreated: Date,
    dateTimeCompleted: Date,
    linkToCV: String
});

module.exports = mongoose.model('Candidate', candidateSchema);
