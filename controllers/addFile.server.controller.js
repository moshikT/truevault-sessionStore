"use strict";
const express = require('express');
const fs = require('fs');
const path = require('path');
const DataFile = require('../models/file.server.model.js');

exports.getAddFilePage = function (req, res) {
    res.render('addFile', {title: 'Add File', stage: 0});
};

function renderError(req, res) {
    res.render('addFile', {title: 'Add File', stage: -1});
}

function renderSuccess(req, res) {
    res.render('addFile', {title: 'Add File', stage: 1});
}

exports.addFile = function (req, res) {
    if (!req.file) { // safety
        console.log("%s.%s:%s -", __file, __ext, __line, "req.file: ", req.file);
        return renderError(req, res);
    }
    if ((req.body.fileName === undefined) || (req.body.fileName === '')) { // safety
        console.log("%s.%s:%s -", __file, __ext, __line, "req.body.fileName: ", req.body.fileName);
        return renderError(req, res);
    }

    const newFileName = req.body.fileName;

    const dataFileEntry = new DataFile({
        fileData: fs.readFileSync(req.file.path),
        name: newFileName
    });

    DataFile.findOne({fileName: newFileName}, function (err, dataFileFound) {
        if (err) {
            console.log("%s.%s:%s -", __file, __ext, __line, "Error: ", err);
            return renderError(req, res);
        }

        let dataFileEntry;

        if (dataFileFound) { // This file is already in collection so need to replace it
            dataFileEntry = dataFileFound;
        }
        else {
            dataFileEntry = new DataFile({
                fileName: newFileName
            })
        }
        dataFileEntry.fileData = fs.readFileSync(req.file.path);
        dataFileEntry.save(function (err) {
            if (err) {
                console.log("%s.%s:%s -", __file, __ext, __line, "Error: ", err);
                return renderError(req, res);
            }
            else { // file successfully saved
                // If the file already exists on /tmp - need to delete it so the new file will be used next time
                console.log("%s.%s:%s -", __file, __ext, __line, "Saved file in DB. Checking if exists on disk: ", newFileName);
                //FIXME: Need to tell other dynos that a new file was uploaded so that they will delete it from the /tmp too
                if (fs.existsSync('/tmp/' + newFileName)) { // file already exists in /tmp
                    console.log("%s.%s:%s -", __file, __ext, __line, "File already exists, removing: ", newFileName);
                    fs.unlinkSync('/tmp/' + newFileName); // delete the file on disk
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

exports.getFile = function (fileNames, callback) {
    return new Promise(
        function (resolve, reject) {
            var fileName = fileNames[0];
            if (fs.existsSync('/tmp/' + fileName)) { // file already exists
                console.log("%s.%s:%s -", __file, __ext, __line, "File already exists, using it: ", fileName);
                resolve(fileName);
                return;
            }

            console.log("%s.%s:%s -", __file, __ext, __line, "File doesn't exist, checking in db: ", fileName);
            DataFile.findOne({fileName: fileName}, function (err, dataFileFound) {
                if (err) {
                    console.log("%s.%s:%s -", __file, __ext, __line, "Error: ", err);
                    let reason = new Error("Error: ", err);
                    reject(reason);
                    return;
                }

                if (dataFileFound) { // This file is in db - save it to disk
                    console.log("%s.%s:%s -", __file, __ext, __line, "File found in db, saving to disk: ", fileName);
                    fs.writeFileSync('/tmp/' + fileName, dataFileFound.fileData);
                    resolve(fileName);
                    return;
                }
                else {
                    console.log("%s.%s:%s -", __file, __ext, __line, "File not found in db: ", fileName);
                    let reason = new Error("File not found in db: ", fileName);

                    fileName = fileNames[1];
                    if (fs.existsSync('/tmp/' + fileName)) { // file already exists
                        console.log("%s.%s:%s -", __file, __ext, __line, "File already exists, using it: ", fileName);
                        resolve(fileName);
                        return;
                    }

                    console.log("%s.%s:%s -", __file, __ext, __line, "File doesn't exist, checking in db: ", fileName);
                    DataFile.findOne({fileName: fileName}, function (err, dataFileFound) {
                        if (err) {
                            console.log("%s.%s:%s -", __file, __ext, __line, "Error: ", err);
                            let reason = new Error("Error: ", err);
                            reject(reason);
                            return;
                        }

                        if (dataFileFound) { // This file is in db - save it to disk
                            console.log("%s.%s:%s -", __file, __ext, __line, "File found in db, saving to disk: ", fileName);
                            fs.writeFileSync('/tmp/' + fileName, dataFileFound.fileData);
                            resolve(fileName);
                            return;
                        }
                        else {
                            console.log("%s.%s:%s -", __file, __ext, __line, "File not found in db: ", fileName);
                            let reason = new Error("File not found in db: ", fileName);
                            reject(reason);
                            return;
                        }
                    })
                }
            })
        }
    )
};