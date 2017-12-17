'use strict';
/**
 * This is a controller for implementing a session store with trueVault which will replace
 * the default express-session MemoryStore that is not compatible with production.
 */

//var debug = require('debug');//('connect:redis');
//var redis = require('redis'); //replace with TrueVaultClient
var util = require('util');
const trueVault_Ctrl = require('../controllers/truevault.server.controller');
const noop = () => {};
const API_KEY = "MjA3ZGE0MzktMzAxYy00OGJiLTkxYmYtMmE3MmQ0OThkZmVm"; // base64 encoded
const vaultId = '987b3d71-6e6a-4fef-88af-1a1df582dc08'; // db id - EmpiricalHire
const dbUrl = 'https://api.truevault.com/v1/vaults/' + vaultId;

/**
 * One day in seconds.
 */

var oneDay = 86400;
/* not in use at the moment
function getTTL(store, sess, sid) {
    console.log("getTTL called!! params: store:%s , sess:%s , sid:%s ", store, sess, sid);
    if (typeof store.ttl === 'number' || typeof store.ttl === 'string') return store.ttl;
    if (typeof store.ttl === 'function') return store.ttl(store, sess, sid);
    if (store.ttl) throw new TypeError('`store.ttl` must be a number or function.');

    var maxAge = sess.cookie.maxAge;
    return (typeof maxAge === 'number'
        ? Math.floor(maxAge / 1000)
        : oneDay);
}
*/
/**
 * Return the `TrueVaultStore` extending `express`'s session Store.
 *
 * @param {object} express session
 * @return {Function}
 * @api public
 */

