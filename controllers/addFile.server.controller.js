"use strict";
const express = require('express');
const fs = require('fs');
const path = require('path');
const DataFile = require('../models/file.server.model.js');
const tmpDir = '/tmp/';

// Display the file uploading page
exports.getAddFilePage = function (req, res) {
    res.render('addFile', {title: 'Add File', stage: 0});
};

// Display the file uploading response in error state
//FIXME: In this case the upload form should be displayed with the data from before and an error message
function renderError(req, res) {
    res.render('addFile', {title: 'Add File', stage: -1});
}

// Display the file uploading response in success state
//FIXME: In this case the upload form should be displayed with the data from before and a success message
function renderSuccess(req, res) {
    res.render('addFile', {title: 'Add File', stage: 1});
}

// Handler for POST of upload file form
exports.addFile = function (req, res) {
    if (!req.file) { // safety
        console.log("%s.%s:%s -", __file, __ext, __line, "req.file: ", req.file);
        return renderError(req, res);
    }
    if ((req.body.fileName === undefined) || (req.body.fileName === '')) { // safety
        console.log("%s.%s:%s -", __file, __ext, __line, "req.body.fileName: ", req.body.fileName);
        return renderError(req, res);
    }

    // The filename to be used to store the file in the DB - provided in the form
    const newFileName = req.body.fileName;

    // Check if this file is already stored in the DB
    DataFile.findOne({fileName: newFileName}, function (err, dataFileFound) {
        if (err) { // There was an error checking the DB
            // In this case we can't store the file because we may be creating duplicate entries
            console.log("%s.%s:%s -", __file, __ext, __line, "Error: ", err);
            return renderError(req, res);
        }

        let dataFileEntry;

        if (dataFileFound) { // This file is already in collection so need to replace it
            dataFileEntry = dataFileFound;
            dataFileEntry.markModified('fileData'); // We're going to update the file so we need to mark it for mongoose
        }
        else { // The file is not in the collection so need to create a new entry
            dataFileEntry = new DataFile({
                fileName: newFileName
            })
        }
        // In any case - read the uploaded file into the existing or new entry
        dataFileEntry.fileData = fs.readFileSync(req.file.path);
        // Save the file in the db
        dataFileEntry.save(function (err) {
            if (err) { // There was an error saving in the db
                console.log("%s.%s:%s -", __file, __ext, __line, "Error: ", err);
                return renderError(req, res);
            }
            else { // file successfully saved
                // If the file already exists on /tmp - need to delete it so the new file will be used next time
                console.log("%s.%s:%s -", __file, __ext, __line, "Saved file in DB. Checking if exists on disk: ", newFileName);
                //FIXME: Need to tell other dynos that a new file was uploaded so that they will delete it from the /tmp too
                if (fs.existsSync(tmpDir + newFileName)) { // file already exists in /tmp
                    console.log("%s.%s:%s -", __file, __ext, __line, "File already exists, removing: ", newFileName);
                    fs.unlinkSync(tmpDir + newFileName); // delete the file on disk
                }

                return renderSuccess(req, res);
            }
        })
    });
};

// Check if a file is available in tmp directory. If not - check if it's available in the db and retrieve it to tmp.
// If it's neither in tmp or in db, check the same for an alternate file.
// Also supports checking for only one file - if a second filename isn't provided.
// The method uses a promise for the result of the check.
exports.getFile = function (fileNames) {
    return new Promise(
        function (resolve, reject) {
            let fileName = fileNames[0];
            if (!fileNames[0]) { // safety
                reject(new Error('Missing filenane'));
                return;
            }
            let filePath = tmpDir + fileName;
            if (fs.existsSync(filePath)) { // First file already exists in tmp
                console.log("%s.%s:%s -", __file, __ext, __line, "File already exists, using it: ", filePath);
                resolve(filePath);
                return;
            }

            console.log("%s.%s:%s -", __file, __ext, __line, "First file doesn't exist, checking in db: ", fileName);
            DataFile.findOne({fileName: fileName}, function (err, dataFileFound) { // Check the db for first file
                if (err) { // Error checking in db. This doesn't mean the file isn't there - it means we couldn't check!
                    console.log("%s.%s:%s -", __file, __ext, __line, "Error: ", err);
                    let reason = new Error("Error: ", err);
                    reject(reason);
                    return;
                }

                if (dataFileFound) { // This file is in db - save it to disk
                    console.log("%s.%s:%s -", __file, __ext, __line, "File found in db, saving to disk: ", fileName);
                    fs.writeFileSync(filePath, dataFileFound.fileData);
                    resolve(filePath);
                    return;
                }
                else { // File wasn't found in db either. Check for the second file instead.
                    console.log("%s.%s:%s -", __file, __ext, __line, "File not found in db: ", fileName);
                    let reason = new Error("File not found in db: ", fileName);

                    fileName = fileNames[1];
                    filePath = tmpDir + fileName;
                    if (!fileName) { // Was a second filename provided?
                        // No second filename provided. Just signal the failure
                        let reason = new Error("File not found in db: ", fileName);
                        reject(reason);
                        return;
                    }

                    if (fs.existsSync(filePath)) { // file already exists in tmp
                        console.log("%s.%s:%s -", __file, __ext, __line, "File already exists, using it: ", filePath);
                        resolve(filePath);
                        return;
                    }

                    console.log("%s.%s:%s -", __file, __ext, __line, "File doesn't exist, checking in db: ", fileName);
                    // Check the db for the second file
                    DataFile.findOne({fileName: fileName}, function (err, dataFileFound) {
                        if (err) { // Error checking in db. This doesn't mean the file isn't there - it means we couldn't check!
                            console.log("%s.%s:%s -", __file, __ext, __line, "Error: ", err);
                            let reason = new Error("Error: ", err);
                            reject(reason);
                            return;
                        }

                        if (dataFileFound) { // This file is in db - save it to disk
                            console.log("%s.%s:%s -", __file, __ext, __line, "File found in db, saving to disk: ", filePath);
                            fs.writeFileSync(filePath, dataFileFound.fileData);
                            resolve(filePath);
                            return;
                        }
                        else { // File isn't in db either
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