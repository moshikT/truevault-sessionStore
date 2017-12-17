'use strict';

/*
 TrueVault controller for handling request to trueVault api
 moshik user API_KEY = 207da439-301c-48bb-91bf-2a72d498dfef
 */

const request = require('request');
const rp = require('request-promise-native');
const API_KEY = "MjA3ZGE0MzktMzAxYy00OGJiLTkxYmYtMmE3MmQ0OThkZmVm"; // base64 encoded
const vaultId = '987b3d71-6e6a-4fef-88af-1a1df582dc08'; // db id - EmpiricalHire
const dbUrl = 'https://api.truevault.com/v1/vaults/' + vaultId;
const basicUrl = 'https://api.truevault.com/v1/';
const candidateSchemaId = "714f661e-bb1b-4d4f-bda7-5e67272ec807";//'714f661e-bb1b-4d4f-bda7-5e67272ec807';// candidateTestSchemaId = "405fac9b-37f6-4090-93cf-6d6b2c4a541b";
const sessionSchemaId = "bed02977-02c1-4831-a543-1b7e00d55909";

// Return one document that equal to the documentId. If not exist, returns an error.
// TODO: change named to get documentById and get documentsById's
exports.findOne = function (documentId) {
    return new Promise(function (resolve, reject) {
        let options = setRequestOptions('/documents/' + documentId);

        rp(options)
            .then( body => {
                let utf8encodedDocument = (new Buffer(body, 'base64')).toString('utf8'); // for object return type
                let documentData = JSON.parse(utf8encodedDocument);
                resolve(documentData);
            })
            .catch(function (err) {
                reject(err);
            })
    });
};

// Return an array of documents that correspond to the documentIdsArray
exports.findAll = function (documentIdsArray) {
    return new Promise(function (resolve, reject) {
        //if (documentIdsArray.length <= 1) reject("To receive one document use trueVault.findOne method!");

        // initiate url with a list of document id's
        let optionsUrls = '/documents/';
        // TODO: split the request to max available number
        for (let documentsIndex = 0; documentsIndex < documentIdsArray.length; documentsIndex++) {
            optionsUrls += documentIdsArray[documentsIndex];
            if(documentsIndex !== documentIdsArray.length - 1) {
                optionsUrls += ',';
            }
        }

        let options = setRequestOptions(optionsUrls);

        rp(options)
            .then( body => {
                let encodedBody = (new Buffer(body, 'utf8'));//.toString('utf8') // for object return type
                let responseBody = JSON.parse(encodedBody);
                let documents = responseBody.documents;
                let documentsArray = [];
                for (let index = 0; index < documents.length; index++) {
                    let docObject = {};
                    docObject.id = documents[index].id;
                    let utf8encoded = (new Buffer(documents[[index]].document, 'base64')).toString('utf8');
                    docObject.data = JSON.parse(utf8encoded);
                    documentsArray.push(docObject);
                    // TODO: replace array to object of doc_id:doc_data instead
                }
                resolve(documentsArray);
            })
            .catch(function (err) {
                reject(err);
            })
    });
};

// Insert (post)/update (put), new candidate personal details - return candidate's document id.
function insertCandidate(candidateData, documentId, method) {
    return new Promise(function (resolve, reject) {
        let docTemplateString = JSON.stringify(candidateData);
        let docTemplateB64 = new Buffer(docTemplateString).toString("base64");

        let optionsUrl = '/documents';
        if(method === 'PUT') {
            optionsUrl += '/' + documentId;
        }

        let options = setRequestOptions(optionsUrl);
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        options.form = {
            'document' : docTemplateB64,
            'schema_id': candidateSchemaId
        };
        options.method = method;

        rp(options)
            .then( body => {
                let documentData = JSON.parse(body);
                if(documentData.result === 'success') {
                    resolve(documentData.document_id);
                }
                else {
                    reject("Couldn't save candidate's personal data: " + documentData.result);
                }
            })
            .catch(function (err) {
                reject(err);
            })
    });
}

