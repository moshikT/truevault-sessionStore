var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var clientSchema = new Schema({
    name: {type: String, required: true},
    //id : Number,//{type: Number, required: true},
    logoImg: { data: Buffer, contentType: String },
    logoStyle : String,
    title : String,
    introText : String,
    language : String,
    isDemo : Boolean,
    link : String
});

module.exports = mongoose.model('Client', clientSchema);