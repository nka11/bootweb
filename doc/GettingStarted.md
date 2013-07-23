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

This is an expressjs app object, it means you can write in the init callback function scope :

      app.get("a/server/path", function(req,res,next) {
        res.send("GET OK");
      });
      app.post("a/server/path", function(req,res,next) {
        res.send("POST OK");
      });

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


And after the require (back in init function, you can now invoke the registered model :

    var Sample = conn.model('Sample'); // Grabs a model object described in model.js :

This is a data access object, from this object you can either :

 * select an existing record
 * modify a record
 * instanciate a new record

Follow the mongoose guide to jump in some nice features : http://mongoosejs.com/docs/guide.html


# Render data with swig templates


