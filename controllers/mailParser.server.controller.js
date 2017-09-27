var express = require('express');
var MailListener = require("mail-listener2");
var fs = require('fs');

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
        markSeen: false, // all fetched email willbe marked as seen and not fetched next time
        fetchUnreadOnStart: false, // use it only if you want to get all unread email on lib start. Default is `false`,
        mailParserOptions: {streamAttachments: false}, // options to be passed to mailParser lib.
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
        //console.log("new email");

        //data.content.pipe(process.stdout);
        //data.on('end', ()=>data.release());



        //console.log(mail['attachments']);
        var attachmentsArray = mail['attachments'];
        if (typeof attachmentsArray !== 'undefined')  {
            for (var index = 0; index < attachmentsArray.length; index++) {
                //if (attachmentsArray[index]['fileName'].indexof('test') != -1) {
                //    console.log(attachmentsArray[index]['content'].toString('utf-8'));
                //}
                //console.log(attachmentsArray[index]['fileName']);
                //var output = fs.createWriteStream(attachmentsArray[index]['fileName']);
                //attachmentsArray[index].stream.pipe(output);
                var buffer =  new Buffer(attachmentsArray[index].length);
                //console.log(attachmentsArray[index].content.toString("base64", 0, attachmentsArray[index].length));
                //console.log(JSON.parse(buffer));
                //attachmentsArray[index]['content'].pipe(process.stdout);
                //attachmentsArray[index]['content'].on('end', ()=> console.log(attachmentsArray[index]['content'].release()));

            }
        }
       // catch (e){
        //    console.log(mail['attachments']);
        //    throw e;
        //}


        //console.log(mail['text']);
       // console.log(mail['subject']);// [subject:] || attachments


        //mail.SaveAllAttachments("attachments/"); //INSIDE HTML ATTR: "<br>Subject: test parser<br>"
        //console.log("saved!!");
        // mail processing code goes here
    });

    mailListener.on("attachment", function(attachment){
        console.log(attachment.generatedFileName);
        console.log(attachment.path);
        console.log(attachment);
       // console.log(attachment.content);
        //console.log("new attachment");
        //console.log(attachment);
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

        //var output = fs.createWriteStream(attachment['fileName']);
        //attachment.stream.pipe(output);

       // });
    });
}