// if candidate is new post a new candidate else update candidate data with PUT method and candidate's documentId
exports.saveCandidate = function (candidateData, documentId) {
    return new Promise(function (resolve, reject) {
        if(!documentId) {
            insertCandidate(candidateData, undefined, 'POST')
                .then(documentId => {
                    resolve(documentId);
                })
                .catch(err => {
                    reject(err);
                });
        }
        else {
            insertCandidate(candidateData, documentId, 'PUT')
                .then(documentId => {
                    resolve(documentId);
                })
                .catch(err => {
                    reject(err);
                });
        }
    })

};

// get user data from trueVault
exports.getUser = function (accessToken) {
    return new Promise(function (resolve, reject) {
        let options = {
            url: basicUrl + 'auth/me',
            headers: {
                'Authorization':accessToken
            }
        };

        rp(options)
            .then( body => {
                let responseData = JSON.parse(body);
                if(responseData.result === 'success') {
                    let user = responseData.user;
                    resolve(user);
                }
                else {
                    resolve(responseData.result);
                }

                //console.log("user returned: ", body);
            })
            .catch(function (err) {
                reject(err);
            })
    });
};

function setRequestOptions(url) {
    let options = {
        url: dbUrl + url,
        headers: {
            'Authorization':'Basic ' + API_KEY + 'Og=='
        }
    };
    return options;
}

// TODO: create new schema - currently not important enough to implement - can be done at trueVault console
// POST /v1/vaults/(string: vault_id)/schemas - creates new schema in the specified vault.
// urlEndoced (base64 encoding of the schema): "schema=eyJuYW1lIjoidGVzdF9zY2hlbWEiLCJmaWVsZHMiOltdfQ=="
//var queryUrl = 'https://api.truevault.com/v1/vaults/987b3d71-6e6a-4fef-88af-1a1df582dc08/documents/64f34785-d1d1-4cd5-a1a2-527d8106e687'
// differentiate between two types of data recevied - all documents request
// return json object while specific document response is base64 json object encoded
// type: can be schema/vault/document

// Return a schemaId (collectionId) by name
function getSchemaIdByName(name, callback) {
    let options = {
        url: 'https://api.truevault.com/v1/vaults/' + vaultId + '/schemas',
        headers: {
            'Authorization':'Basic MjA3ZGE0MzktMzAxYy00OGJiLTkxYmYtMmE3MmQ0OThkZmVmOg=='
        }
    };

    request(options, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            //let utf8encoded = (new Buffer(body, 'base64')).toString('utf8') // for object return type
            //var jsonRes = JSON.parse(utf8encoded);
            let itemArray = JSON.parse(body);
            //console.log(jsonRes); // for object return type

            if(itemArray['result'] === 'success') {
                for (let itemIndex = 0; itemIndex < itemArray['schemas'].length; itemIndex++) {
                    if(itemArray['schemas'][itemIndex]['name'] === name) {
                        //console.log("item id ", itemArray[grouptype][itemIndex]['id']);
                        callback(itemArray['schemas'][itemIndex]['id']);
                    }
                }
            }
            // TODO: iterate all until name === schemaName and return schema id

        }
        else {
            // TODO: handle error
        }
    });
}

// get candidate document by id - non-Promise version, currently not in used
/*exports.getDocumentById(documentID)
    .then(documentID => {
        var options = {
            url: 'https://api.truevault.com/v1/vaults/' + vaultId + '/documents/' + documentID,
            headers: {
                'Authorization':'Basic MjA3ZGE0MzktMzAxYy00OGJiLTkxYmYtMmE3MmQ0OThkZmVmOg=='
            }
        };

        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                let utf8encoded = (new Buffer(body, 'base64')).toString('utf8') // for object return type
                var jsonRes = JSON.parse(utf8encoded);
                return getDocumentById(jsonRes);
            }
            else {
                // TODO: handle error
            }
        });
    })
    .catch(error => {
        console.log("%s.%s:%s -", __file, __ext, __line, error)
        //res.render('niceError', {
        //    title: 'Add Candidate' + newUser.fullName,
        //    errorText: "Failed to generate short URLs for: '" + newUser.fullName + "'"
        // });
    });*/