module.exports = function (session) {

    /**
     * Express's session Store.
     */

    //console.log("session Store session object: ", session);
    var Store = session.Store;
    console.log("session Store object: ", Store);

    /**
     * Initialize TrueVaultStore with the given `options`.
     *
     * @param {Object} options
     * @api public
     */

    /**
     Session {
        cookie: {
            path: '/',
            _expires: null,
            originalMaxAge: null,
            httpOnly: true
            }
        }
     */
    // TODO: change entire function support for TrueVault Client options - authHeader, hold and fetch user personal data
    function TrueVaultStore (options) {
        if (!(this instanceof TrueVaultStore)) {
            throw new TypeError('Cannot call TrueVaultStore constructor as a function');
        }

        console.log("TrueVaultStore constructor: input options; ", options);
        var self = this;

        options = options || {};
        Store.call(this, options);

        // Set TrueVaultStore object (this) params
        // =============REPLACE================
        this.autosave = true;//options.autosave !== false;
        this.authHeader = options.authHeader || ''; // set here access token
        this.storePath = dbUrl;//options.path || './session-store.db'
        this.ttl = options.ttl || 1209600;
        if (this.ttl === 0) { this.ttl = null }
        // =============REPLACE================
        // Initialize Loki.js

        // =============REPLACE================ IMPORTANT
        // TODO: initiate new tureVault object with the session collection id, api key, schemaId etc'
        this.client = trueVault_Ctrl; // Initiate trueVault obj with params??
        /*new Loki(this.storePath, {
            env: 'NODEJS',
            autosave: self.autosave,
            autosaveInterval: 5000
        })*/
        // =============REPLACE================
        // Setup error logging

        // Set logErrors - not a must
        // =============REPLACE================
        if (options.logErrors) {
            if (typeof options.logErrors !== 'function') {
                options.logErrors = function (err) {
                    console.error('Warning: connect-loki reported a client error: ' + err)
                }
            }
            this.logger = options.logErrors
        } else {
            this.logger = noop
        }
        // =============REPLACE================

        // Get / Create collection
        //self.emit('connect');
        // if collection is not exist create new one, if exists connect
        // TODO: create a request to vault and check if schema exist if success emit connect event else return error.
        // =============REPLACE================ IMPORTANT
        /*this.client.getUser("MjA3ZGE0MzktMzAxYy00OGJiLTkxYmYtMmE3MmQ0OThkZmVm")
            .then(user => {
                if(user.status === 'ACTIVATED') {
                    console.log("%s.%s:%s -", __file, __ext, __line, "session store, user is active");
                }
                self.emit('connect');
            })
            .catch(err => {
                return self.logger(err);
            })*/
        /*loadDatabase({}, () => {
            self.collection = self.client.getCollection('Sessions')
            if (_.isNil(self.collection)) {
                self.collection = self.client.addCollection('Sessions', {
                    indices: ['sid'],
                    ttlInterval: self.ttl
                })
            }
            self.collection.on('error', (err) => {
                return self.logger(err)
            })
            self.emit('connect')
        })*/
        // =============REPLACE================
    }

    /**
     * Inherit from `Store`.
     */

    util.inherits(TrueVaultStore, Store);

    /**
     * Attempt to fetch session by the given `sid`.
     *
     * @param {String} sid
     * @param {Function} fn
     * @api public
     */

    TrueVaultStore.prototype.get = function (sid, fn) {

        if (!fn) {
            console.log("%s.%s:%s -", __file, __ext, __line, "get sid: ", sid);
            fn = noop
        } // safety
        console.log("%s.%s:%s -", __file, __ext, __line, "get sid: ", sid);
        // get session document by session id
        // =============REPLACE================
        //var s =
            this.client.getSessionById(sid)
            .then(sessionDocument => {

                //return sessionData;
                if(sessionDocument && sessionDocument.data && sessionDocument.data.content) {
                    console.log("%s.%s:%s -", __file, __ext, __line, "get, sid content: ", sessionDocument.data.content);
                    fn(null, sessionDocument.data.content);
                }
                else {
                    console.log("%s.%s:%s -", __file, __ext, __line, "get, sid not exists: ", sid);
                    fn(null);
                    //this.destroy(sid, fn);
                }
                 // might return sessionData.content and not all document
            })
            .catch(err => {
                console.log("%s.%s:%s -", __file, __ext, __line, "didn't manage to get session!!!!!!!!!!!!!!!!!!!!!");
                console.log("%s.%s:%s -", __file, __ext, __line, err);
                fn(null);
            })
        //console.log("%s.%s:%s -", __file, __ext, __line, "get: s returned value: ", s);
        /*if(s && s.content) {
            fn(null, s.content);
        }
        else {
            fn(null);
        }*/
/*
MongoDBStore.prototype.get = function(id, callback) {


    this.db.collection(this.options.collection).
      findOne(this._generateQuery(id), function(error, session) {
        if (error) {
          var e = new Error('Error finding ' + id + ': ' + error.message);
          return _this._errorHandler(e, callback);
        } else if (session) {
          if (!session.expires || new Date < session.expires) {
            return callback(null, session.session);
          } else {
            return _this.destroy(id, callback);
          }
        } else {
          return callback();
        }
      });
  };
 */

        /*let s = this.collection.find({ sid })
        if (s[0] && s[0].content) {
            fn(null, s[0].content)
        } else {
            fn(null)
        }*/
        // =============REPLACE================
    };

    /**
     * Commit the given `sess` object associated with the given `sid`.
     *
     * @param {String} sid
     * @param {Session} sess
     * @param {Function} fn
     * @api public
     */

    TrueVaultStore.prototype.set = function (sid, sess, fn) {
        // if fn is not a function assign not an object to avoid exceptions
        if (!fn) {
            console.log("%s.%s:%s -", __file, __ext, __line, "set sid: ", sid);
            fn = noop;
        }

        // upsert - check if session exists in Session collection, if it is update with new fields
        // else insert new session to the collection.
        // =============REPLACE================
        console.log("%s.%s:%s -", __file, __ext, __line, "set sid: ", sid);
        this.client.getSessionById(sid)
            .then(sessionDocument => {
                // Session found - update session with sess and with current date.
                console.log("%s.%s:%s -", __file, __ext, __line, "set session data  found: ", sessionDocument);
                if(sessionDocument != null) {
                    sessionDocument.data.content = sess;
                    sessionDocument.data.updatedAt = new Date();
                    this.client.saveSession(sessionDocument.data, sid)
                        .then(sessionDocumentId => {
                            console.log("%s.%s:%s -", __file, __ext, __line, "Updated session ", sessionDocumentId);
                            fn(null);
                            //fn()
                        })
                        .catch(err => {
                            console.log("%s.%s:%s -", __file, __ext, __line, "Unable updating session %s err: %s", sid, err);
                            fn(null);
                            //fn()
                        });
                }
                else {
                    var newSession = {
                        sid: sid,
                        content: sess,
                        updatedAt: new Date()
                    };
                    this.client.saveSession(newSession)
                        .then(sessionDocumentId => {
                            this.client.sessionDocumentId = sessionDocumentId;
                            console.log("%s.%s:%s -", __file, __ext, __line, "Saved session: ", sid);
                            fn(null);
                            //fn()
                        })
                        .catch(err => {
                            console.log("%s.%s:%s -", __file, __ext, __line, "error while saving new session to database; err: ", err);
                            fn(null);
                            //fn()
                        })
                }

            })
            .catch(err => {
                // Session doesnt exists save new session with sid - for search use
                console.log("%s.%s:%s -", __file, __ext, __line, "set session Session doesnt exists : ", sid);
                var newSession = {
                    sid: sid,
                    content: sess,
                    updatedAt: new Date()
                };
                this.client.saveSession(newSession)
                    .then(sessionDocumentId => {
                        this.client.sessionDocumentId = sessionDocumentId;
                        console.log("%s.%s:%s -", __file, __ext, __line, "Saved session: ", sid);
                        fn(null);
                        //fn()
                    })
                    .catch(err => {
                        console.log("%s.%s:%s -", __file, __ext, __line, "error while saving new session to database; err: ", err);
                        fn(null);
                        //fn()
                    })
            });
        /*let s = this.collection.find({ sid })
        if (s[0] && s[0].content) {
            s[0].content = sess
            s[0].updatedAt = new Date()
            this.collection.update(s[0])
        } else {
            this.collection.insert({
                sid,
                content: sess,
                updatedAt: new Date()
            })
        }*/
        // =============REPLACE================
        //fn(null)
    };

    /**
     * Destroy the session associated with the given `sid`.
     *
     * @param {String} sid
     * @api public
     */

    TrueVaultStore.prototype.destroy = function (sid, fn) {
        if (!fn) { fn = noop } //safety

        // Remove session document from Session collection
        // =============REPLACE================
        this.client.removeSessionById(sid)
            .then(response => {
                console.log("%s.%s:%s -", __file, __ext, __line, response);
                fn(null);
            })
            .catch(err => {
                console.log("%s.%s:%s -", __file, __ext, __line, err);
                fn(null);
            });

        // =============REPLACE================
        //fn(null)
    };

    /**
     * Refresh the time-to-live for the session with the given `sid`.
     *
     * @param {String} sid
     * @param {Session} sess
     * @param {Function} fn
     * @api public
     */

    TrueVaultStore.prototype.touch = function (sid, sess, fn) {
        if (!fn) { fn = noop } // safety

        // find session document and update the time.
        // =============REPLACE================
        this.client.getSessionById(sid)
            .then(sessionDocument => {
                sessionDocument.data.updatedAt = new Date();
               this.client.saveSession(sessionDocument.data, sid)
                   .then(sessionDocumentId => {
                       console.log("%s.%s:%s -", __file, __ext, __line, "Updated session %s date: ", sessionDocumentId);
                   })
                   .catch(err => {
                       console.log("%s.%s:%s -", __file, __ext, __line, "Unable to update session %s date: ", sid);
                   })
                return fn();
            })
            .catch(err => {
                console.log("%s.%s:%s -", __file, __ext, __line, "Unable to find session %s at Session collection: %s", sid, err);
                return fn();
            });
        /*let s = this.collection.find({ sid })
        if (s[0] && s[0].updatedAt) {
            s[0].updatedAt = new Date()
            this.collection.update(s[0])
        }
        // =============REPLACE================
        return fn()*/
    };

    return TrueVaultStore;
};

    /**
     * Uses of this module with express-session
     *
     var session = require('express-session');
     var RedisStore = require('connect-redis')(session);

     app.use(session({
        store: new TrueVaultStore(options), // TODO: receives an access token to connect to trueVault
        secret: 'keyboard cat',
        resave: false
     }));
     */
//