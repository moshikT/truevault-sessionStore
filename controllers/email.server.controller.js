/**
 *
 * Email controller for sending sms
 *
 * */
'use strict';

const nodemailer = require('nodemailer');


exports.send = function (mailFrom, mailFromPswd, mailTo, mailSubject, mailTxt) {
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

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};
