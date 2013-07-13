Anatomy of an app
=================

app is a module identified by it's String.

It should handle at leats a function init

(options,cb)


and may handle a function mapUrls
(app, cb)

Example :

    exports.init = function(options,cb) {...};
    
    exports.mapUrls = function(app,cb) {...};

or you may use the bootweb.App object as an helper to instanciate an App.

Example :

    var bootweb = require('bootweb'),   
        sample_app = new bootweb.App();
    
    sample_app.init = function(options,cb) {...};
    
    sample_app.mapUrls = function(app,cb) {...};


How to load an app
------------------

in the bootweb.init callback of your server, just add :

    bootweb.appsRegistry.loadApp(appName,appModule,appConfig);

appConfig param will be injected in app init() at apps init stage.

Access startup config for your app in config.json
-------------------------------------------------

You may access conf values stored in conf/config.json file using bootweb shortcut to nconf :

    var conf = require('bootweb').conf;
    exports.init = function(options,cb) {
        var host = conf.get("server:host");
        return cb();
    };

AppServer lifeCycle and how your App comes to life
--------------------------------------------------

Here is a minimal implementation of appserver which loads a single application :

    var bootweb = require("bootweb");
    bootweb.init(__dirname, function(app, cb){ // the init callback
      var sample_app = require('./sample_app'),
        config = {
          "prefix": "/"
        };
      bootweb.appsRegistry.loadApp("sample_app",sample_app,config);
        cb();
    });

Here we load the sample app to the registry.

*The cb() call at the end of our callback is mandatory, bottweb will not start otherwise*

components initialization