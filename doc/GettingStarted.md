Bootweb Starting Guide


Quick simple appserver handling simple HTTP requests :

# Create a simple server

See quick server guide at : https://github.com/nka11/bootweb/blob/master/doc/AppServer.md

    var bootweb = require("bootweb");
    bootweb.init(__dirname, function(app, cb){ // the "init callback function"
      // do something after bootweb components loading but before their initialization
      
      cb();
    });

The init callback function is called by bootweb with the app parameter.

# Handling HTTP actions

This is an expressjs app object, it means you can write in the init callback function scope :

      app.get("/a/path", function(req,res,next) {
        res.send("GET OK");
      });
      app.post("/a/path", function(req,res,next) {
        res.send("POST OK");
      });

This code shows two HTTP http action handlers for both `GET` and `POST` HTTP requests on the specific url `/a/path`.

The express guide explains quickly what an express app object is, and how it is initialized.
http://expressjs.com/guide.html - NOTE : bootweb handles all the initialization process. the app
object comes "ready to use".

Other useful information can be found in the expressjs API : http://expressjs.com/api.html

# Store data to mongodb

The default persistence layer which comes already configured with bootweb is mongoose which maps
objects to the non-relational database MongoDB. MongoDB uses JSON as default format, it makes it ideal to work with javascript.

As for express, mongoose comes also already configured, we may include in the init() the following example.
    
    conn = bootweb.getConnection(); // Gets the connexion object
    // the object mapping is described in a model.js file
    require("./model"); // make this call once for all the models
  

Of course, you must create a model.js file next to server.js :

    var bootweb = require("bootweb"),
      fs = require("fs"),
      logger = bootweb.getLogger('Sample'),
      Schema = bootweb.mongoose.Schema,
      ObjectId = Schema.ObjectId,
      Sample = new Schema({
        name: {
          type: String,
          required: true,
          index: {
            sparse: true
          }
        },
        description: {
          type: String
        }
      });
      
    bootweb.mongoose.model('Sample', Sample); // register the sample model


And after the require (back in init function of server.js, you can now invoke the registered model :

    var Sample = conn.model('Sample'); // Grabs a model object described in model.js :

This is a data access object, from this object you can either :

 * select an existing record
 * modify a record
 * instanciate a new record

Follow the mongoose guide to jump in some nice features : http://mongoosejs.com/docs/guide.html


# Render data with swig templates

*Web Basics*

Bootweb renders HTML via the swig template engine. In the sample server, the folder
`resources/templates` is considered as the default folder.

The view generation is usually invoked from the HTTP handler (see *Handling HTTP actions*) :

      app.get("/a/path", function(req,res,next) {
        res.render('home.html', {user: req.user});
      });

This uses the default express handler, which is linked to swig. This limit some
advanced path resolution features of swig, an alternate implementation may use :

      app.get("/a/path", function(req,res,next) {
        res.send(bootweb.swig.compileFile("").render({user: req.user}));
      });

Browse the swig doc to learn more about it and templates syntax : http://paularmstrong.github.io/swig/docs/

*Dynamic web and API : AJAX and JSON* 

expressjs can easily handle JSON or XML requests, see it's documentation for more details.

# Error rendering


You can render error, whatever the requested type. if request comes with `Accept: 'text/html'` or similar header,
bootweb renders the error in a file located at : `resources/templates/error/<errNo>.html`. If the request's accept header
asks for some json data ( `application/json` ) bootweb returns a json object response.

Just type this single line in an HTTP handler :

        return bootweb.renderError(req,res,{err: err,code: 500}); 
