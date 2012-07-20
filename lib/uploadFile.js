/*

Bootweb $version - boot your web app
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

var bootweb = require('./bootweb'),
    _ = require('util'),
    logger = bootweb.getLogger("as.fileUpload");
    
// Middleware for an HTML5 fileupload request
exports.fileUpload = function(req,res,next){
    var data='';
    //logger.info(_.inspect(req.headers));
    if ('x-file-name' in req.headers && 'content-type' in req.headers) {
        req.on('data', function(chunk) { 
            data += chunk;
        });
        req.on('end', function() {
            var 
                binary = data,
                fileType = req.headers['content-type'];
            if (req.headers['content-type'].indexOf(";base64") > 0) {
                //logger.info(_.inspect(data.substr(0,100)));
                if (data.indexOf('data') === 0) {
                    data = data.replace(/data:.*;base64,(.*)/,"$1");
                }
                //logger.info(_.inspect(data.substr(0,100)));
                binary = new Buffer(data, 'base64');
                fileType = req.headers['content-type'].replace(/(.*);base64/,"$1");
            }
            req.file = {
                binary : binary,
                type: fileType,
                name : req.headers['x-file-name']
            };
            //logger.info(_.inspect(req.file));
            next();
        });
    } else {
        next();
    }
};