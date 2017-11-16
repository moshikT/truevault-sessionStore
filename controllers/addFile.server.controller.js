const express = require('express');
const fs = require('fs');
const path = require('path')
const DataFile = require('../models/file.server.model.js');

exports.getAddFilePage = function (req, res) {
    res.render('addFile', {title: 'Add File', stage: 0});
};

renderError = function (req, res) {
    res.render('addFile', {title: 'Add File', stage: -1});
};

renderSuccess = function (req, res) {
    res.render('addFile', {title: 'Add File', stage: 1});
};

exports.addFile = function (req, res) {
    if (!req.file) { // safety
        console.log("%s.%s:%s -", __file, __ext, __line, "req.file: ", req.file);
        return renderError(req, res);
    }
    if ((req.body.fileName === undefined) || (req.body.fileName === '')) { // safety
        console.log("%s.%s:%s -", __file, __ext, __line, "req.body.fileName: ", req.body.fileName)
        return renderError(req, res);
    }

    const dataFileEntry = new DataFile({
        fileData: fs.readFileSync(req.file.path),
        name: req.body.fileName
    });

    DataFile.findOne({fileName: req.body.fileName}, function (err, dataFileFound) {
        if (err) {
            console.log("%s.%s:%s -", __file, __ext, __line, "Error: ", err)
            return renderError(req, res);
        }

        let dataFileEntry;

        if (dataFileFound) { // This file is already in collection so need to replace it
            dataFileEntry = dataFileFound;
        }
        else {
            dataFileEntry = new DataFile({
                fileName: req.body.fileName
            })
        }
        dataFileEntry.fileData = fs.readFileSync(req.file.path);
        dataFileEntry.save(function (err) {
            if (err) {
                console.log("%s.%s:%s -", __file, __ext, __line, "Error: ", err)
                return renderError(req, res);
            }
            else { // file successfully saved
                // If the file already exists on /tmp - need to delete it so the new file will be used next time
                //FIXME: Need to tell other dynos that a new file was uploaded so that they will delete it from the /tmp too
                if (fs.existsSync('/tmp/' + req.file.filename)) { // file already exists in /tmp
                    console.log("%s.%s:%s -", __file, __ext, __line, "File already exists, removing: ", req.file.filename);
                    fs.unlink('/tmp/' + req.file.filename);
                }

                return renderSuccess(req, res);
            }
        })
    });
};

function timeout(delay) {
    return new Promise(function (resolve, reject) {
        setTimeout(resolve, delay);
    });
}

exports.getFile = function (fileName, callback) {
    return new Promise(
        function (resolve, reject) {
            if (fs.existsSync('/tmp/' + fileName)) { // file already exists
                console.log("%s.%s:%s -", __file, __ext, __line, "File already exists, using it: ", fileName);
                resolve(true);
                return;
            }

            console.log("%s.%s:%s -", __file, __ext, __line, "File doesn't exist, checking in db: ", fileName);
            DataFile.findOne({fileName: fileName}, function (err, dataFileFound) {
                if (err) {
                    console.log("%s.%s:%s -", __file, __ext, __line, "Error: ", err)
                    var reason = new Error("Error: ", err)
                    reject(reason);
                    return;
                }

                if (dataFileFound) { // This file is in db - save it to disk
                    console.log("%s.%s:%s -", __file, __ext, __line, "File found in db, saving to disk: ", fileName);
                    fs.writeFileSync('/tmp/' + fileName, dataFileFound.fileData);
                    resolve(true);
                    return;
                }
                else {
                    console.log("%s.%s:%s -", __file, __ext, __line, "File not found in db: ", fileName);
                    var reason = new Error("File not found in db: ", fileName)
                    reject(reason);
                    return;
                }
            })
        }
    )
};