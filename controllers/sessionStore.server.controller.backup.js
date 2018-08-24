'use strict';
/**
 * This is a controller for implementing a session store with trueVault which will replace
 * the default express-session MemoryStore that is not compatible with production.
 */

var util = require('util');
const trueVault_Ctrl = require('../controllers/truevault.server.controller');
const noop = () => {};

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

    var Store = session.Store;

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

        console.log("%s.%s:%s -", __file, __ext, __line, "TrueVaultStore constructor: input options; ", options);
        var self = this;

        options = options || {};
        Store.call(this, options);

        // Set TrueVaultStore object (this) params
        // =============REPLACE================
        this.autosave = true;//options.autosave !== false;
        this.authHeader = options.authHeader || ''; // set here access token
        //this.storePath = dbUrl;//options.path || './session-store.db'
        this.ttl = options.ttl || 1209600;
        if (this.ttl === 0) { this.ttl = null }
        // =============REPLACE================

        // =============REPLACE================ IMPORTANT
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

        // TODO: decide if implement: if collection is not exist create new one, if exists connect.
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
        if (!fn) { // safety
            fn = noop
        }

        this.client.getSessionById(sid)
            .then(sessionDocument => {
                if(sessionDocument && sessionDocument.data && sessionDocument.data.content
                  /*&& new Date < sessionDocument.data.updatedAt*/) {
                    console.log("%s.%s:%s -", __file, __ext, __line, "session store get: " +
                        "sid found and up to date content: ", sessionDocument.data.content);
                    fn(null, sessionDocument.data.content);
                }
                else {
                    console.log("%s.%s:%s -", __file, __ext, __line, "session store get: " +
                        "sid not exists or not up tp date - remove session: ", sid);
                    this.destroy(sid, fn);
                }
            })
            .catch(err => {
                console.log("%s.%s:%s -", __file, __ext, __line, "session store get: didn't " +
                    "manage to get session! err: ", err);
                fn(null);
            })
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
            fn = noop;
        }

        // upsert - check if session exists in Session collection, if it is, update with new fields
        // else insert new session to the collection.
        this.client.getSessionById(sid)
            .then(sessionDocument => {
                // Session found - update session with sess and with current date.
                console.log("%s.%s:%s -", __file, __ext, __line, "session store set: " +
                    "session data found: ", sessionDocument);
                if(sessionDocument != null) {
                    sessionDocument.data.content = sess;
                    sessionDocument.data.updatedAt = new Date();
                    this.client.saveSession(sessionDocument.data, sid)
                        .then(sessionDocumentId => {
                            console.log("%s.%s:%s -", __file, __ext, __line, "session store, set: " +
                                "updated session ", sessionDocumentId);
                            fn(null);
                        })
                        .catch(err => {
                            console.log("%s.%s:%s -", __file, __ext, __line, "session store, set: " +
                                "unable updating session %s err: %s", sid, err);
                            fn(null);
                        });
                }
                else {
                    // Session doesnt exists save new session with sid - for search use
                    console.log("%s.%s:%s -", __file, __ext, __line, "session store, set: " +
                        "session doesn't exists : ", sid);
                    var newSession = {
                        sid: sid,
                        content: sess,
                        updatedAt: new Date()
                    };
                    this.client.saveSession(newSession)
                        .then(sessionDocumentId => {
                            this.client.sessionDocumentId = sessionDocumentId;
                            console.log("%s.%s:%s -", __file, __ext, __line, "session store, set: " +
                                "Saved new session: ", sid);
                            fn(null);
                        })
                        .catch(err => {
                            console.log("%s.%s:%s -", __file, __ext, __line, "session store, set: " +
                                "error while saving new session to database; err: ", err);
                            fn(null);
                        })
                }
            })
            .catch(err => {
                console.log("%s.%s:%s -", __file, __ext, __line, "session store, set: " +
                    "error while insert/update session : ", sid);
                /*// Session doesnt exists save new session with sid - for search use
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
                    })*/
            });
    };

    /**
     * Destroy the session associated with the given `sid`.
     *
     * @param {String} sid
     * @api public
     */

    TrueVaultStore.prototype.destroy = function (sid, fn) {
        if (!fn) { fn = noop } //safety

        this.client.removeSessionById(sid)
            .then(response => {
                if(response) {
                    console.log("%s.%s:%s -", __file, __ext, __line, "session store, destroy: " +
                        "Removed session, sid:%s response:%s ", sid, response);

                }
                console.log("%s.%s:%s -", __file, __ext, __line, "session store, destroy: " +
                    "session was not found , didn't do anything, sid: ", sid);
                fn(null);
            })
            .catch(err => {
                console.log("%s.%s:%s -", __file, __ext, __line, err);
                fn(null);
            });
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
        this.client.getSessionById(sid)
            .then(sessionDocument => {
                sessionDocument.data.updatedAt = new Date();
               this.client.saveSession(sessionDocument.data, sid)
                   .then(sessionDocumentId => {
                       console.log("%s.%s:%s -", __file, __ext, __line, "session store, touch: " +
                           "Updated session date, sid: ", sessionDocumentId);
                   })
                   .catch(err => {
                       console.log("%s.%s:%s -", __file, __ext, __line, "session store, touch: " +
                           "Unable to update session date, sid: ", sid);
                   })
                return fn();
            })
            .catch(err => {
                console.log("%s.%s:%s -", __file, __ext, __line, "session store, touch: " +
                    "Unable to find session %s at Session collection, err: %s", sid, err);
                return fn();
            });
    };

    return TrueVaultStore;
};