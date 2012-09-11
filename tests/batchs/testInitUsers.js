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
		"Test init Users": {
			topic: function() {
				var test = this;
				bootweb.initAuth(function(err) {
					test.callback(err, bootweb);
				});
			},
			"test return values": function(err, bootweb) {
				assert.ok(err === null, "err is not null : " + _.inspect(err));
			}
		}
	});
}
exports.addBatchs = addBatchs;