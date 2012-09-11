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

var bootweb = require("../lib/bootweb"),
    schema   = bootweb.getSchema(),
   // ObjectId = bootweb.mongoose.ObjectId;
    crypto = require('crypto'),
    User = schema.define('User',{
        pseudo:  { type: String, limit: 20, index: true },
        email:  { type: String, limit: 150, index: true },
        password: { type: String, limit: 50},
        registrationDate: {type: Date, 'default': function () { return new Date(); }},
        verified: { type: Boolean, 'default': false },
        alive:  { type: Boolean, 'default': false },
        active: { type: Boolean, 'default': false },
        key: { type: String, limit: 50}
    });

User.prototype.validPassword = function validPassword(password) {
    var shasum = crypto.createHash('sha1');
    shasum.update(password);
    return this.password === shasum.digest();
};

User.prototype.changePassword = function changePassword(password,newpassword, validation, callback) {
    var shasumCurrent = crypto.createHash('sha1');
    shasumCurrent.update(password);
    if (this.password === shasumCurrent.digest() && newpassword === validation) {
        var shasumNew = crypto.createHash('sha1');
        shasumNew.update(newpassword);
        this.password = shasumNew.digest();
        this.save(function(err) {
            if (typeof callback === "function") {
                callback(err);
            }
        });
    } else {
        return false;
    }
};
User.prototype.setPassword = function setPassword(password) {
    var shasumCurrent = crypto.createHash('sha1');
    shasumCurrent.update(password);
    this.password = shasumCurrent.digest();
};
//bootweb.mongoose.model('User',User);
schema.automigrate();
exports.User = User;
