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
var log4js = require('log4js'),
    db = require('jugglingdb');
    
var
    logger,
    email = require('emailjs'),
    swig = require('swig'),
    _ = require('util'),
    EventEmitter = require('events').EventEmitter,
    BootWeb = new EventEmitter(),
    express = require('express'),
    passport = require('passport'),
    nconf = require('nconf'),
    path = require("path"),
    fs = require('fs');
function exists(name, cb) {
    if (fs.exists === undefined) {
        return path.exists(name,cb);
    }
    return fs.exists(name,cb);
}

/**
 * Returns the database schema object
 */
BootWeb.getSchema = function(connUrl) {
    if (this.schema ===  undefined) {
        if (connUrl === undefined) {
            this.connUrl = nconf.get('database:adapter') + '://' + nconf.get('database:host') + '/' + nconf.get('database:name');
        } else {
            this.connUrl = connUrl;
        }
        logger.info("Basedir " + this.basedir);
        logger.info("Creating DB connection " + this.connUrl);
        this.schema = new db.Schema(nconf.get('database:adapter'),{
            port: nconf.get('database:port'),
            host: nconf.get('database:host'),
            database: nconf.get('database:name')
        });
    }
    logger.info("Returning db schema object " + this.connUrl);
    return this.schema;
}

/**
 * Initialize config with nconf
 */
BootWeb.initConf = function(cb) {
    var
        confFile = this.basedir + '/config/config.json'; // 
    nconf
        .argv()
        .env();
    exists(confFile, function(exist) {
        nconf.file({ file:  confFile});
        if (!exist) {
        	//console.log(nconf);
        	nconf.set('server:host', 'localhost');
        	nconf.set('server:port', '1337');
            nconf.set('database:adapter', 'mongoose');
            nconf.set('database:host', 'localhost');
            nconf.set('database:port', '27017');
            nconf.set('database:name', 'BootWebDefault');
            nconf.set('fs:statics', '/resources/static');
            nconf.set('fs:templates', '/resources/templates');
            nconf.set('email:server:host', 'localhost');
            nconf.set('email:server:ssl', 'false');
            nconf.set('email:server:user', '');
            nconf.set('email:server:password', '');
            nconf.set('email:template:system:from', 'bootweb');
            nconf.set('email:template:system:cci', 'bootweb');
        }
        cb();
        if (!exist) {
            logger.warn("Config file not found, writing default values");
            exists(this.basedir + "/config",function(exist) {
                
                if (!exist) {
                    logger.warn("Config dir does not exists");
                    return fs.mkdir(this.basedir + "/config",function() {
                        nconf.save(function (err) {
                            if (err !== null) {
                                logger.error("Nconf file not saved : " + _.inspect(err));
                            }
                        });
                    });
                }
                logger.info("Config dir exists");
                nconf.save(function (err) {
                    if (err !== null) {
                        logger.error("Nconf file not saved : " + _.inspect(err));
                    }
                });
            });
        }
    });
};

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
        templatesDir,
        app = express.createServer();
    fs.mkdir(basedir + "/log",function(err){});
    //log4js.configure(basedir + '/config/logging.json', { cwd: basedir + '/log' });
    logger = log4js.getLogger("as.BootWeb");
    logger.warn("Initializing server at location : " + basedir);
    this.db = db;    
    this.basedir = path.normalize(basedir);
    this.initConf(function() {
        logger.info("Initializing core components");
		var aclmod = require('../models/acl.js');
		BootWeb.ACL = aclmod.ACL;
        BootWeb.auth = require('./auth.js');
		BootWeb.auth.init();
        logger.info("Start application server initialization at basedir : " + BootWeb.basedir);
        // TODO: all these app.use should be optional and easily (conf driven)
        app.use(express.cookieParser());
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(require("./uploadFile").fileUpload);
        app.use(express.session({secret:"string"}));
        app.use(passport.initialize());
        app.use(passport.session());
        app.use(BootWeb.auth.anonyMw);
        app.use(BootWeb.pageInfo);
        app.use(app.router); // entry point for 'basic' express router coding
        if (typeof middleware === "function") {
            app.use(middleware); // entry point for advanced middleware coding
        }
        logger.info("Location for statics : " + nconf.get('fs:statics'));
        staticsDir = path.join(BootWeb.basedir,nconf.get('fs:statics'));
        exists(staticsDir, function(exist) {
            logger.info("exits " + staticsDir + " = " + _.inspect(exist));
            if (exist) {
                app.use(express['static'](staticsDir));
            } else {
                logger.warn("${basedir}/" + nconf.get('fs:statics') + " doesn't exist, not mounting statics");
            }
            templatesDir = path.join(BootWeb.basedir, nconf.get('fs:templates'));
            exists(templatesDir, function(exist) {
                logger.info("exits " + templatesDir + " = " + _.inspect(exist));
                if (exist) {
                    logger.info("Template directory ${basedir}/" + nconf.get('fs:templates') + " found, initializing swig engine");
                    app.register('.html', swig);
                    app.set('view engine', 'html');
                    swig.init({
                        root: templatesDir,
                        autoescape: false,
                        allowErrors: true // allows errors to be thrown and caught by express
                        });
                    app.set('views', templatesDir);
                    app.set('view options', { layout: false });
                
                } else {
                    logger.warn("${basedir}/" + nconf.get('fs:templates') + " doesn't exist, not mounting templates");
                }
                // Intialisation du moteur de templates
                BootWeb.initAuth(function(err){
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
						// gives app to auth module in order to map authentication (after application routes)
                            BootWeb.auth.mapUrls(app); 
                            app.listen(nconf.get('server:port'));
							logger.info("server listening on port " + nconf.get('server:port'));
							logger.info("http://localhost:"+nconf.get('server:port')+"/");
                            BootWeb.emit('ready', BootWeb);
                        });
                    }
               });
            });
        });
    });
};

BootWeb.pageInfo = function(req, res, next) {
	req.page = {
		fqdn : req.headers.host,
		url : "http://" + req.headers.host + req.path
	};

	next();
};

BootWeb.initAuth = function(cb) {
	this.auth.initUsers(cb);
	//if (typeof cb === "function") {
	//	cb(null);
	//}

}
/**
 * Utility method to render errors
 */
BootWeb.renderError = function(req,res, error) {
    if (req.is('json')) {
            return res.json({success: false, error: error.err}, error.code);
        } else {
            res.statusCode = error.code;
            return res.render("error/" + error.code + ".html", {page:req.page,user:req.user, err: error.err});
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
	var BootWeb = this, ssl = false;
	if (BootWeb.mailServer === undefined) {
		if (nconf.get('email:server:ssl').toLowerCase() === "true") {
			ssl = true;
		}
        BootWeb.mailServer  = email.server.connect({
            user: nconf.get('email:server:user'),
            password: nconf.get('email:server:password'),
            host: nconf.get('email:server:host'),
			ssl: ssl
        });
        logger.info("Configure Mailserver (SSL: "+ ssl +") : user: " +
			nconf.get('email:server:user') + " server: " + nconf.get('email:server:host'));		
	}
    BootWeb.mailServer.send(message, callback);
};
module.exports = BootWeb;