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
  bootweb = require("../lib/bootweb");

//Test suite requires mongoose to run properly 


var suite = vows.describe('Bootweb test suite');

suite.addBatch({
  "Drop test database": {
    topic: function() {
      var test = this;
      bootweb.basedir = dirname;
      bootweb.initConf(function(err) {
        mongoose.connect('mongodb://' + nconf.get("database:host") + '/' + nconf.get("database:name"), function() {
          mongoose.connection.db.dropDatabase(function(err) {
            //console.log(err);
            mongoose.disconnect(test.callback);
          });
        });
        //mongoose.connection.db.dropDatabase();
        //setTimeout( function () {

        //();
        // }, 1000);
      });
    },
    "Database deleted": function(err) {
      assert.ok(err === undefined, "Drop with errors " + _.inspect(err));
    }
  }
});

suite.addBatch({
  "Initialize bootWeb": {
    topic: function() {
      var
      test = this;

      //nconf.overrides('database:name', 'TestUserModel');
      bootweb.init(dirname, function(app, cb) {
        test.callback(null, bootweb);
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
require('./batchs/testACL').addBatchs(suite);



exports.suite = suite;
