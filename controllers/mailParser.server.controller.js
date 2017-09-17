var express = require('express');
var MailListener = require("mail-listener2");
var fs = require('fs');
/*
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
        fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
        mailParserOptions: {streamAttachments: true}, // options to be passed to mailParser lib.
        attachments: true, // download attachments as they are encountered to the project directory
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
        //console.log("emailParsed", mail);
        //mail.SaveAllAttachments("attachments/");
        //console.log("saved!!");
        // mail processing code goes here
    });

    mailListener.on("attachment", function(attachment){
        console.log(attachment.data);
        //var input = fs.createReadStream("/" + attachment.fileName);
        //console.log(attachment);
        //attachment.save('attachments/');
        //var content = fs.readFile(attachment.fileName);
        //console.log(content);
       // f//s.writeFile(attachment.fileName, content, function(err) {
         //   if (err) throw err;
            //var dt = dateTime.create();
            //var formatted = dt.format('Y-m-d H:M:S');
           // console.log('file saved at ');
       // });
    });
}
*/