/*
var Session = {
    cookie: {
        path: '/',
        _expires: null,
        originalMaxAge: null,
        httpOnly: true
    },
    sid: 'T_PhGL0Jn9bz_E459I4ZTSLdcVQU8aal',
    content: 'changed content',
    updatedAt: new Date()
};
console.log("sessId: ", Session['sid']);
*/
/*
getSessionById(Session['sid'])
    .then(res => {
        console.log("result from getting session: ", res);
    })
    .catch(err => {
        console.log("err while getting session: " /*, err);
    });
*/
/*
saveSession(Session, Session['sid'])
    .then(res => {
        console.log("result from saving session: ", res);
    })
    .catch(err => {
        console.log("err while saveing session: ", err);
    });*/

/*removeSessionById(Session.sid)
    .then(res => {
        console.log("session removed succesfully : ", res);
    })
    .catch(err => {
        console.log("unable to remve session: ", err);
    });
*/
// get session by id (use search filter) - currently not in use, might be useful in the future
exports.getSessionById = function (sessionId) {
    return new Promise(function (resolve, reject) {
        //let options = setRequestOptions('/documents/' + documentId);
        let searchTemplate = {
            "filter":{
                "sid":{
                    //"sessionID":{
                    "type":"eq",
                    "value": sessionId//"test"
                }
            },
            "full_document": true,
            "schema_id": sessionSchemaId//"405fac9b-37f6-4090-93cf-6d6b2c4a541b"
        };

        let searchTemplateString = JSON.stringify(searchTemplate);
        let searchTemplateB64 = new Buffer(searchTemplateString).toString("base64");
        //console.log(searchTemplate.toString('base-64'));
        var options = {
            url: dbUrl + '/search',
            headers: {
                'Authorization':'Basic MjA3ZGE0MzktMzAxYy00OGJiLTkxYmYtMmE3MmQ0OThkZmVmOg==',
                'Content-Type':'application/x-www-form-urlencoded'
            },
            form: {
                'search_option':searchTemplateB64
            },
            method: 'POST'
        };

        //console.log("options: ", options);
        rp(options)
            .then(body => {
                console.log("value return from session search: ", body);
                var itemArray = JSON.parse(body);
                console.log(itemArray); // for object return type
                if (itemArray && itemArray.data && itemArray.data.info && (itemArray.data.info.total_result_count > 0)) {

                    let utf8encodedDocument = (new Buffer(itemArray['data']['documents'][0], 'base64')).toString('utf8'); // for object return type
                    console.log(utf8encodedDocument); // for object return type
                    let documentData = JSON.parse(utf8encodedDocument);


                    console.log(documentData); // for object return type

                    if (itemArray['result'] === 'success') {
                        resolve(documentData);
                    }
                }
                else {
                    console.log("session not found: return null");
                    resolve(null);
                }
                //resolve(documentData);
            })
            .catch(function (err) {
                console.log("error return from session search: ", err);
                reject(err);
            })
    });
};

// upsert session - if session exists update with 'PUT' request else create new session with sessionData
exports.saveSession = function (sessionData, sessionId) {
    return new Promise(function (resolve, reject) {
        if(sessionId) {
            getSessionById(sessionId)
                .then(sessionDocumentData => {
                    // session found update new data with PUT request
                    insertSession(sessionData, sessionDocumentData.document_id, 'PUT')
                        .then(sessionDocumentId => {
                            console.log("success insert existing session");
                            resolve(sessionDocumentId);
                        })
                        .catch(err => {
                            console.log("err insert existing session");
                            reject(err);
                        })
                })
                .catch(err => {
                    reject("error while update session to database; err: ", err);
                })
        }
        else {
            // create new session
            insertSession(sessionData, undefined, 'POST')
                .then(sessionDocumentId => {
                    resolve(sessionDocumentId);
                })
                .catch(err => {
                    reject(err);
                })
        }
    })

};
// if sessionDocumentId exists update session else create new session
function insertSession (sessionData, sessionDocumentId, method) {
    return new Promise(function (resolve, reject) {
        let docTemplateString = JSON.stringify(sessionData);
        let docTemplateB64 = new Buffer(docTemplateString).toString("base64");

        let optionsUrl = '/documents';
        if(method === 'PUT') {
            optionsUrl += '/' + sessionDocumentId;
        }

        let options = setRequestOptions(optionsUrl);
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        options.form = {
            'document' : docTemplateB64,
            'schema_id': sessionSchemaId
        };
        options.method = method;

        rp(options)
            .then( body => {
                let sessionDocumentData = JSON.parse(body);
                if(sessionDocumentData.result === 'success') {
                    resolve(sessionDocumentData.document_id);
                }
                else {
                    reject("Couldn't save session data: " + sessionDocumentData.result);
                }
            })
            .catch(function (err) {
                reject(err);
            })
    });
}

