var
    vows = require("vows"),
    assert = require('assert'),
    nconf = require('nconf'),
    dirname = __dirname,
    _ = require("util"),
    mongoose = require("mongoose"),
    bootweb = require("../../lib/bootweb");
    
//Test suite requires mongoose to run properly 
    
/*var suite0 = vows.describe('Bootweb auth test suite');
exports.suite0 = suite0;
suite0.addBatch({
	"test Initialize auth": {
		topic: function() {
			var 
				test = this;
			bootweb.on("ready", function(){
				test.callback(null,bootweb);
			
			});
			//nconf.overrides('database:name', 'TestUserModel');
			bootweb.init(dirname, function(app, cb){
				cb();
			});
		},
		"Bootweb started": function(err, bootweb) {
			assert.ok(bootweb.auth !== undefined);
		}
	}
}); */

/*suite1.addBatch({
	"Initialize Bootweb": {
		topic: function() {
			var test = this;
			//nconf.overrides('database:name', 'TestUserModel');
			bootweb.on("ready", function(){
				test.callback(null,bootweb.getSchema());
			});
			bootweb.init(dirname, function(app, cb){
				cb();
			});
		},
		"DB Schema configured": function(err, schema) {
			//console.log(schema);
			assert.ok(schema !== undefined, "user is undefined");
			assert.ok(schema !== null, "user is null");
		}
	}
}); */
function addBatchs(suite) {
	
	suite.addBatch({
		"Test user object": {
			topic: function() {
				var 
					test = this,
					users = require("../../models/users"),
					user = new users.User;
				this.callback(null,user);
			},
			"Validate user instance": function(err, user) {
				assert.ok(user !== undefined, "user is undefined");
				assert.ok(user !== null, "user is null");
				assert.ok(typeof user.validPassword === "function", "function validPassword not referenced in object");
				assert.ok(typeof user.changePassword === "function", "function changePassword not referenced in object");
				assert.ok(typeof user.setPassword === "function", "function setPassword not referenced in object");
			}
		},
		"Test create user": {
			topic: function() {
				var 
					test = this,
					users = require("../../models/users");
				users.User.create({'pseudo': 'toto'},function(err, user) {
					test.callback(null, user);
				});
			},
			"Verify instance": function(err, user) {
				//console.log(_.inspect(user));
				assert.ok(user !== undefined, "User is undefined");
				assert.ok(typeof user === "object", "User in not an object");
				//assert.ok(user.save instanceof Function);
			},
			"Test save user": {
				topic: function(user) {
					var test = this;
					//console.log(_.inspect(arguments));
					user.save(function(err, user) {
						test.callback(err, user);
					});
				},
				"Verify instance": function(err,user) {
					//console.log(_.inspect(user));
					assert.ok(user.id !== undefined, "No user id found");
				},
				"Native search user by id": {
					topic : function(user) {
						var test = this;
						//console.log(_.inspect(mongoose.Schema));
						mongoose.connect('mongodb://'+ nconf.get("database:host") +'/' + nconf.get("database:name"));
						mongoose.connection.collections['users'].findOne({
							_id: new mongoose.Schema.ObjectId(user.id)
						},function(err,res){test.callback(err, res)});
					},
					"Check return types": function(err, user) {
						assert.ok(err === null, "Error is not null" + _.inspect(err));
						assert.ok(user != null, "Error, user is null");
					}
				}
			}
		}
	});
}

exports.addBatchs = addBatchs;

//var suite2 = vows.describe('clean');
//exports.suite2 = suite2;
