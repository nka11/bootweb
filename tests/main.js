var
    vows = require("vows"),
    assert = require('assert'),
    nconf = require('nconf'),
    dirname = __dirname,
    _ = require("util"),
    mongoose = require("mongoose"),
    bootweb = require("../lib/bootweb");
    
//Test suite requires mongoose to run properly 


var suite = vows.describe('Bootweb test suite');
suite.addBatch({
	"Initialize bootWeb": {
		topic: function() {
			var 
				test = this;
			
			//nconf.overrides('database:name', 'TestUserModel');
			bootweb.init(dirname, function(app, cb){
				test.callback(null,bootweb);
				//if (typeof cb === "function") {
				//	cb();
				//}
			});
		},
		"Bootweb started": function(err, bootweb) {
			assert.ok(bootweb.auth !== undefined);
		}
	}
});

require('./batchs/testUserObject').addBatchs(suite);
require('./batchs/testInitUsers').addBatchs(suite);


suite.addBatch({
	"Drop test database": {
		topic: function() {
			var test = this;
			mongoose.connect('mongodb://'+ nconf.get("database:host") +'/' + nconf.get("database:name"));
			//mongoose.connection.db.dropDatabase();
			test.callback();
		},
		"Database deleted": function(err) {
			assert.ok(err === undefined,"Drop with errors " + _.inspect(err));
		}
	}
});
exports.suite = suite;


