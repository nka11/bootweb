/*

Bootweb $version - boot your web app
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
var 
  mongoose = require('mongoose'),
  log4js = require('log4js'),
  logger = log4js.getLogger("as.BootWeb"),
  email = require('emailjs'),
  swig = require('swig'),
  _ = require('util'),
  EventEmitter = require('events').EventEmitter,
  BootWeb = new EventEmitter(),
  express = require('express'),
  passport = require('passport'),
  nconf = require('nconf'),
  path = require("path"),
  http = require('http'), 
  fs = require('fs');
BootWeb.conf = nconf;
BootWeb.mongoose = mongoose;
function exists(name, cb) {
  if (fs.exists === undefined) {
    return path.exists(name, cb);
  }
  return fs.exists(name, cb);
}

/**
 * Returns the connexion to database
 */
BootWeb.getConnection = function(connUrl) {
  if (this.conn === undefined) {
    if (connUrl === undefined) {
      this.connUrl = 'mongodb://' + nconf.get('database:host') + '/' + nconf.get('database:name');
    }
    else {
      this.connUrl = connUrl;
    }
    logger.info("Creating MongoDB connection " + connUrl);
    this.conn = mongoose.createConnection(this.connUrl, function(err) {
      if (err) {
        logger.error("Database connection not found" + _.inspect(err));
        process.exit(1);
      }
    });
  }
  logger.info("Returning MongoDB connection " + this.connUrl);
  return this.conn;
}

/**
 * Initialize config with nconf
 */
BootWeb.initConf = function(cb) {
  var
    confFile = BootWeb.basedir + '/config/config.json'; //  
  nconf.argv().env();
  exists(confFile, function(exist) {
    nconf.file({
      file: confFile
    });
    if (!exist) {
      nconf.set('database:host', 'localhost');
      nconf.set('database:host', 'localhost');
      nconf.set('database:name', 'BootWebDefault');
      nconf.set('fs:statics', '/resources/static');
      nconf.set('fs:templates', '/resources/templates');
      nconf.set('server:host', 'localhost');
      nconf.set('server:port', 1337);
      nconf.set('email:server:host', 'localhost');
      nconf.set('email:server:ssl', 'false');
      nconf.set('email:server:user', '');
      nconf.set('email:server:password', '');
      nconf.set('email:template:system:from', 'bootweb');
      nconf.set('email:template:system:cci', 'bootweb');
    }
    if (nconf.get("BOOTWEB_PORT") != null) {
      nconf.set('server:port',nconf.get("BOOTWEB_PORT"));
    }
    if (nconf.get("BOOTWEB_HOST") != null) {
      nconf.set('server:host',nconf.get("BOOTWEB_HOST"));
    }
    cb();
    if (!exist) {
      logger.warn("Config file not found, writing default values");
      exists(this.basedir + "/config", function(exist) {

        if (!exist) {
          logger.warn("Config dir does not exists");
          return fs.mkdir(BootWeb.basedir + "/config", function(err) {
            if (err !== null && err.code !== 'EEXIST') {
                logger.error("Config dir not created : " + _.inspect(err));
                throw err;
              }
            nconf.save(function(err) {
              if (err !== null) {
                logger.error("Nconf file not saved : " + _.inspect(err));
                throw err;
              }
            });
          });
        }
        logger.info("Config dir exists");
        nconf.save(function(err) {
          if (err !== null) {
            logger.error("Nconf file not saved : " + _.inspect(err));
          }
        });
      });
    }
  });
};

BootWeb.initApps = function(app, cb) {
  if (BootWeb.templatesDirs == null) {
    BootWeb.templatesDirs = [];
  }
  this.appsRegistry.initApps(app, cb);
}

BootWeb.addTemplateDir = function(dir, cb) {
  exists(dir, function(exist) {
    if (exist) {
      logger.info("Template directory " + dir+ " found");
      // Should be inserted at first element of the array
      BootWeb.templatesDirs.push(dir);
      
    } else {
      logger.warn(dir + " doesn't exist, not mounting templates");
    }
    
    if (typeof cb === "function") {
      cb(null,exist);
    }
  });
}

/**
 * Initalize swig templates engine
 */
BootWeb.initSwig = function(app, cb) {
  var templatesDir = path.join(BootWeb.basedir, nconf.get('fs:templates'));
  BootWeb.addTemplateDir(templatesDir, function(err, exist) {
    templatesDir = path.join(__dirname, "../lib/templates");
    BootWeb.addTemplateDir(templatesDir, function(err, exist) {
      // add condition for initializing
      if (BootWeb.templatesDirs.length > 0) {
        logger.info("Initializing swig engine");
        app.engine('.html', require('consolidate').swig);
        app.set('view engine', 'html');
        swig.init({
          root: BootWeb.templatesDirs,
          autoescape: false,
          allowErrors: true // allows errors to be thrown and caught by express
        });
        app.set('views', BootWeb.templatesDirs[0]);
        app.set('view options', {
          layout: false
        });
        BootWeb.swig = swig;
      }
      else {
        logger.error("Swig template engine not initialized");
        BootWeb.swig = null;
        throw new Error("Cannot initialize swig");
      }
      logger.info("swig initialization done");
      cb(null);
    });
  });
}

