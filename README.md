# TrueVault-SessionStore

TrueVault SessionStore controller implements a basic session store for Connect/Express with trueVault service which will replace
the default express-session MemoryStore that is not compatible with production environment.

### Dependencies
Requires the truevault-adapter module

## Example:

```javascript
const express = require('express');
const router = express.Router();
const session = require('express-session');
const TrueVaultStore = require('../controllers/sessionStore.server.controller')(session);

let options = {}; // See available options below

router.use(session({
        secret: 'some secret',
        store: new TrueVaultStore(options),
        resave: false,
        saveUninitialized: false
    })
);
```

### Options

Available parameters:

-	`autosave` Set `false` to disable save to disk. Defaults to `true`
- `ttl` Duration in seconds to keep stale sessions. Set to `0` to disable TTL. Defaults to `86400` (one day)

