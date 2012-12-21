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
  Schema = bootweb.mongoose.Schema,
  conn = bootweb.getConnection(),
  ObjectId = Schema.ObjectId,
  _ = require('util'),
  logger = bootweb.getLogger("acl.manager"),
  UserRoles, ACL, Role, User;
require("./users");
var RoleSchema = new Schema({
  roleName: {
    type: String,
    required: true,
    index: {
      unique: true
    }
  },
  description: String
});
var UserRolesSchema = new Schema({
  userId: {
    type: ObjectId,
    required: true,
    index: {
      unique: true
    }
  },
  roles: [ObjectId]
});


var ACLSchema = new Schema({
  resourceId: {
    type: String,
    required: true,
    index: true
  },
  roleId: {
    type: String,
    required: true,
    index: true,
    ref: 'Role'
  },
  permissions: [String]
});


UserRolesSchema.methods.user = function(cb) {
  conn.model('User').findById(this.userId, cb);
}
ACLSchema.pre('save', function(next) {
  var acl = this;
  //logger.warn(_.inspect(this));
  var u = {}, a = [];
  for (var i = 0, l = acl.permissions.length; i < l; ++i) {
    if (u.hasOwnProperty(acl.permissions[i])) {
      continue;
    }
    a.push(acl.permissions[i]);
    u[acl.permissions[i]] = 1;
  }
  acl.permissions = a;
  next();
});
ACLSchema.statics.getUserPermissions = function getUserPermissions(resourceId, username, cb) {
  logger.info("getUserPermissions START");
  UserRoles.findOne({
    username: username
  }, function(err, userRoles) {
    if (err) {
      return cb(err);
    }
    if (userRoles) {
      ACL.where('resourceId', resourceId).
      where('role')['in'](userRoles.roles).exec(function(err, acls) {
        var permissions, aclid, permid;
        if (err) {
          return cb(err);
        }
        if (acls) {
          for (aclid in acls) {
            if (typeof permissions === 'undefined') {
              permissions = acls[aclid].permissions;
            }
            else {
              for (permid in acls[aclid]) {
                if (permissions.indexOf(acls[aclid][permid]) >= 0) {
                  permissions.push(acls[aclid][permid]);
                }
              }
            }
          }
        }
        return cb(null, permissions);
      });
    }
    else {
      return cb(null, null);
    }
  });
};

ACLSchema.statics.isAuthorized = function isAuthorized(userName, resourceId, permission, cb) {
  logger.info("isAuthorized START ('" + userName + "','" + resourceId + "','" + permission + "')");
  resourceId = resourceId.replace(/\/+$/, ""); // remove trailing / (if any)
  var __isAuthorized = function(err, userRoles) {
    if (err !== null) {
      return cb(err);
    }
    logger.info("isAuthorized userRoles : " + _.inspect(userRoles));
    if (userRoles !== null) {
      //ACL.find({}, function(err,res) {console.log(res)});
      var roles = [];
      userRoles.roles.forEach(function(role){roles.push(role.toString())});
      logger.debug("found rolesId : " + _.inspect(roles));
      ACL.where('resourceId', resourceId)
      ['in']('roleId',roles)
      .exec(function(err, acls) {
        logger.info("ACL.where : " + _.inspect(acls));
        var aclid;
        if (err) {
          return cb(err);
        }
        for (aclid in acls) {
          if (acls[aclid].permissions.indexOf(permission) > -1) {
            // User is granted for action on resource
            return cb(null, true);
          }
        }
        // No matching permission found, user not granted
        return cb(null, false);
      });
    }
    else {
      cb(null, false);
    }
  },
  _isAuthorized = function(user) {
    if (user == null) {
      user = {
        _id: "anonymous"
      }
    }
    UserRoles.findOne({
      userId: user._id
    }, __isAuthorized);
  };
  if (typeof userName === "string") {
    User.findOne({
      pseudo: userName
    }, function(err, user) {
      if (err !== null) {
        return cb(err)
      };
      _isAuthorized(user)
    })
  }
  else {
    _isAuthorized(userName);
  }

};

