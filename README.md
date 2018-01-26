# TrueVault-SessionStore

TrueVault SessionStore controller implements a basic session store with trueVault service which will replace
the default express-session MemoryStore that is not compatible with production environment.

### Dependencies
Requires the truevault-adapter module

## Example:

```javascript
const express = require('express');
const router = express.Router();
const session = require('express-session');
const TrueVaultStore = require('../controllers/sessionStore.server.controller')(session);

router.use(session({
        secret: 'some secret',
        store: new TrueVaultStore({}),
        resave: false,
        saveUninitialized: false
    })
);
```
