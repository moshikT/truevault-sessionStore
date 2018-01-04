'use strict';

/**
 *
 * Controller for handling mail inbox, and keep track on new candidates data
 *
 * @author Moshik
 * @type {Connection}
 */

const request = require('request');
const Imap = require('imap');
const fs      = require('fs');
const base64  = require('base64-stream');
const inspect = require('util').inspect;
const MailBox = require('../models/mailBox.server.model.js');
const Mail = require('../models/mail.server.model.js');
const MailParser = require('../controllers/mailParser.server.controller.js');
const s3 = require('s3');
var PDFParser = require("pdf2json");
var AWS = require('aws-sdk');
/*
AWS credentials
AWSAccessKeyId=AKIAJQIP6ULQJOJJDBYQ
AWSSecretKey=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
 */
const client = s3.createClient({
    maxAsyncS3: 20,     // this is the default
    s3RetryCount: 3,    // this is the default
    s3RetryDelay: 1000, // this is the default
    multipartUploadThreshold: 20971520, // this is the default (20 MB)
    multipartUploadSize: 15728640, // this is the default (15 MB)
    s3Options: {
        accessKeyId: "AKIAJQIP6ULQJOJJDBYQ",
        secretAccessKey: "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",
        // any other options are passed to new AWS.S3()
        // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
    },
});

const self = this;

