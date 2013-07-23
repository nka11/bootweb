Bootweb Application Server quickstart
-------------------------------------

In order to start any webserver, you need some basic code to make a service
listen on a port and answer to requests.

Bootweb handles many aspects of a webserver (HTTP Server) and comes with a buitin authentication and ACL system.

This assumes you have created some directory structure to host the resources of your server.

Lets look at ../samples/standard for a basic server instance. For directories, only config is mandatory
but created and filled with defaults at server startup

For files, you'll need at least a .js file, the sample's one is called server.js.

It contains a minimal implementation of appserver which loads a single application :

    var bootweb = require("bootweb");
    bootweb.init(__dirname, function(app, cb){ // the "init callback function"
      // do something after bootweb components loading but before their initialization
      
      cb();
    });

It takes at first parameter the server home working dir. This code assumes you have at
least your js file a config/config.json in the same directory.

bootweb.init loads config from file then loads bootweb main components
(loggers, express, db client but not the connexions, it's appsRegistry, etc..),
then it calls "the init callback function".

*The cb() call at the end of our callback is mandatory, bootweb will not end initialize otherwise*

When cb is called, bootweb end initialization and start the services.

when all components are initialised, bootweb emits a 'ready' event. It means we have
access to the whole API, and any third party service we may be connecting to, especially
the database backend.

