Anatomy of an app
=================

app is a module identified by it's String.

It should handle at leats a function init

(options,cb)


and may handle a function mapUrls
(app, cb)

Example :

    exports.init = function(options,cb) {};
    
    exports.mapUrls = function(app,cb) {};



How to load an app
------------------

in the bootweb.init callback of your server, just add :

    bootweb.appsRegistry.loadApp(appName,appModule,appConfig);

appConfig param will be injected in app init() at apps init stage.

Access startup config for your app in config.json
-------------------------------------------------

You can access conf in config.json file using nconf api :

    var nconf = require('nconf');
    exports.init = function(options,cb) {
        var host = nconf.get("server:host");
        return cb();
    };
    