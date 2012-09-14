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
                        });
					},
					"Ends with no error": function(err, userRole,newUserRole) {
						assert.ok(err == null, "err is not null : " + _.inspect(err));
					},
					"Compare instances ids": function(err, userRole,newUserRole) {
						assert.ok(userRole.id === newUserRole.id,"duplicated userRole object");
					}
				},
                "addPermissions": {
                    topic: function(userRole) {
                        var
                            test = this;
                        //proper addPermissions call
                        bootweb.ACL.addPermissions("/",userRole, ["read"], function(err,acl){
                           test.callback(err, acl, userRole); 
                        });
                    },
                    "test err": function(err,acl,userRole) {
                        assert.ok(err == null, "error not null : " + _.inspect(err));
                    },
                    "test acl values": function(err, acl, userRole) {
                        assert.ok(acl.permissions.length === 1, "Permissions length expected 1 is " + acl.permissions.length);
                        assert.ok(acl.permissions[0] === "read", "Permissions object doesn't contains expected value " + _.inspect(acl));
                        assert.ok(acl.roleId === userRole.id, "wrong role id in acl");
                    },
                    "add again same permission": {
                        topic: function(origAcl, userRole) {
                            var test = this;
                            console.log({"origAcl.roleId":origAcl.roleId});
                            bootweb.ACL.addPermissions("/",userRole, ["read"], function(err,acl){
                               test.callback(err, acl,origAcl, userRole); 
                            });
                        },
                        "Verify acl ids": function(err, acl,origAcl, userRole) {
                            console.log({id: acl.id, resource: acl.resource,roleId: acl.roleId});
                            assert.ok(err == null, "error not null : " + _.inspect(err));
                            assert.ok(acl.id === origAcl.id, "a different acl object was created : origId " + origAcl.id + " acl.id" + acl.id);
                        }
                    }
                }
			}
    	}
    });
}

exports.addBatchs = addBatchs;