exports.removeSessionById = function (sessionId) {
    return new Promise(function (resolve, reject) {
        getSessionById(sessionId)
            .then(sessionDocumentData => {
                let optionsUrl = '/documents/' + sessionDocumentData.document_id;

                let options = setRequestOptions(optionsUrl);
                options.method = 'DELETE';

                rp(options)
                    .then(response => {
                        resolve("Session %s deleted successfully", sessionId);
                    })
                    .catch(function (err) {
                        reject(err);
                    })
            })
            .catch(err => {
                reject(err);
            })
    });
}

/*
function getDocumentIdBySessionId(sessionID, callback) {
    let searchTemplate = {
        "filter":{
            //"name":{
            "sid":{
                "type":"eq",
                "value": sessionID//"test"
            }
        },
        "full_document": true,
        "schema_id": sessionSchemaId//"405fac9b-37f6-4090-93cf-6d6b2c4a541b"
    };

    let searchTemplateString = JSON.stringify(searchTemplate);
    let searchTemplateB64 = new Buffer(searchTemplateString).toString("base64");
    //console.log(searchTemplate.toString('base-64'));
    var options = {
        url: 'https://api.truevault.com/v1/vaults/' + vaultId + '/search',
        headers: {
            'Authorization':'Basic MjA3ZGE0MzktMzAxYy00OGJiLTkxYmYtMmE3MmQ0OThkZmVmOg==',
            'Content-Type':'application/x-www-form-urlencoded'
        },
        form: {
            'search_option':searchTemplateB64
        }
    };

    request.post(options, function optionalCallback(error, response, body) {
        if (!error && response.statusCode == 200) {
            //let utf8encoded = (new Buffer(body, 'base64')).toString('utf8') // for object return type
            //var jsonRes = JSON.parse(utf8encoded);
            var itemArray = JSON.parse(body);
            //console.log(jsonRes); // for object return type

            if(itemArray['result'] === 'success') {
                callback(itemArray['data']['documents'][0]);
            }
        else {
                // document not found
            }
        }
        else {
            // TODO: handle error - bad request
        }
    });
}
*/
/*
getDocumentIdBySessionId(Session['sid'], function (doc) {
   //console.log("cb body: ", body);
   // console.log("cb res: ", res);
    console.log("cb doc: ", doc);
});
*/
// for testing only
/*let documentIds = ['310559c4-65af-48bf-a82d-89d649c57266', 'cc465b3b-4d70-4e41-b59a-43ebddbde8bc', '8bf3aa01-11c3-4e23-a684-6a15a194957e'];

findAll(/*'310559c4-65af-48bf-a82d-89d649c57266'*//*documentIds)
    .then(document => {
        //console.log("result: ", document);
        //return getDocumentById(result);
    })
    .catch(err => {
        console.log("catch ", err);
    });
//console.log(res);


        let docTemplate = {
            'name': "updated candidate new 5 again"
        };

/*
saveCandidate(docTemplate,'9702a198-948c-4b07-abe6-da39ee6f9b2d')
    .then(document => {
        console.log("result: ", document);
        //return getDocumentById(result);
    })
    .catch(err => {
        console.log("catch ", err);
    });
//insertNewCandidate('');


findOne('9702a198-948c-4b07-abe6-da39ee6f9b2d')
    .then(document => {
        console.log("result: ", document);
        //return getDocumentById(result);
    })
    .catch(err => {
        console.log("catch ", err);
    });*/