exports.fetchMail = function (req, res) {
    if(!req.body || !req.body.userName) res.status(500).send("problem with post request for this data");

    MailBox.findOne({'userName' : req.body.userName}, function(err, mailBox) {
        if(err) {
            console.log(err);
        }

        if(mailBox) {
            // initiate imap object
            var imap = new Imap({
                user: mailBox.userName,//'moshik@empiricalHire.com',
                password: mailBox.password,// '301776217',
                host: 'imap.gmail.com',
                port: 993,
                tls: true
            });

            imap.connect();

            imap.once('ready', function() {
                openInbox(imap, function(err, box) {
                    if (err) throw err;

                    let lastUidNext = mailBox.uidnext;
                    let messagesHeadersHM = {};
                    let messagesDataHM = {};
                    let uidNextquery = lastUidNext + ':*';;
                    //let uidNextquery = box.uidnext + ':*'; // 16766
                    let fetchData = imap.fetch(uidNextquery, { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)','TEXT'] , struct: true});
                    fetchData.on('message', function(msg, seqno) {
                        var prefix = '(#' + seqno + ') ';
                        msg.on('body', function(stream, info) {
                            var buffer = '';
                            stream
                                .on('data', function(chunk) {
                                    buffer += chunk.toString('utf8');
                                })
                                .on('end', function() {
                                    var headers = JSON.stringify(Imap.parseHeader(buffer));
                                    if(headers != '{}') {
                                        messagesHeadersHM[seqno] = headers;
                                    }
                                    else {
                                        // TODO: buffer contains full message - need to parse msg TEXT
                                    }
                                    //console.log("full msg buffer: ", buffer);
                                });

                        });
                        msg.once('attributes', function(attrs) {
                            // check for new emails by testing messages with uid higher then the last uid
                            console.log("lastUidNext ", lastUidNext);
                            console.log("attrs.uid ", attrs.uid);
                            if(attrs.uid >= lastUidNext) {
                                var messageElements = [];
                                if(attrs.struct.length > 1) {
                                    // extract all subArrays to one array
                                    messageElements = flatten(attrs.struct.slice());
                                }
                                else {
                                    messageElements = attrs.struct.slice();
                                }

                                for(let i = 0; i < messageElements.length; i++) {
                                    // save only messages with attachments
                                    if(messageElements[i].disposition && messageElements[i].disposition.type === 'ATTACHMENT'
                                      && messageElements[i].disposition.params.filename !== 'invite.ics') {
                                        // extract msg data HashMap object
                                        let msgData = {};
                                        msgData.uid = attrs.uid;
                                        msgData.fileName = messageElements[i].disposition.params.filename;
                                        msgData.attachment = messageElements[i];
                                        messagesDataHM[seqno] = msgData;
                                        console.log("msgData.attachment: ", msgData.attachment);
/*
                                        var writeStream = fs.createWriteStream(msgData.fileName);
                                        writeStream.on('finish', function() {
                                            console.log(prefix + 'Done writing to file %s', msgData.fileName);
                                        });

*/
                                        //stream.pipe(writeStream);
                                    }
                                }
                            }
                        });
                        msg.once('end', function() {
                            console.log(prefix + 'Finished');
                        });
                    });
                    fetchData.once('error', function(err) {
                        console.log('Fetch error: ' + err);
                    });
                    fetchData.once('end', function() {
                        // save all messages with attachment
                        for(let msg in messagesDataHM) {
                            let parsedHeader = JSON.parse(messagesHeadersHM[msg]);

                            var newMail = new Mail({
                                cid : mailBox.cid,
                                mailBoxId : mailBox._id,
                                text : '',//messagesHeadersHM[msg].text, // TODO: implement text parsing ?
                                from : parsedHeader.from || '',
                                to : parsedHeader.to || '',
                                subject : parsedHeader.subject || '',
                                date : parsedHeader.date || '',
                                uid : messagesDataHM[msg].uid,
                                attachmentFileName : messagesDataHM[msg].fileName,
                                attachment : messagesDataHM[msg].attachment,
                                status : { completed: false }
                            });

                            newMail.save(function (err) {
                                if(err) {
                                    console.log("err: ", err);
                                }
                                else {
                                    console.log("saved to db! ", newMail);
                                }
                            });
                        }

                        // update mail box with uidNext
                        if(mailBox.uidnext != box.uidnext) {
                            mailBox.uidnext = box.uidnext;
                            mailBox.save(function (err) {
                                if(err) {
                                    console.log(err);
                                }
                                else {
                                    console.log("updated mailBox uidnext");
                                }
                            });
                        }

                        imap.end();
                        //res.end('success');
                    });
                });
            });

            imap.once('error', function(err) {
                console.log(err);
            });

            imap.once('end', function() {
                console.log('Connection ended');
                // get next mail
                self.getNextMail(mailBox.userName, mailBox.password, res);
            });
        }
        else {
            console.log("unable to find mailBox document");
           // TODO: create new ??
        }
    });
};

function openInbox(imap , cb) {
    imap.openBox('INBOX', true, cb);
}



exports.getNextMail = function(mailBoxUserName, mailBoxPassword, res) {
    var query = Mail.find({'status.completed': false });

    // find and return next email to process from db
    query.limit(1).sort('uid').exec(function (err, mail) {
        if (err) throw err;

        if(!mail || !mail[0] || !mail[0].attachment) {
            console.log("no mails found");
            // TODO: if not found return alert: "there is no new emails"
            return -1; // temporary handling FIXME
        }
        let attachmentFromDB = mail[0].attachment;

        var imap    = new Imap({
            user: mailBoxUserName,
            password: mailBoxPassword,
            host: 'imap.gmail.com',
            port: 993,
            tls: true
            //,debug: function(msg){console.log('imap:', msg);}
        });

        imap.once('ready', function() {
            imap.openBox('INBOX', true, function(err, box) {
                if (err) throw err;

                var f = imap.fetch(mail[0].uid , {
                    bodies: [attachmentFromDB.partID],
                    struct: true
                });
                //build function to process attachment message
                f.on('message', saveAttachment(attachmentFromDB, mail[0], res));
            });

        });
        imap.once('error', function(err) {
            console.log(err);
        });

        imap.once('end', function() {
            console.log('Connection ended');
        });

        imap.connect();

    });
};

exports.getMailBoxesPage = function (req, res) {
    MailBox.find({}, function(err, mailBoxes) {
        if(err) throw err;
        if(mailBoxes) {
            res.render('mailBoxes', {
                title: 'Mail Boxes',
                mailBoxes : mailBoxes
            });
        }
        else {
            res.status(500).send("no mailBoxes found");
        }
    });
};

/**
 * Private method to extract all inner arrays of subArray to single element array.
 *
 * @param arr
 * @returns {*}
 */
function flatten(arr) {
    return arr.reduce(function (flat, toFlatten) {
        return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
    }, []);
}

/**
 * Save attachment locally and:
 *  1. upload to s3
 *  2. process data via ______ and display
 *
 * @param attachment
 * @returns {Function}
 */
function saveAttachment(attachment, mail, res) {
    var filename = attachment.params.name;
    var encoding = attachment.encoding;

    return function (msg, seqno) {
        let fileData = '';
        var prefix = '(#' + seqno + ') ';
        msg.on('body', function(stream, info) {
            //Create a write stream so that we can stream the attachment to file;
            console.log(prefix + 'Streaming this attachment to file', filename, info);
            var writeStream = fs.createWriteStream(filename);

            var req = request.post('http://processing.resumeparser.com/requestprocessing.html', function (err, resp, body) {
                if (err) {
                    console.log('Error!');
                } else {
                    console.log("response: ", resp);
                    if(resp.statusCode !== 200) {
                        console.log("err with the response: ", resp.statusCode);
                    }
                    console.log("body: ", body);
                    if(body.toString().indexOf('STATUS[701]') !== -1) {
                        console.log("Some error occur while parsing the cv ");
                    }

                    //TODO: render a view with the result body
                    res.json(body);

                    // update mail object status completed to true
                    mail.status.completed = true;
                    mail.save(function (err) {
                        if(err) {
                            console.log("unable to update mail status to completed!");
                        }
                        else {
                            console.log("updated mail status to completed!");
                        }
                    });
                }
            });


            writeStream.on('finish', function() {
                console.log(prefix + 'Done writing to file %s', filename);
                uploadFileToS3(client, filename, stream);
                var form = req.form();
                form.append('product_code', 'e66085028c6881da7905e601c0f24272');
                form.append('file', stream, {
                    filename: filename,
                    contentType: 'application/pdf'
                });
            });

            if (encoding === 'BASE64') {
                stream.pipe(base64.decode()).pipe(writeStream);
            } else  {
                stream.pipe(writeStream);
            }
        })
            .once('end', function() {
            console.log(prefix + 'Finished attachment %s', filename);

        });
    };
}

function uploadFileToS3(s3Client, fileName, file) {
    AWS.config.update({
        accessKeyId: "AKIAJQIP6ULQJOJJDBYQ",
        secretAccessKey: "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"//,
    });

    var s3 = new AWS.S3();

    const stats = fs.statSync(fileName);
    const fileSizeInBytes = stats.size;

    let buffer = new Buffer(fileSizeInBytes);

    fs.open(fileName, "r", function (err,fd) {
        if (err) {
            throw err;
        }

        fs.read(fd, buffer, 0, fileSizeInBytes, 0, function(err, bytesRead, buffer) {
            let params = {Bucket: "emphire-cv", Key: fileName, Body: buffer /*base64data*/};
            s3.putObject(params, function (err, data) {
                if (err) {
                    console.log(err)
                } else {
                    console.log("Successfully uploaded data to myBucket/myKey");
                }
            });
        })
    });
}
