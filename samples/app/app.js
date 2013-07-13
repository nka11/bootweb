/*

sample_app - sample app used as template in generator
Copyright (C) $year Nicolas Karageuzian

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

*/
var bootweb = require('bootweb'), // import the bootweb library
  path = require("path"), // lib path (voir doc nodejs)
  conn, // future reference for the db connexion
  logger = bootweb.getLogger('bootweb-sample'), //log facility
  _ = require("util"), // we may use util library
  /**
   * Our application instance, will be registered by the server instance
   */
  sample_app = new bootweb.App(); // our application
  

/**
 * Init method should be implemented
 */
sample_app.init = function(options, cb) { // Bootweb first calls App.init()
  logger.info("Starting sample_app initialization");
  if (cb == null && typeof options === "function") { //parameter check
    cb = options;
    options = { // default options
      "prefix": "/sample_app/"  // prefix http (http://host:/sample_app for our example)
    };
  }
  if (options === undefined) { // default options
    options = {
      "prefix": "/sample_app/"  
    };
  }
  if (typeof options.prefix === "undefined") { // prefix is mandatory for our app
    options.prefix = "/sample_app/"; 
  }
  this.options = options;
  
  bootweb.addStaticDir(path.join(__dirname , "static")); // map static
  logger.info("Ajout des templates de l'appli : " + __dirname + "/templates");
  bootweb.addTemplateDir(path.join(__dirname , "templates"), function() {
    cb(null, sample_app); // end initialization, call callback (MANDATORY)
  });
}

/**
 * Trigger binding on bootweb's ready event'
 */
bootweb.on("ready", function(){ //Once bootweb is "ready", all ports listen and persistence connexions is up
  conn = bootweb.getConnection();
  //we can declare app persistent objects here
  
  /**
   * Initializing io events and interactions (see socket.io documentation)
   * (controlleur socket) (optional)
   */
  bootweb.io.on("connection", function(socket) {
   // handle socket messages for authenticated users
    if (socket.handshake.user != null && socket.handshake.user.email !== "anonymous") {
      logger.info("Socket established for user " + socket.handshake.user + ", binding compta");
      
    }
  });
  sample_app.emit("ready"); // the apps trigger "ready" 
});

/**
 * Map application url's (rough)
 */
sample_app.mapUrls = function(app, cb){
  //require("./lib/model");
  this.app = app;
  app.get(sample_app.options.prefix, function(req, res, next) {
    res.send(bootweb.swig.compileFile("index.html")
        .render({
          // values required for layout
          prefix : sample_app.options.prefix,
          user: req.user
          // other values
        }));
  });
}

module.exports = sample_app;