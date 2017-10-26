var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var clientSchema = new Schema({
    name: {type: String, required: true},
    //id : Number,//{type: Number, required: true},
    logoImg: { data: Buffer, contentType: String },
    logoStyle : String,
    title : String,
    introText : String,
    instructionText: String,
    language : String,
    isDemo : Boolean,
    /* userType: String //candidate, employee */
    link : String,
    keyword: String
});

module.exports = mongoose.model('Client', clientSchema);