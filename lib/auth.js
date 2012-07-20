/*

Bootweb - boot your web app
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

/**
 * This module provides services for authentication
 */

var crypto = require('crypto'),
	mongoose = require('mongoose'),
    bootweb = require('./bootweb.js'),
    conn = bootweb.getConnection(),
    nconf = require('nconf'),
    passport = require("passport"),
    LocalStrategy = require('passport-local').Strategy,
    users = require("../models/users.js"),
    User = conn.model('User'),
    _ = require('util'),
    logger = bootweb.getLogger("commons.auth");

passport.serializeUser(function(user,done) {
    done(null,user._id);
    });
passport.deserializeUser(function(id, done) {
    User.findOne({_id: id}, function(err, user) {
        done(err,user);
    });
});
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  function(email, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // Find the user by username. If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message. Otherwise, return the
      // authenticated `user`.
      User.findOne({email:email}, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unkown user ' + email }); }
        if (!user.validPassword(password)) { return done(null, false, { message: 'Invalid password' }); }
        return done(null, user);
      })
    });
  }
));
exports.initUsers = function(callback) {
    logger.info("Starting initUsers");
    
    User.findOne({email: "admin"}, function(err, user) {
        if (err !== null) {
            if (typeof callback === "function") {
                return callback(err);
            }
        }
        if (user === null) {
            logger.info("admin user not found, creating");
            user = new User({
                email: 'admin',
                pseudo: 'admin'
              
            });
            user.setPassword('demo');
            user.save(callback);
        } else {
            logger.info("admin user found");
            if (typeof callback === "function") {
                return callback(null);
            }
        }
    });
};

/**
 * Simplist middleware for anonymous
 */
exports.anonyMw = function(req,res,next){
	if (req.user === undefined) {
		logger.info("No user connected, setting anonymous");
        req.user = {email: "anonymous", pseudo: "anonymous"};
    }
	next();
};
/**
 * Allows dev to check ACL for a route :
 * 
 * app.get('url',bootweb.auth.verify("read"), function(req,res,next){res.send("allowed");})
 */
exports.verify = function(authorisation) {
	return function(req, res, next) {
		var path = decodeURIComponent(req.path.replace(/\++/g, ' '));
		logger.info("Entering auth check");
		logger.debug(_.inspect({authorisation:authorisation,email:req.user.email,path:path}));
		
		bootweb.ACL.isAuthorized(req.user.email,path, authorisation, function(err, isAuth) {
			if (err !== null) {
				return bootweb.renderError(req, res, {err: err, code: 500});
			}
			if (isAuth) {
			return next();
			}
			if (typeof req.user._id === "undefined") { //if anonymous, 401 Unauthorized
				return bootweb.renderError(req, res, {err: "Unauthorized", code: 401});
			}
			// if user connected, 403 Forbidden
			return bootweb.renderError(req, res, {err: "Forbidden", code: 403});
		});
	}	
};
/**
 * mapping urls for basic HTTP login/logout services
 */
exports.mapUrls = function(app) {
	app.get('/logout', function(req, res) {
		req.logOut();
		res.redirect('/');
	});
    app.post('/register', function(req, res) {
        var 
			key = crypto.createHash('md5').update(
				(new Date()).valueOf().toString() + Math.random().toString()).digest('hex'),
			emailhash; 
        if (req.is('json')) {
            var user = new User({
                email: req.body.email,
                pseudo: req.body.pseudo,    
                key:key,
                actif:false
                });
            user.setPassword(req.body.password);
            user.save(function(err) {
                if (err === null) {
                    res.json({
                        success: true,
                        message: "user created"
                    });
                    //logger.info(_.inspect(req));
                    emailhash = crypto.createHash('md5').update(user.email).digest('hex');
					bootweb.sendMessage({ 
					   text: "I hope",
					   from: nconf.get('email:template:system:from'), 
					   to: user.email,
					   cci:     nconf.get('email:template:system:cci'), 
					   subject: "Activation de votre compte",
					   attachment:
					    [
					      {data:mailTpl.render({
							but:"Activer votre compte",
							texte:"activer votre compte",
							lien: "http://" + req.headers['host'] + "/activate/" + user.key + "/" + emailhash //
							}), alternative:true}
					    ]
					},function(err){
						if (err !== null){
							logger.info(_.inspect(err));
						}
					});
                } else {
                	res.statusCode = 500;
                	res.json({success: false, err: err});
                }
            });
        } else {
            res.send("Only json accepted",406);
        }
    });
	app.get("/activate/:key/:emailHash",function(req, res, next) { // trame très (très) rapide
	// Faire éventuellement des vérifications, templater les pages d'erreur
	// Améliorer les messages
		User.findOne({key:req.params.key}, function(err, user) {
			var emailHash;
			if (user === null) {
				return res.send("Not found",404);
			}
			emailHash = crypto.createHash('md5').update(user.email).digest('hex');
			if (emailHash === req.params.emailHash) {
			// user validé
				user.active = true;
				user.key = "";
				user.save(function(err) {
					if (err !== null) {
						return res.send("Error saving user", 500);
					}
					res.render('activate.html', {user: req.user}); // faire mieux... comme template...
				});
			} else {
				return res.send("Error validating user", 500);
			}
		});
	});
    
    app.post('/login', function(req, res, next) {
		passport.authenticate('local', function(err, user, info) {
			logger.info("authenticate : err : " + _.inspect(err));
			logger.info("authenticate : user : " + _.inspect(user));
			logger.info("authenticate : info : " + _.inspect(info));
			if (err !== null) { res.json({success: false, message:"error", err: err}); }
			if (user === null) {
				//req.flash('error', info.message);
				return bootweb.renderError(req, res, {err: "user not found", code: 403});
			}
			req.logIn(user, function(id, err) {
				logger.info("logIn : id : " + _.inspect(id));
				logger.info("logIn : arguments : " + _.inspect(arguments));
				if (err) { return next(err); }
				if (req.is('json')) {
					return res.json({success: true});
				}
				return res.redirect(req.header('Referer'));
			});
		})(req, res, next);
    });
    
};
    /*
    app.get('/login', function(req, res, next) {
        res.render("login.html",{});
    });
    */

