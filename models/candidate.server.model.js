var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var candidateSchema = new Schema({
    fullName: String,
    id : String,//{type: Number, required: true},
    email: String,
    phoneNumber : String,
    company: String,
    formDurationInMinutes : Number,
    //formData: JSON,
    form : JSON,
    formCompleted: Boolean,
    session: JSON,
    linkToForm: String,
    report: JSON,
    //strengths: JSON,
    //weaknesses: JSON,
    gender: String,
    recruitmentSource: String,
    dateCompleted: String,
    linkToCV: String
});

module.exports = mongoose.model('Candidate', candidateSchema);
