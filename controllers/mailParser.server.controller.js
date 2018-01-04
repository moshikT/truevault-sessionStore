var express = require('express');
var MailListener = require("mail-listener2");
var fs = require('fs');
var pdfText = require('pdf-text');
var PDFParser = require("pdf2json");

exports.onMailArrived = function (mailBoxUserName, mailBoxPassword, uid) {
    var mailListener = new MailListener({
        username: mailBoxUserName,
        password: mailBoxPassword,
        host: "imap.gmail.com",
        port: 993, // imap port
        tls: true,
        connTimeout: 10000, // Default by node-imap
        authTimeout: 5000, // Default by node-imap,
        //debug: console.log, // Or your custom function with only one incoming argument. Default: null
        tlsOptions: { rejectUnauthorized: false },
        mailbox: "INBOX", // mailbox to monitor
        //searchFilter: ["UNSEEN", "FLAGGED"], // the search filter being used after an IDLE notification has been retrieved
        markSeen: false, // all fetched email willbe marked as seen and not fetched next time
        fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
        mailParserOptions: {streamAttachments: false}, // options to be passed to mailParser lib.
        attachments: false, // download attachments as they are encountered to the project directory
        attachmentOptions: { directory: "attachments/" } // specify a download directory for attachments
    });

    mailListener.start();

    mailListener.on("server:connected", function(){
        console.log("%s.%s:%s -", __file, __ext, __line, "imapConnected");
    });

    mailListener.on("server:disconnected", function(){
        console.log("%s.%s:%s -", __file, __ext, __line, "imapDisconnected");
    });

    mailListener.on("error", function(err){
        console.log("%s.%s:%s -", __file, __ext, __line, err);
    });

    mailListener.on("mail", function(mail, seqno, attributes){
        // do something with mail object including attachments
        console.log("%s.%s:%s -", __file, __ext, __line, "seqno", seqno);
        console.log("%s.%s:%s -", __file, __ext, __line, "attributes", attributes.uid);

        if(attributes.uid == uid) {
            console.log("%s.%s:%s -", __file, __ext, __line, "found the wanted email! process attachment", uid);
        }

/*
        console.log("%s.%s:%s -", __file, __ext, __line, "emailParsed", mail.subject);
        if(mail.subject.indexOf("Invitation") == '-1') {
            console.log("%s.%s:%s -", __file, __ext, __line, "email Text: ", mail.text);
            console.log("%s.%s:%s -", __file, __ext, __line, "email subject: ", mail.subject);
            console.log("%s.%s:%s -", __file, __ext, __line, "email from: ", mail.from[0].address);
            console.log("%s.%s:%s -", __file, __ext, __line, "email date sent: ", mail.date);*/
            console.log("%s.%s:%s -", __file, __ext, __line, "email attachments: ", mail.attachments);
            //console.log("%s.%s:%s -", __file, __ext, __line, "email return path", mail.headers['return-path']);

            var attachmentsArray = mail['attachments'];
            if (typeof attachmentsArray !== 'undefined')  {
                for (var index = 0; index < attachmentsArray.length; index++) {
                    var fileName = attachmentsArray[index].generatedFileName.toString();
                    if(fileName.indexOf('ics') == '-1' && fileName.indexOf('pdf') != '-1') {

                        console.log("%s.%s:%s -", __file, __ext, __line, fileName);
                        var buffer = attachmentsArray[index].content;
                        let pdfParser = new PDFParser(this,1);

                        pdfParser.parseBuffer(buffer);

                        pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
                        pdfParser.on("pdfParser_dataReady", pdfData => {
                            console.log("%s.%s:%s -", __file, __ext, __line, pdfParser.getRawTextContent());
                        });

                    }
                }

            }
       // }

    });

    mailListener.on("attachment", function(attachment){

    });
}
