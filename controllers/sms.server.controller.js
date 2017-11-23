'use strict';
/**
 * External Global SMS Service - using heroku Fixie addon service in order to receive
 * static authorize IP for the Global SMS api.
 *
 * Authorize IPs listed at Global SMS:
 *     1. 54.173.229.200
 *     2. 54.175.230.252
 */

// Global SMS Credentials
const un="sagygal@gmail.com";
const pw="aenIC9";
const accid="2619";
const http = require('http');
//const fixieUrl = 'http://fixie:IHUAjNg5Pwm0SFb@velodrome.usefixie.com:80';//url.parse(process.env.FIXIE_URL);
//const requestUrl = 'http://api.itnewsletter.co.il/webservices/webservicesms.asmx'

exports.send = function (number, text, callback)
{
    let isSent = true;
    let options = {
        host: 'velodrome.usefixie.com',//fixieUrl.hostname,
        port: 80,//fixieUrl.port,
        path: 'http://api.itnewsletter.co.il/webservices/webservicesms.asmx',//requestUrl.href,
        method: 'POST'//,
    };

    //this.sendSms = function(number, text)
    //{
    let t = new Date();
    let date = t.getFullYear() + '/' + (t.getMonth()+1) + '/' + t.getDate() + ' ' + t.getHours() + ':' + t.getMinutes() + ':' + t.getSeconds();
    //console.log("date is :" + date);

    /* Set data using the global SMS api xml template */
    let data =
        '<?xml version="1.0" encoding="utf-8"?>'+
        '<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">'+
        '<soap12:Body>'+
        '<sendSmsToRecipients xmlns="apiItnewsletter">'+
        '<un>'+un+'</un>'+
        '<pw>'+pw+'</pw>'+
        '<accid>'+accid+'</accid>'+
        '<sysPW>'+'itnewslettrSMS'+'</sysPW>'+
        '<t>'+date+'</t>'+
        '<txtUserCellular>0521234567</txtUserCellular>'+
        '<destination>'+number+'</destination>'+
        '<txtSMSmessage>'+text+'</txtSMSmessage>'+
        '<dteToDeliver></dteToDeliver>'+
        '<txtAddInf>jsnodetest</txtAddInf>'+
        '</sendSmsToRecipients>'+
        '</soap12:Body>'+
        '</soap12:Envelope>';

    options.headers = {
            'Content-Type' : 'text/xml; charset=utf-8',
            'Content-Length' : Buffer.byteLength(data) ,
            'SOAPAction': 'apiItnewsletter/sendSmsToRecipients',
            Host: 'api.itnewsletter.co.il',//requestUrl.host,
            'Proxy-Authorization': `Basic ${new Buffer('fixie:IHUAjNg5Pwm0SFb'/*fixieUrl.auth*/).toString('base64')}`
        };

    //console.log('data :' + data);
    //console.log('data length :' + Buffer.byteLength(data));

    let req = http.request(options, function(res) {
        //console.log('headers:\n' + JSON.stringify(res.headers));
        //console.log('status:\n' + JSON.stringify(res.statusCode));

        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('body:\n' + chunk);
            /*
            *
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
<soap:Body>
    <sendSmsToRecipientsResponse xmlns="apiItnewsletter">
        <sendSmsToRecipientsResult>1</sendSmsToRecipientsResult>
    </sendSmsToRecipientsResponse>
</soap:Body>
</soap:Envelope>

xml:
<sendSmsToRecipientsResponse xmlns="apiItnewsletter">
<sendSmsToRecipientsResult>1</sendSmsToRecipientsResult>
            * */

            //******parse results***************************************
            //run as administrator
            //npm install xmlparser - IMPORTANT !
            let xml2json = require("xmlparser");
            let xml=chunk;

            xml=xml.substr(xml.indexOf("<sendSmsToRecipientsResponse"),
                xml.indexOf("</sendSmsToRecipientsResponse")-xml.indexOf("<sendSmsToRecipientsResponse"));
            let json = xml2json.parser(xml);

            if(res.statusCode === 200) {
                if(json['sendSmsToRecipientsResponse']) {
                    if(json['sendSmsToRecipientsResponse']['sendSmsToRecipientsResult']) {
                        console.log("%s.%s:%s -", __file, __ext, __line, "successful sms sent to the user: result(expected to be '1')= "
                            + json['sendSmsToRecipientsResponse']['sendSmsToRecipientsResult'] + ' phone number: ' + number);
                    }
                }
                else {
                    console.log("%s.%s:%s -", __file, __ext, __line, "successful sms sent to the user. response xml: " + xml
                    + ' phone number: ' + number);
                }
                callback(isSent);
            }
            else {
                console.log("%s.%s:%s -", __file, __ext, __line, "sms response status code is not 200: " + JSON.stringify(res.statusCode)
                    + ' phone number: ' + number);
                callback(!isSent);
            }
        });
    });

    req.on('error', function(e) {
        console.log("%s.%s:%s -", __file, __ext, __line, "sms - problem with request: " + e.message + ' phone number: ' + number);
        callback(!isSent);
    });

    //console.log('data :' + data);
    req.write(data);
    req.end();
    //}
};

//var _sms = new sms();
//_sms.sendSms("0547456084","test 111\n עברית");

/*
* <div class="ip">Your IP Address Is: <div>
*     <span id="d874938">&#
* 53 =>
* ;</span>
* <span id="a242979">&#
* 52
* ;</span>
* <span id="d813780">&#
* 46
* ;</span>
* <label id="a722244">&#
* 49
* ;</label>
* <span id="d510018">&#
* 55
* ;</span><label id="d806180">&#
* 53
* ;</label><span id="g648529">&#
* 46
* ;</span><label id="c398272">&#
* 50
* ;</label><span id="c866584">&#
* 51
* ;</span><label id="e334852">&#
* 48
* ;</label><span id="e361022">&#
* 46
* ;</span><label id="c352797">&#
* 50
* ;</label><label id="g315016">&#
* 53
* ;</label><span id="f319938">&#
* 50;</span></div></div>
*
* Ascii translation: 54.175.230.252
*
* */