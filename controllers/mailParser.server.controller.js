var express = require('express');
var MailListener = require("mail-listener2");
var fs = require('fs');
var pdfText = require('pdf-text');
var PDFParser = require("pdf2json");

exports.onMailArrived = function () {
    var mailListener = new MailListener({
        username: "chikots2@gmail.com",
        password: "301776217",
        host: "imap.gmail.com",
        port: 993, // imap port
        tls: true,
        connTimeout: 10000, // Default by node-imap
        authTimeout: 5000, // Default by node-imap,
        //debug: console.log, // Or your custom function with only one incoming argument. Default: null
        tlsOptions: { rejectUnauthorized: false },
        mailbox: "INBOX", // mailbox to monitor
        //searchFilter: ["UNSEEN", "FLAGGED"], // the search filter being used after an IDLE notification has been retrieved
        markSeen: true, // all fetched email willbe marked as seen and not fetched next time
        fetchUnreadOnStart: false, // use it only if you want to get all unread email on lib start. Default is `false`,
        mailParserOptions: {streamAttachments: false}, // options to be passed to mailParser lib.
        attachments: false, // download attachments as they are encountered to the project directory
        attachmentOptions: { directory: "attachments/" } // specify a download directory for attachments
    });

    mailListener.start();

    mailListener.on("server:connected", function(){
        console.log("imapConnected");
    });

    mailListener.on("server:disconnected", function(){
        console.log("imapDisconnected");
    });

    mailListener.on("error", function(err){
        console.log(err);
    });

    mailListener.on("mail", function(mail, seqno, attributes){
        // do something with mail object including attachments
        console.log("emailParsed", mail.subject);
        if(mail.subject.indexOf("Invitation") == '-1') {
            console.log("email Text: ", mail.text);
            console.log("email subject: ", mail.subject);
            console.log("email from: ", mail.from[0].address);
            console.log("email date sent: ", mail.date);
            console.log("email attachments: ", mail.attachments);
            //console.log("email return path", mail.headers['return-path']);

            var attachmentsArray = mail['attachments'];
            if (typeof attachmentsArray !== 'undefined')  {
                for (var index = 0; index < attachmentsArray.length; index++) {
                    var fileName = attachmentsArray[index].generatedFileName.toString();
                    if(fileName.indexOf('ics') == '-1' && fileName.indexOf('pdf') != '-1') {

                        console.log(fileName);
                        var buffer = attachmentsArray[index].content;
                        let pdfParser = new PDFParser(this,1);

                        pdfParser.parseBuffer(buffer);

                        pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
                        pdfParser.on("pdfParser_dataReady", pdfData => {
                            console.log(pdfParser.getRawTextContent());
                        });

                    }
                }

            }
        }

    });

    mailListener.on("attachment", function(attachment){

    });
}
