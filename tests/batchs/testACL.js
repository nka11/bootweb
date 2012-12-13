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
  logger = require('log4js').getLogger("testACL"),
  mongoose = require("mongoose"),
  bootweb = require("../../lib/bootweb");

function addBatchs(suite) {
  suite.addBatch({
    "Add user 'testACL'": {
      topic: function() {
        try {
          bootweb.auth.createUser("testACL", "testACL", "testACL", this.callback);
        }
        catch (e) {
          this.callback(e);
        }
      },
      "addUserRole 'testRole'": {
        topic: function(user) {
          var test = this;
          try {
            bootweb.ACL.addUserRole(user, "testRole", this.callback);
          }
          catch (e) {
            this.callback(e);
          }
        },
        "check error": function(err, role) {
          assert.ok(err == null, _.inspect(err));
          assert.ok(err == undefined, _.inspect(err));
        },
        "Verify rolemap": function(err, role) {
          assert.ok(role !== undefined, "roles is undefined");
          //assert.ok(typeof userRoles.user === "function", "function user not found");
        },
        /*
        "verify user": {
          topic: function(role) {
            userRole.user(this.callback);
          },
          "Check error": function(err, user) {
            assert.ok(err == null, _.inspect(err));
          },
          "Check user object": function(err, user) {
            assert.ok(user != null, "User is null or undefined");
            assert.ok(user.email === "testACL");
            assert.ok(user.pseudo === "testACL");
          }
        },*/
        
        "try to addUserRole again with same params": {
          topic: function(userRoles, user) {
            var test = this;
            logger.info(_.inspect(arguments));
            bootweb.ACL.addUserRole(user, "testRole", function(err, newUserRole) {
              test.callback(err, userRoles, newUserRole);
            });
          
          },
          "Ends with no error": function(err, userRole, newUserRole) {
            assert.ok(err == null, "err is not null : " + _.inspect(err));
          },
          "Compare instances ids": function(err, userRole, newUserRole) {
            console.log(arguments);
            assert.ok(userRole._id.toString() === newUserRole._id.toString(), "duplicated userRole object");
          }
        },
        "addPermissions": {
          topic: function(userRole) {
            var
            test = this;
            //proper addPermissions call
            console.log("Test addPermissions arguments");
            //console.log(arguments);
            bootweb.ACL.addPermissions("/", "testRole", ["read"], function(err, acl) {
              test.callback(err, acl, userRole);
            });
          },
          "test err": function(err, acl, userRole) {
            assert.ok(err == null, "error not null : " + _.inspect(err));
          },
          "test acl values": function(err, acl, userRoles) {
            console.log(arguments)
            assert.ok(acl.permissions.length === 1, "Permissions length expected 1 is " + acl.permissions.length + "  " + _.inspect(acl.permissions));
            assert.ok(acl.permissions[0] === "read", "Permissions object doesn't contains expected value " + _.inspect(acl));
            assert.ok(acl.roleId.toString() === userRoles.roles[0].toString(), "wrong role id in acl");
          },
          "add again same permission": {
            topic: function(origAcl, userRole) {
              var test = this;
              /*console.log({
                "origAcl.roleId": origAcl.roleId
              }); */
              bootweb.ACL.addPermissions("/", "testRole", ["read"], function(err, acl) {
                test.callback(err, acl, origAcl, userRole);
              });
            },
            "Verify acl ids": function(err, acl, origAcl, userRole) {
              console.log({
                id: acl.id,
                resource: acl.resource,
                roleId: acl.roleId
              });
              assert.ok(err == null, "error not null : " + _.inspect(err));
              assert.ok(acl.id === origAcl.id, "a different acl object was created : origId " + origAcl.id + " acl.id" + acl.id);
            },
            "Verify permission array": function(err, acl, origAcl, userRole) {
              assert.ok(acl.permissions.length === 1, "Permissions length expected 1 is " + acl.permissions.length + "  " + _.inspect(acl.permissions));
              assert.ok(acl.permissions[0] === "read", "Permissions object doesn't contains expected value " + _.inspect(acl));
            },

            "add another permission": {
              topic: function(acl, origAcl, userRole) {
                var test = this;
                bootweb.ACL.addPermissions("/", "testRole", ["write"], function(err, acl) {
                  test.callback(err, acl, origAcl, userRole);
                });
              },
              "Verify acl ids": function(err, acl, origAcl, userRole) {
                console.log(arguments);
                assert.ok(err == null, "error not null : " + _.inspect(err));
                assert.ok(acl.id === origAcl.id, "a different acl object was created : origId " + origAcl.id + " acl.id" + acl.id);
              },
              "Verify permission array": function(err, acl, origAcl, userRole) {
                assert.ok(acl.permissions.length === 2, "Permissions length expected 1 is " + acl.permissions.length + "  " + +_.inspect(acl.permissions));
                assert.ok(acl.permissions[1] === "write", "Permissions object doesn't contains expected value " + _.inspect(acl));
              }
            },
            "test isAuthorized for authorized user to a given resource": {
              topic: function(acl, userRole) {
                //console.log(arguments);
                bootweb.ACL.isAuthorized('testACL', '/', 'read', this.callback);
              },
              "Check result ok": function(err, isAuth) {
                assert.ok(err == null, "Error : " + _.inspect(err));
                assert.ok(isAuth, "Not authorized");
              }
            },
             "test isAuthorized for unauthorized user to a given resource": {
              topic: function(acl, userRole) {
                //console.log(arguments);
                bootweb.ACL.isAuthorized('testACL', '/', 'ready', this.callback);
              },
              "Check result ok": function(err, isAuth) {
                assert.ok(err == null, "Error : " + _.inspect(err));
                assert.ok(!isAuth, "Not authorized");
              },
            },
            "test isAuthorized for existing user to a undefined resource": {
              topic: function(acl, userRole) {
                //console.log(arguments);
                bootweb.ACL.isAuthorized('testACL', '/testUnexisting', 'ready', this.callback);
              },
              "Check result ok": function(err, isAuth) {
                assert.ok(err == null, "Error : " + _.inspect(err));
                assert.ok(!isAuth, "Not authorized");
              }
            }
          },

        },
        "addPermissions with existing role (param as String)": {
          topic: function(userRoles) {
            var
            test = this;
            
              bootweb.ACL.addPermissions("/", 'testRole', ["read"], function(err, acl) {
                test.callback(err, acl, userRoles);
              });
          },
          "check new userRole": {
            topic: function(acl, userRole) {
              var test = this;
              //console.log("(check new) UserRole is " + _.inspect(userRole));
              
              //console.log(arguments);
                test.callback(null,acl, userRole);
            },
            "validate acl role object": function(err, acl, userRole) {
              assert.ok(err == null, 'Error is not null : ' + _.inspect(err));
              assert.ok(typeof userRole === "object", 'type of role : ' + typeof userRole + ", should be 'object'");
              assert.ok(userRole !== null, 'role is null');
              //console.log(arguments);
              assert.ok(userRole.roles[0].toString() === acl.roleId.toString(), "role and acl doesn't match userRole.roles[0] : " + userRole.roles[0] + " acl.roleId = " + acl.roleId);
            }
          },
          
        }
        ,
        "addPermissions with new role (param as String)": {
          topic: function(userRole) {
            var
            test = this;
            //proper addPermissions call
            bootweb.ACL.addPermissions("/", "testRole1", ["read"], function(err, acl) {
              test.callback(err, acl, userRole);
            });
          },
          "validate acl role object": function(err, acl, userRole) {
              assert.ok(err == null, 'Error is not null : ' + _.inspect(err));
              assert.ok(typeof userRole === "object", 'type of role : ' + typeof userRole + ", should be 'object'");
              assert.ok(userRole !== null, 'role is null');
              console.log(arguments);
              assert.ok(userRole.roles[0].toString() !== acl.roleId.toString(), "role and acl match userRole.roles[0] : " + userRole.roles[0] + " acl.roleId = " + acl.roleId);
          }
          ,
          
          
        }
      }
    }
  });
}

exports.addBatchs = addBatchs;