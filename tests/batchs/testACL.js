var
    vows = require("vows"),
    assert = require('assert'),
    nconf = require('nconf'),
    dirname = __dirname,
    _ = require("util"),
    mongoose = require("mongoose"),
    bootweb = require("../../lib/bootweb");
    
function addBatchs(suite) {
	suite.addBatch({
		"Add user 'testACL'": {
			topic: function() {
				try {
					bootweb.auth.createUser("testACL","testACL","testACL",this.callback);
				} catch(e) {
					this.callback(e);
				}
			},
			"addUserRole 'testRole'": {
				topic: function(user) {
					var test = this;
					try {
						bootweb.ACL.addUserRole(user, "testRole", this.callback);
					} catch(e) {
						this.callback(e);
					}
				},
				"check error": function(err, userRole) {
					assert.ok(err == null, _.inspect(err));
					assert.ok(err == undefined, _.inspect(err));
				},
				"Verify rolemap": function(err, userRole) {
					assert.ok(userRole !== undefined, "roles is undefined");
				},
				"verify user": {
					topic: function(userRole) {
						userRole.user(this.callback);
					},
					"Check error": function(err,user) {
						assert.ok(err == null, _.inspect(err));	
					},
					"Check user object": function(err, user) {
						assert.ok(user != null, "User is null or undefined");
						assert.ok(user.email === "testACL");
						assert.ok(user.pseudo === "testACL");
					}
				},
				"verify role": {
					topic: function(userRole) {
						userRole.role(this.callback);
					},
					"Check Error": function(err, role) {
						assert.ok(err == null, _.inspect(err));	
					},
					"Check role object": function(err, role) {
						assert.ok(role != null, "Role is null or undefined");
						assert.ok(role.roleName === "testRole");
					}
				},
				"try to addUserRole again with same params": {
					topic: function(userRole) {
						var test = this;
                        userRole.user(function(err, user) {
						    bootweb.ACL.addUserRole(user , "testRole", function(err, newUserRole) {
        						test.callback(err, userRole, newUserRole);
    						});
                        })
					},
					"Ends with no error": function(err, userRole,newUserRole) {
						assert.ok(err == null, "err is not null : " + _.inspect(err));
					},
					"Compare instances ids": function(err, userRole,newUserRole) {
						assert.ok(userRole.id === newUserRole.id,"duplicated userRole object");
					}
				}
			}
		}
	});
}

exports.addBatchs = addBatchs;