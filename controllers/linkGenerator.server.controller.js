//******* linkGenerator *******
// Handles generation of goo.gl short URLs
//*****************************
var GoogleUrl = require('google-url');  //goo.gl URL generation package with callbacks
var goorl = require('goorl'); // goo.gl URL generation package with promises

googleUrl = new GoogleUrl( { key: 'AIzaSyAOKuZalTeNBoetXdEz_on81E5vcjxarVU' });
const options = {
    key: 'AIzaSyAOKuZalTeNBoetXdEz_on81E5vcjxarVU'
};

generateLink = function (link, callback) {
    // Call goo.gl to generate a short URL for us
    googleUrl.shorten(link , function( err, shortUrl ) {
        // shortUrl should be http://goo.gl/BzpZ54
        // We get here after the URL is generated or if there's an error
        console.log("%s.%s:%s -", __file, __ext, __line, "Short URL: ", shortUrl);
        // @@@ For now throw an exception but need to handle this better
        if(err) {
            callback(null);
            return;
        }
        // Notify the caller that the URL is ready
        callback(shortUrl);
    } );
};

generateLinkProm = function(longUrl) {
    // Setup the URL in the options
    options.url = longUrl;
    console.log("%s.%s:%s -", __file, __ext, __line, options);

    return goorl(options);
}

module.exports = generateLink, generateLinkProm;