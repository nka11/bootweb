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



var salt = 's0m3s3cr3t5a1t';

function calcHash(pass, salt) {
    var crypto = require('crypto');
    var hash = crypto.createHash('sha256');
    hash.update(pass);
    hash.update(salt);
    return hash.digest('base64');
};

User.prototype.validPassword = function validPassword(password) {
    return this.password === calcHash(password, salt);
};

User.setter.password = function (password) {
    this._password = calcHash(password, salt);
};

User.prototype.changePassword = function changePassword(password,newpassword, validation, callback) {
    if (this.password === calcHash(password,salt) && newpassword === validation) {
        this.password = newpassword;
        this.save(function(err) {
            if (typeof callback === "function") {
                callback(err);
            }
        });
    } else {
        return false;
    }
};
//bootweb.mongoose.model('User',User);
schema.automigrate();
exports.User = User;
