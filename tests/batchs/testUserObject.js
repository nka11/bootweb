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
  logger = require('log4js').getLogger("test"),
  mongoose = require("mongoose"),
  bootweb = require("../../lib/bootweb");
function addBatchs(suite) {

  suite.addBatch({
    "Test user object": {
      topic: function() {
        var
        test = this,
          conn = bootweb.getConnection(),

          User = conn.model('User'),
          user = new User();
        this.callback(null, user);
      },
      "Validate user instance": function(err, user) {
        assert.ok(user !== undefined, "user is undefined");
        assert.ok(user !== null, "user is null");
        assert.ok(typeof user.validPassword === "function", "function validPassword not referenced in object");
        assert.ok(typeof user.changePassword === "function", "function changePassword not referenced in object");
      }
    },
    "Test create user": {
      topic: function() {
        var
        test = this,
          conn = bootweb.getConnection(),
          User = conn.model('User'),
          user = new User({
            'pseudo': 'toto'
          });
        user.save(function(err) {
          test.callback(err, user);
        })
      },
      "Verify instance": function(err, user) {
        //console.log(_.inspect(user));
        assert.ok(err != null, _.inspect(err));
        assert.ok(user !== undefined, "User is undefined");
        assert.ok(typeof user === "object", "User in not an object");
        //assert.ok(user.save instanceof Function);
      }
      /*
        
        } 
      }*/
    },
    "Test createUser": {
      topic: function() {
        bootweb.auth.createUser('useremail', 'testCreateUser', 'testpassword', this.callback)
      },
      "Verify instance": function(err, user) {
        //console.log(_.inspect(user));
        assert.ok(user !== undefined, "User is undefined");
        assert.ok(typeof user === "object", "User in not an object");
        assert.ok(user.save instanceof Function);
      },
      "test validPassword": function(err, user) {
        assert.ok(user.validPassword("testpassword"));
      },
      "Test setPassword": {
        topic: function(user) {
          user.setPassword("testpassword");
          this.callback(null, user);
        },
        "test validPassword": function(err, user) {
          assert.ok(user.validPassword("testpassword"));
        }
      },

      "Test save user": {
        topic: function(user) {
          var test = this;
          //console.log(_.inspect(arguments));
          user.save(function(err) {
            test.callback(err, user);
          });
        },
        "Verify instance": function(err, user) {
          //console.log(_.inspect(user));
          assert.ok(user.id !== undefined, "No user id found");
        },
        /*"Native search user by id": {
          topic: function(user) {
            var test = this;
            console.log(_.inspect(user._id));
            bootweb.getConnection().collections['users'].findOne({
              _id: new mongoose.Schema.ObjectId(user._id)
            }, function(err, res) {
              test.callback(err, res)
            });
          },
          "Check return types": function(err, user) {
            assert.ok(err === null, "Error is not null" + _.inspect(err));
            assert.ok(user != null, "Error, user is null");
          }
        } */
      }
    }
  });
}

exports.addBatchs = addBatchs;

//var suite2 = vows.describe('clean');
//exports.suite2 = suite2;
