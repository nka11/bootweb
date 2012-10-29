Anatomy of an app
=================

app is a module identified by it's String.

It should handle at leats a function init

(app)


and may handle a function mapUrls
(app, cb)

Example :

    exports.init = function(cb) {};
    
    exports.mapUrls = function(app,cb) {};



How to load an app
------------------

reference the module in config.json

Access startup config for your app in config.json
-------------------------------------------------

You can access conf in config.json file using nconf api :

    var nconf = require('nconf');
    exports.init = function(cb) {
        var host = nconf.get("server:host");
        return cb();
    };
    