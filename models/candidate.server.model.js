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
    appExp: Number,
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
    linkToCV: String,
    phoneInterviewDate: String,
    phoneInterviewResult: String,
    interviewDate: String,
    interviewResult: String,
    reportRating: String,
    hired: String,
    hireDate: String,
    startedWork: String,
    workDate: String,
    sendSMS: Boolean,
    notifyNewCandidate: Boolean,
    notifyNewCandidateReport: Boolean
    notifyNewCandidateReport: Boolean,
    personalDataId: String,
    smsUsed: String,
    department: String,
    team: String,
    cvScreenDate: String,
    cvScreenResult: String,
    auditDate: String,
    auditResult: String,
    hrResult: String,
    refCallDate: String,
    refCallResult: String,
    contractDate: String,
    processUpdate: String,
    recruiterNotes: String,
    ehNotes: String,
    called: Boolean
});

// TODO: add middlware to check that personal data isnt save in db - if personal data exists abort and return an error.

module.exports = mongoose.model('Candidate', candidateSchema);
