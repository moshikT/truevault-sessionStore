/**
 *
 * Email controller for sending sms
 *
 * */
'use strict';

const nodemailer = require('nodemailer');


exports.send = function (mailFrom, mailFromPswd, mailTo, mailSubject, mailTxt) {
    console.log("%s.%s:%s -", __file, __ext, __line, "Preparing email");
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: mailFrom,
            pass: mailFromPswd
        }
    });

    var mailOptions = {
        from: mailFrom,
        to: mailTo,
        subject: mailSubject,
        text: mailTxt
    };

    console.log("%s.%s:%s -", __file, __ext, __line, "Sending email. Transport: ", transporter, "; options: ", mailOptions);
    transporter.sendMail(mailOptions, function(error, info){
        console.log("%s.%s:%s -", __file, __ext, __line, "Finished sending email");
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};
