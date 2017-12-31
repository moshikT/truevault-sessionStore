'use strict';
/**
 * TrueVault controller/adapter for handling request to trueVault api.
 * Moshik_TrueVault_User; API_KEY = 207da439-301c-48bb-91bf-2a72d498dfef
 *
 * @author Moshik
 */

const request = require('request');
const rp = require('request-promise-native');
const API_KEY = "MjA3ZGE0MzktMzAxYy00OGJiLTkxYmYtMmE3MmQ0OThkZmVm"; // base64 encoded
const vaultId = '987b3d71-6e6a-4fef-88af-1a1df582dc08'; // db id - EmpiricalHire
const dbUrl = 'https://api.truevault.com/v1/vaults/' + vaultId;
const basicUrl = 'https://api.truevault.com/v1/';
const candidateSchemaId = "714f661e-bb1b-4d4f-bda7-5e67272ec807";// candidateTestSchemaId = "405fac9b-37f6-4090-93cf-6d6b2c4a541b";
const sessionSchemaId = "bed02977-02c1-4831-a543-1b7e00d55909";
const MaxRequestOperation = 100;
const self = this;

/**
 * Return single document corresponding to documentId.
 * If not exist, returns an error.
 **
 * @param documentId
 * @returns {Promise}
 */
exports.getDocumentById = function (documentId) {
    return new Promise(function (resolve, reject) {
        let options = setRequestOptions('/documents/' + documentId);

        rp(options)
            .then( body => {
                // Decode response base64 document's data to utf8
                let utf8encodedDocument = (new Buffer(body, 'base64')).toString('utf8');
                let documentData = JSON.parse(utf8encodedDocument);
                resolve(documentData);
            })
            .catch(function (err) {
                reject(err);
            })
    });
};

/**
 * Return an object of documents corresponding to documentIdsArray
 *
 * @param documentIdsArray (aka @personalDataId field in candidate document)
 * @returns {Promise}
 */
exports.getDocumentsByIds = function (documentIdsArray) {
    return new Promise(function (resolve, reject) {
        let requestPromisesArray = [];

        // Split the request to max available number according to TrueVault documentation = 100 documents
        let operationIndex = 0;
        let slicedDocIdsArray = [];
        if(documentIdsArray.length < MaxRequestOperation) {
            slicedDocIdsArray.push(documentIdsArray);
        }
        else {
            while(operationIndex < documentIdsArray.length) {
                slicedDocIdsArray.push(documentIdsArray.slice(operationIndex, operationIndex + MaxRequestOperation));
                operationIndex += MaxRequestOperation;
            }
        }

        let singleDocId = undefined;
        for(let subArrayIndex = 0; subArrayIndex < slicedDocIdsArray.length; subArrayIndex++) {
            let optionsUrls = '/documents/';
            for (let documentsIndex = 0; documentsIndex < slicedDocIdsArray[subArrayIndex].length; documentsIndex++) {
                // in case of single doc request - initialize @singleDocId
                if(slicedDocIdsArray[subArrayIndex].length === 1) {
                    singleDocId = slicedDocIdsArray[subArrayIndex][documentsIndex];
                }
                // initiate url with a list of document id's
                optionsUrls += slicedDocIdsArray[subArrayIndex][documentsIndex];
                if(documentsIndex !== slicedDocIdsArray[subArrayIndex].length - 1) {
                    optionsUrls += ',';
                }
            }
            let options = setRequestOptions(optionsUrls);

            let requestPromise = rp(options)
                .then(body => {
                    // parse body
                    let documentsArray = [];
                    let documentHashMap = {}; // creating a hashMap object of key=>value pairs: 'docId':'docData'
                    // if request contains several docs id's, parse body
                    if (body.toString().indexOf('documents') !== -1) {
                        let encodedBody = (new Buffer(body, 'utf8'));
                        let responseBody = JSON.parse(encodedBody);

                        let documents = responseBody.documents;
                        // Built array of json object received from query
                        for (let index = 0; index < documents.length; index++) {
                            let utf8encoded = (new Buffer(documents[[index]].document, 'base64')).toString('utf8');
                            documentHashMap[documents[index].id] = JSON.parse(utf8encoded);
                        }

                        return documentHashMap;
                    }
                    else {
                        // case of single doc request, receives only the doc data
                        if(singleDocId) {
                            let utf8encoded = (new Buffer(body, 'base64')).toString('utf8');
                            documentHashMap[singleDocId] = JSON.parse(utf8encoded);
                            return documentHashMap;
                        }
                    }
                })
                .catch(function (err) {
                    reject(err);
                });

            requestPromisesArray.push(requestPromise);
        }

        Promise.all(requestPromisesArray)
            .then(arrayOfDocumentsArray => {
                let singleDocObj = {};

                while(arrayOfDocumentsArray.length > 0) {
                    let element = arrayOfDocumentsArray.shift();
                    for(var property in element) {
                        singleDocObj[property] = element[property];
                    }
                }
                resolve(singleDocObj);
            })
            .catch(err => {
                reject(err);
            })

    });
};