ACLSchema.statics.addUserRole = function addUserRole(userName, roleName, cb) {
  var user, adduserRole = function(userRoles, role) {
    logger.info("adduserRole START");
    /*logger.debug(_.inspect({
      userRoles: userRoles,
      role: role
    })); */
    if (userRoles.roles.indexOf(role._id) < 0) {
      userRoles.roles.push(role._id);
      userRoles.save(function(err) {
        if (err !== null) {
          if (typeof cb === "function") return cb(err);
        }
        if (typeof cb === "function") cb(null, userRoles);
      });
    }
    else {
      if (typeof cb === "function") cb(null, userRoles);
    }
  },
  addRole = function(userRoles) {
    logger.info("addRole START");
    /*logger.info("Entered addRole");
    logger.debug(_.inspect({
      userRoles: userRoles
    }));*/
    Role.findOne({
      roleName: roleName
    }, function(err, role) {
      logger.info("Entered Role.findOne");
      logger.debug(_.inspect({
        err: err,
        role: role
      }));
      if (err !== null) {
        return cb(err);
      }
      if (role !== null) {
        adduserRole(userRoles, role);
      }
      else {
        role = new Role({
          roleName: roleName
        });
        role.save(function(err) {
          //logger.info("Entered role.save");
          /*logger.debug(_.inspect({
            err: err
          })); */
          if (err !== null) {
            return cb(err);
          }
          adduserRole(userRoles, role);
        });
      }
    });
  },
  _addUserRole = function() {
    UserRoles.findOne({
      userId: user._id
    }, function(err, userRoles) {
      /*logger.info("Entered UserRoles.findOne");
      logger.debug(_.inspect({
        err: err,
        userRoles: userRoles
      }));*/
      if (err !== null) {
        return cb(err);
      }
      if (userRoles === null) {
        //logger.info("userRoles is null");
        userRoles = new UserRoles({
          userId: user._id
        });
        userRoles.save(function(err) {
          //logger.info("Entered UserRoles.save");
          logger.debug(_.inspect({
            err: err
          }));
          if (err !== null) {
            return cb(err);
          }
          addRole(userRoles);
        });
      }
      else {
        addRole(userRoles);
      }
    });
  };
  /*logger.info("AddUserRole START");
  logger.debug(_.inspect({
    'userName': userName,
    'roleName': roleName
  })); */
  if (typeof userName === "string") {
    return conn.model('User').findOne({
      pseudo: userName
    }, function(err, foundUser) {
      if (err != null) {
        cb(err);
      }
      user = foundUser;
      return _addUserRole();
    });
  }
  else {
    user = userName;
    return _addUserRole();
  }

};
ACLSchema.statics.removePermissions = function removePermission(resourceId, roleName, permissions, cb) {
  logger.info("removePermissions START");
  resourceId = resourceId.replace(/\/+$/, ""); // remove trailing / (if any)
  Role.findOne({
    roleName: roleName
  }, function(err, role) {
    if (err) {
      return cb(err);
    }
    if (role === null) {
      return cb(null);
    }
    ACL.findOne({
      resourceId: resourceId,
      roleId: role._id
    }, function(err, acl) {
      if (err !== null) {
        return cb(err);
      }
      permissions.forEach(function(permission) {
        if (acl.permissions.indexOf(permission) >= 0) {
          acl.permissions.splice(acl.permissions.indexOf(permission), 1);
        }
      });
      acl.save(function(err) {
        if (err !== null) {
          return cb(err);
        }
        return cb(null);
      });
    });
  });
};
ACLSchema.statics.addPermissions = function addPermissions(resourceId, roleName, permissions, cb) {
  logger.info("addPermission START");
  resourceId = resourceId.replace(/\/+$/, ""); // remove trailing / (if any)
  logger.debug({
    resourceId: resourceId,
    roleName: roleName,
    permissions: permissions
  });
  var addACLPermissions = function(acl) {
    var permid;
    for (permid in permissions) {
      if (acl.permissions.indexOf(permissions[permid]) < 0) {
        acl.permissions.push(permissions[permid]);
      }
    }
    acl.save(function(err) {
      if (err) {
        return cb(err);
      }
      logger.info("addPermission END, acl : " + _.inspect(acl));
      cb(null, acl);
    });
  },
  addAclRole = function(role) {
    ACL.findOne({
      resourceId: resourceId,
      roleId: role._id.toString()
    }, function(err, acl) {
      if (err) {
        return cb(err);
      }
      if (acl) {
        addACLPermissions(acl);
      }
      else {
        acl = new ACL({
          resourceId: resourceId,
          roleId: role._id
        });
        acl.save(function(err) {
          if (err) {
            return cb(err);
          }
          addACLPermissions(acl);
        });
      }
    });
  };
  if (typeof roleName === "string") {
    Role.findOne({
      roleName: roleName
    }, function(err, role) {
      if (err) {
        return cb(err);
      }
      if (role) {
        addAclRole(role);
      }
      else {
        role = new Role({
          roleName: roleName
        });
        role.save(function(err) {
          if (err) {
            return cb(err);
          }
          addAclRole(role);
        });
      }
    });

  }
  else if (roleName instanceof Role) {
    logger.debug("roleName is a Role");
    addAclRole(roleName);
  }
  else if (roleName instanceof UserRoles) {
    cb("Cannot process, wrong type");
  }
  else {
    cb("Wrong Role : " + _.inspect(roleName));
  }

};

bootweb.mongoose.model('Role', RoleSchema);
bootweb.mongoose.model('UserRoles', UserRolesSchema);
bootweb.mongoose.model('ACL', ACLSchema);
UserRoles = conn.model('UserRoles');
ACL = conn.model('ACL');
Role = conn.model('Role');
User = conn.model('User');
ACL.Role = Role;
exports.ACL = ACL;