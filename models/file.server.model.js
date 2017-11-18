const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dataFileSchema = new Schema({
    fileName: {type: String, required: true},
    fileData: {type: Buffer, required: true}
});

module.exports = mongoose.model('DataFile', dataFileSchema);