var bootweb = require('../../lib/bootweb');

bootweb.init(__dirname, function(app, cb){
	app.get("/", function(req,res) {res.render('home.html', {user: req.user})});
	app.get("/private", bootweb.auth.verify("read"), function(req,res) {res.render('home.html', {user: req.user})});
	cb();
});