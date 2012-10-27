var passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy
  ,     bootweb = require('../bootweb.js')
  ,  users = require("../../models/users.js"),
  logger = bootweb.getLogger("bootweb.auth.facebook"),
    User = users.User, callbackUrl
    , nconf = require('nconf');

exports.isValid = false;
exports.init = function(){
    var FACEBOOK_APP_ID,FACEBOOK_APP_SECRET,
    appId = false,
    appSecret = false,
    url = false,
    fqdn;
    logger.info('configuring facebook');
    //TODO store these settings in db too
    if (typeof nconf.get("facebook:appId") === "string") {
        FACEBOOK_APP_ID = nconf.get("facebook:appId");
        appId = true;
    } 
    if (typeof nconf.get("facebook:appId") === "string" ) {
        FACEBOOK_APP_SECRET = nconf.get("facebook:appSecret");
        appSecret = true;
    }
    if (typeof nconf.get("facebook:callbackUrl") === "string" ) {
        callbackUrl = nconf.get("facebook:callbackUrl");
        url = true;
    }
    if (typeof nconf.get("server:fqdn") === "string") {
        fqdn =  nconf.get("server:fqdn") ;
    } else {
        fqdn = nconf.get("server:host") + ":" + nconf.get("server:port") ;
    }
    exports.isValid = appId && appSecret && url;
    if (exports.isValid) {
        passport.use(new FacebookStrategy({
            clientID: FACEBOOK_APP_ID,
            clientSecret: FACEBOOK_APP_SECRET,
            callbackURL:  "http://" + fqdn  + callbackUrl //
          },
          function(accessToken, refreshToken, profile, done) {
              console.log(profile);
            User.findOne({where:{email: profile.emails[0].value}}, function (err, user) {
              if (err) { return done(err); }
              if (user == null) {
                  return User.create({
                      email: profile.emails[0].value,
                      verified:true,
                      pseudo: profile.username,
                      profile: {'facebook': profile}
                  }, function(err, user) {
                     if (err) { return done(err); }
                     console.log(user);
                     done(err,user);
                  });
              }
              //TODO : update user profile with data from facebook
              done(null, user);
            });
          }
        ));
    }
}

exports.mapUrls = function(app) {
    logger.info("mapping urls for facebook auth");
     if (exports.isValid) {
        // Redirect the user to Facebook for authentication.  When complete,
        // Facebook will redirect the user back to the application at
        // callbackUrl
        app.get('/login/facebook', passport.authenticate('facebook'));
        
        // Facebook will redirect the user to this URL after approval.  Finish the
        // authentication process by attempting to obtain an access token.  If
        // access was granted, the user will be logged in.  Otherwise,
        // authentication has failed.
        app.get(callbackUrl, 
        passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: '/login' }));
     }
}