/**
 * Initialize logging, application framework express and passport
 * 
 * @param basedir must be given, it the base location of the application.
 *        looks in $basedir'/config/config.json' for default conf
 * @param cb is a callback function(app, cb) wich gives the express app to allow 'basic' router coding
 * @param middleware gives an entry point for advanced middleware coding
 * 
 */
BootWeb.init = function(basedir, cb, middleware) {
  var BootWeb = this,
    staticsDir,
    app = express();
  BootWeb.addStaticDir = function(staticDir, cb) {
    exists(staticDir, function(exist) {
      logger.debug("exits " + staticDir + " = " + _.inspect(exist));
      if (exist) {
        logger.info("Loading static library : " + staticDir);
        app.use(express['static'](staticDir));
      }
      else {
        logger.warn(staticDir + " doesn't exist, not mounting statics");
      }
      if (typeof cb === "function") {
        cb(null, exist);
      }
    });
  };
  BootWeb.basedir = path.normalize(basedir);
  this.templatesDirs = [];
  //BootWeb.emit('startInit', BootWeb);
  this.initConf(function() {
    var aclmod = require('../models/acl.js');
    logger.info("Start application server initialization at basedir : " + BootWeb.basedir);
    // TODO: all these app.use should be optional and easily (conf driven)
    var httpServer = http.createServer(app);
    BootWeb.io = require('socket.io').listen(httpServer);
    BootWeb.auth = require('./auth.js');
    BootWeb.auth.init();
    BootWeb.ACL = aclmod.ACL;
    BootWeb.appsRegistry = require("./apps");
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
//    app.use(express.cookieSession({secret:'super secret'}));
    app.use(require("./uploadFile").fileUpload);
    var SessionStore = require("session-mongoose")(express);
    BootWeb.sessions = new SessionStore({
        url: "mongodb://"+ nconf.get('database:host') + "/" + nconf.get('database:name') + "Session",
        interval: 120000 // expiration check worker run interval in millisec (default: 60000)
    });
    //BootWeb.dbStore = new MongoStore({db: BootWeb.getConnection().db})
    //app.use(express.session({ secret: 'super secret' }));
    app.use(express.session({ store: BootWeb.sessions, secret: 'super secret', key:"bootweb.sid" }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(BootWeb.auth.anonyMw);
    app.use(BootWeb.pageInfo);
    app.use(app.router); // entry point for 'basic' express router coding
    if (typeof middleware === "function") {
      app.use(middleware); // entry point for advanced middleware coding
    }
    
    staticsDir = path.join(BootWeb.basedir, nconf.get('fs:statics'));
    logger.info("Location for statics : " + staticsDir);
   
    BootWeb.initAuth(function(err) {
      if (err !== null) {
        logger.info("Error at auth initialisation : " + _.inspect(err));
        if (typeof cb === 'function') {
          return cb(err);
        }
      }
      if (typeof cb === 'function') {
        logger.info("Defer execution to custom callback");
        cb(app, function() {
          logger.info("Custom callback defer back to BootWeb, finalizing startup");
          BootWeb.initApps(app, function() {
            // Intialize template engine
            BootWeb.initSwig(app, function() {
              
            // gives app to auth module in order to map authentication (after application routes)
              BootWeb.auth.mapUrls(app);
              logger.info("start listening on port " + nconf.get("server:port"));
              httpServer.listen(nconf.get("server:port"),nconf.get("server:host"));
              //app.listen(1337);
              logger.info("http://"+ nconf.get("server:host") + ":" +  nconf.get("server:port") + "/");
              BootWeb.addStaticDir(staticsDir);
              staticsDir = path.join(__dirname , "../lib/static");
              BootWeb.addStaticDir(staticsDir, function(err, exist) {
                BootWeb.emit('ready', BootWeb);
              });
            });
          });
        });
      }
    });
  });
};

BootWeb.pageInfo = function(req, res, next) {
  req.page = {
    fqdn: req.headers.host,
    url: "http://" + req.headers.host + req.path
  };

  next();
};

BootWeb.initAuth = function(cb) {
  this.auth.initUsers(cb);
}
/**
 * Utility method to render errors
 */
BootWeb.renderError = function(req, res, error) {
  if (req.is('json')) {
    return res.json({
      success: false,
      error: error.err
    }, error.code);
  }
  else {
    res.statusCode = error.code;
    return res.render("error/" + error.code + ".html", {
      page: req.page,
      user: req.user,
      err: error.err
    });
  }
}
/**
 * Returns a log4js logger
 */
BootWeb.getLogger = function(name) {
  return log4js.getLogger(name);
};

/**
 * Email service
 */
BootWeb.sendMail = function(message, callback) {
  var BootWeb = this,
    ssl = false;
  if (BootWeb.mailServer === undefined) {
    if (nconf.get('email:server:ssl').toLowerCase() === "true") {
      ssl = true;
    }
    BootWeb.mailServer = email.server.connect({
      user: nconf.get('email:server:user'),
      password: nconf.get('email:server:password'),
      host: nconf.get('email:server:host'),
      ssl: ssl
    });
    logger.info("Configure Mailserver (SSL: " + ssl + ") : user: " + nconf.get('email:server:user') + " server: " + nconf.get('email:server:host'));
  }
  BootWeb.mailServer.send(message, callback);
};
module.exports = BootWeb;
