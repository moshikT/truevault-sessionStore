var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var candidateSchema = new Schema({
    fullName: String,
    id : Number,//{type: Number, required: true},
    email: String,
    phoneNumber : Number,
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
    isMale: Boolean,
    recruitmentSource: String,
    dateCompleted: String
});

module.exports = mongoose.model('Candidate', candidateSchema);