/**
 * Middleware for deciding if insert new candidate or update existing one according to input params
 *
 * @param candidateData
 * @param documentId -> OPTIONAL: defaults behavior - insert new candidate.
 * If @documentId specified updated corresponding document with input @candidateData
 * @returns {Promise} - updated/inserted document's Id
 */
exports.saveCandidate = function (candidateData, documentId) {
    return new Promise(function (resolve, reject) {
        if(!documentId) {
            insertDocument(candidateData, undefined, 'POST', candidateSchemaId)
                .then(documentId => {
                    resolve(documentId);
                })
                .catch(err => {
                    reject(err);
                });
        }
        else {
            insertDocument(candidateData, documentId, 'PUT', candidateSchemaId)
                .then(documentId => {
                    resolve(documentId);
                })
                .catch(err => {
                    reject(err);
                });
        }
    });
};

/**
 * Get user data from trueVault by @accessToken
 *
 * @param accessToken
 * @returns {Promise} - user data or server response if not succeeded
 */
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
            })
            .catch(function (err) {
                reject(err);
            })
    });
};

/**
 * Private method for setting request options
 *
 * @param url
 * @returns {{url: string, headers: {Authorization: string}}}
 */
function setRequestOptions(url) {
    let options = {
        url: dbUrl + url,
        headers: {
            'Authorization':'Basic ' + API_KEY + 'Og=='
        }
    };
    return options;
}

/**
 * Get session document data corresponding to @sessionId
 *
 * Helper method for Session Store Implementation
 *
 * @param sessionId
 * @returns {Promise} - session document data or null if not found
 */
exports.getSessionById = function (sessionId) {
    return new Promise(function (resolve, reject) {
        //let options = setRequestOptions('/documents/' + documentId);
        let searchTemplate = {
            "filter":{
                "sid":{
                    "type":"eq",
                    "value": sessionId
                }
            },
            "full_document": true,
            "schema_id": sessionSchemaId
        };

        // Encode @searchTemplate filter to base64
        let searchTemplateString = JSON.stringify(searchTemplate);
        let searchTemplateB64 = new Buffer(searchTemplateString).toString("base64");
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

        rp(options)
            .then(body => {
                let itemArray = JSON.parse(body);
                let responseDocumentData = itemArray['data']['documents'][0];
                if (itemArray && itemArray['data'] && responseDocumentData) {
                    // Document exists, encode and parse document data to JSON object
                    let utf8encodedDocument = (new Buffer(responseDocumentData['document'], 'base64')).toString('utf8');
                    let sessionDocument = {};
                    sessionDocument.data = JSON.parse(utf8encodedDocument);
                    sessionDocument.id = responseDocumentData['document_id'];

                    if (itemArray['result'] === 'success') {
                        resolve(sessionDocument);
                    }
                }
                else {
                    // Session not found: return null
                    resolve(null);
                }
            })
            .catch(function (err) {
                reject(err);
            })
    });
};

