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
    "Test init users": {
      topic: function() {
        var test = this;
        bootweb.initAuth(function(err) {
          test.callback(err, bootweb);
        });
      },
      "validate return values": function(err, bootweb) {
        assert.ok(err === null, "err is not null : " + _.inspect(err));
      },
      "Check admin user creation": {
        topic: function(bootweb) {
          var User = bootweb.getConnection().model('User');
          User.findOne({
              email: "admin"
          }, this.callback);
        },
        "Some object found": function(err, user) {
          assert.ok(err === null, "err is not null : " + _.inspect(err));
          assert.ok(user !== null, "user is null");
          assert.ok(user !== undefined, "user is null");
        },
        "Validate user data": function(err, user) {
          assert.ok(user.email === "admin", "this is not the expected user");
        }
      }
    }
  });
}
exports.addBatchs = addBatchs;