var GoogleUrl = require('google-url');

googleUrl = new GoogleUrl( { key: 'AIzaSyAOKuZalTeNBoetXdEz_on81E5vcjxarVU' });

generateLink = function (link, callback) {
    googleUrl.shorten(link , function( err, shortUrl ) {
        // shortUrl should be http://goo.gl/BzpZ54
        if(err) throw err;
        callback(shortUrl);
    } );
};

module.exports = generateLink;