/**
 * Middleware for deciding if insert new session or update existing one according to input params
 *
 * Helper method for Session Store Implementation
 *
 * @param sessionData
 * @param sessionId -> OPTIONAL: defaults behavior - insert new session.
 * If @sessionId specified updated corresponding session document with input @sessionData
 * @returns {Promise} - updated/inserted session document's Id
 */
exports.saveSession = function (sessionData, sessionId) {
    return new Promise(function (resolve, reject) {
        if(sessionId) {
            self.getSessionById(sessionId)
                .then(sessionDocument => {
                    // session found update new session data with session documentId
                    if(sessionDocument) {
                        insertDocument(sessionData, sessionDocument.id, 'PUT', sessionSchemaId)
                            .then(sessionDocumentId => {
                                resolve(sessionDocumentId);
                            })
                            .catch(err => {
                                reject(err);
                            })
                    }
                    else {
                        reject("error: Couldn't get document data");
                    }
                })
                .catch(err => {
                    reject("error while update session to database; err: ", err);
                })
        }
        else {
            // create new session
            insertDocument(sessionData, undefined, 'POST', sessionSchemaId)
                .then(sessionDocumentId => {
                    resolve(sessionDocumentId);
                })
                .catch(err => {
                    reject(err);
                })
        }
    })
};

/**
 * Private method: Insert/update document data according to http @method
 *
 * @param sessionData - JSON object of document data
 * @param sessionDocumentId
 * @param method - HTTP; POST for insert, PUT for update
 * @returns {Promise} - document id.
 */
function insertDocument (documentData, documentId, method, schemaId) {
    return new Promise(function (resolve, reject) {
        // Encode @documentData to base64
        let docTemplateString = JSON.stringify(documentData);
        let docTemplateB64 = new Buffer(docTemplateString).toString("base64");

        let optionsUrl = '/documents';
        if(method === 'PUT' && documentId) {
            optionsUrl += '/' + documentId;
        }

        let options = setRequestOptions(optionsUrl);
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        options.form = {
            'document' : docTemplateB64,
            'schema_id': schemaId //
        };
        options.method = method;

        rp(options)
            .then( body => {
                let documentData = JSON.parse(body);
                if(documentData.result === 'success') {
                    resolve(documentData.document_id);
                }
                else {
                    reject("Couldn't save document data: " + documentData.result);
                }
            })
            .catch(function (err) {
                reject(err);
            })
    });
}

/**
 * Remove session by id
 *
 * Helper method for Session Store Implementation
 *
 * @param sessionId
 * @returns {Promise} - success msg or null if session not found
 */
exports.removeSessionById = function (sessionId) {
    return new Promise(function (resolve, reject) {
        self.getSessionById(sessionId)
            .then(sessionDocumentData => {
                if(sessionDocumentData) {
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
                }
                else {
                    resolve(null);
                }
            })
            .catch(err => {
                reject(err);
            })
    });
};

/**
 * Not in use: getSessionById callback implementation
 *
 * @param sessionID
 * @param callback
 */
