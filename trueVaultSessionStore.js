'use strict';
/**
 * trueVaultSessionStore implements a basic session store for Connect/Express with trueVault service which will replace
 * the default express-session MemoryStore that is not compatible with production environment.
 */

var util = require('util');
const trueVault_Ctrl = require('truevault-adapter');
const noop = () => {}; // defining not an object

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

    let Store = session.Store;

    /**
     * Initialize TrueVaultStore with the given `options`.
     *
     * @param {Object} options
     * @api public
     */

    function TrueVaultStore (options) {
        if (!(this instanceof TrueVaultStore)) {
            throw new TypeError('Cannot call TrueVaultStore constructor as a function');
        }

        options = options || {};
        Store.call(this, options);

        this.authHeader = options.authHeader || '';
        this.ttl = options.ttl || 86400;// = one day
        if (this.ttl === 0) { this.ttl = null }

        this.client = trueVault_Ctrl;
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
            fn = noop;
        }

        let _this = this;

        this.client.getSessionById(sid)
            .then(sessionDocument => {

                let currDate = new Date();
                let lastUpdate = new Date(sessionDocument.data.updatedAt);
                let ttlMilliseconds = _this.ttl * 1000;

                if(sessionDocument && sessionDocument.data && sessionDocument.data.content
                  && currDate < lastUpdate.getTime() + ttlMilliseconds) {
                    console.log("session store get: " +
                        "sid found and up to date content: ", sessionDocument.data.content);
                    fn(null, sessionDocument.data.content);
                }
                else {
                    console.log("session store get: " +
                        "sid not exists or not up to date - remove session: ", sid);
                    this.destroy(sid, fn);
                }
            })
            .catch(err => {
                console.log("session store get: didn't " +
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
        if (!fn) {
            fn = noop;
        }

        // upsert - check if session exists in Session collection, if it is, update with new fields
        // else insert new session to the collection.
        this.client.getSessionById(sid)
            .then(sessionDocument => {
                let currDate = new Date();
                // Session found - update session with sess and with current date.
                console.log("session store set: " +
                    "session data found: ", sessionDocument);
                if(sessionDocument !== null) {
                    sessionDocument.data.content = sess;
                    sessionDocument.data.updatedAt = currDate;
                    this.client.saveSession(sessionDocument.data, sid)
                        .then(sessionDocumentId => {
                            console.log("session store, set: " +
                                "updated session ", sessionDocumentId);
                            fn(null);
                        })
                        .catch(err => {
                            console.log("session store, set: " +
                                "unable updating session %s err: %s", sid, err);
                            fn(null);
                        });
                }
                else {
                    // Session doesnt exists save new session with sid - for search use
                    console.log("session store, set: " +
                        "session doesn't exists : ", sid);

                    let newSession = {
                        sid: sid,
                        content: sess,
                        updatedAt: currDate
                    };
                    this.client.saveSession(newSession)
                        .then(sessionDocumentId => {
                            this.client.sessionDocumentId = sessionDocumentId;
                            console.log("session store, set: " +
                                "Saved new session: ", sid);
                            fn(null);
                        })
                        .catch(err => {
                            console.log("session store, set: " +
                                "error while saving new session to database; err: ", err);
                            fn(null);
                        })
                }
            })
            .catch(err => {
                console.log("session store, set: " +
                    "error while insert/update session : ", sid);
            });
    };

    /**
     * Destroy the session associated with the given `sid`.
     *
     * @param {String} sid
     * @api public
     */

    TrueVaultStore.prototype.destroy = function (sid, fn) {
        if (!fn) {
            fn = noop;
        }

        this.client.removeSessionById(sid)
            .then(response => {
                if(response) {
                    console.log("session store, destroy: " +
                        "Removed session, sid: " + sid + " response: " + response);

                }
                console.log("session store, destroy: " +
                    "session was not found , didn't do anything, sid: ", sid);
                fn(null);
            })
            .catch(err => {
                console.log("session store, destroy: error;", err);
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
        if (!fn) {
            fn = noop;
        }

        // find session document and update the time.
        this.client.getSessionById(sid)
            .then(sessionDocument => {
                sessionDocument.data.updatedAt = new Date();
               this.client.saveSession(sessionDocument.data, sid)
                   .then(sessionDocumentId => {
                       console.log("session store, touch: " +
                           "Updated session date, sid: ", sessionDocumentId);
                   })
                   .catch(err => {
                       console.log("session store, touch: " +
                           "Unable to update session date, sid: ", sid);
                   });
                return fn();
            })
            .catch(err => {
                console.log("session store, touch: " +
                    "Unable to find session %s at Session collection, err: %s", sid, err);
                return fn();
            });
    };

    return TrueVaultStore;
};