function getDocumentIdBySessionId(sessionID, callback) {
    let searchTemplate = {
        "filter":{
            "sid":{
                "type":"eq",
                "value": sessionID
            }
        },
        "full_document": true,
        "schema_id": sessionSchemaId
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
            var itemArray = JSON.parse(body);
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

/**
 * TODO: set @asset to test expected output in all functions
 */
class TrueVaultAdapterSessionTests {
    constructor() {
        this.session = {
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
        this.trueVault = require('/controllers/truevault.server.controller');
    }

    getSessionById() {
        this.trueVault.getSessionById(this.session.sid)
            .then(res => {
                console.log("result from getting session: ", res);
            })
            .catch(err => {
                console.log("err while getting session: " , err);
            });
    }

    saveSessionUpdate() {
        this.trueVault.saveSession(this.session, this.session.sid)
            .then(res => {
                console.log("result from saving session: ", res);
            })
            .catch(err => {
                console.log("err while saveing session: ", err);
            });
    }

    saveSessionInsert() {
        this.trueVault.saveSession(this.session)
            .then(res => {
                console.log("result from saving session: ", res);
            })
            .catch(err => {
                console.log("err while saveing session: ", err);
            });
    }

    removeSessionById() {
        this.trueVault.removeSessionById(this.session.sid)
            .then(res => {
                console.log("session removed successfully : ", res);
            })
            .catch(err => {
                console.log("unable to remve session: ", err);
            });
    }

    /**
     * Currently not in use - function is private
     */
    /*
    getSessionByIdCallBack() {
        this.trueVault.getDocumentIdBySessionId(this.session.sid, function (sessionDocument) {
            console.log("cb doc: ", sessionDocument);
        });
    }*/


}

/**
 * TODO: set @asset to test expected output in all functions
 */
class TrueVaultAdapterDocumentTests {
    constructor() {
        this.docTemplate = {
            'name': "updated candidate new 5 again"
        };
        this.trueVault = require('/controllers/truevault.server.controller');
        this.documentIdsArray = [
            '310559c4-65af-48bf-a82d-89d649c57266',
            'cc465b3b-4d70-4e41-b59a-43ebddbde8bc',
            '8bf3aa01-11c3-4e23-a684-6a15a194957e'
        ];
    }

    findAllCaseWithOneDocId() {
        this.trueVault.findAll('310559c4-65af-48bf-a82d-89d649c57266')
            .then(document => {
                console.log("result: ", document);
            })
            .catch(err => {
                console.log("catch ", err);
            });
    }

    findAll() {
        this.trueVault.findAll(this.documentIdsArray)
            .then(document => {
                console.log("result: ", document);
            })
            .catch(err => {
                console.log("catch ", err);
            });
    }

    findOne() {
        this.trueVault.findOne('9702a198-948c-4b07-abe6-da39ee6f9b2d')
            .then(document => {
                console.log("result: ", document);
            })
            .catch(err => {
                console.log("catch ", err);
            });
    }

    saveCandidateUpdate() {
        this.trueVault.saveCandidate(this.docTemplate,'9702a198-948c-4b07-abe6-da39ee6f9b2d')
            .then(document => {
                console.log("result: ", document);
            })
            .catch(err => {
                console.log("catch ", err);
            });
    }

    saveCandidateInsert() {
        this.trueVault.saveCandidate(this.docTemplate)
            .then(document => {
                console.log("result: ", document);
            })
            .catch(err => {
                console.log("catch ", err);
            });
    }
}

/**
 * Empty function currently
 * TODO: decide if need to implement
 *
 * Request details: POST /v1/vaults/(string: vault_id)/schemas - creates new schema in the specified vault.
 * @param vaultId
 */
function insertSchema(vaultId) {

}

/**
 * Not in use: Return a schemaId (collectionId) by name
 *
 * @param name
 * @param callback
 */
function getSchemaIdByName(name, callback) {
    let options = {
        url: 'https://api.truevault.com/v1/vaults/' + vaultId + '/schemas',
        headers: {
            'Authorization':'Basic MjA3ZGE0MzktMzAxYy00OGJiLTkxYmYtMmE3MmQ0OThkZmVmOg=='
        }
    };

    request(options, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            let itemArray = JSON.parse(body);
            if(itemArray['result'] === 'success') {
                for (let itemIndex = 0; itemIndex < itemArray['schemas'].length; itemIndex++) {
                    if(itemArray['schemas'][itemIndex]['name'] === name) {
                        callback(itemArray['schemas'][itemIndex]['id']);
                    }
                }
            }
        }
        else {
            // TODO: handle error
        }
    });
}
