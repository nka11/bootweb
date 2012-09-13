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

var bootweb =  require("../lib/bootweb"),
    schema = bootweb.getSchema(),
    _ = require('util'),
    logger = bootweb.getLogger("acl.manager"),
    users = require("./users"),
    UserRoles,ACL,Role,Permission;

Role = schema.define('Role',{
    roleName: {type:String, index: true},
    description: {type:String}
});

UserRoles = schema.define('UserRoles',{
});

UserRoles.belongsTo(Role,{as: 'role', foreignKey: 'roleId'});
UserRoles.belongsTo(users.User, {as: 'user', foreignKey: 'userId'});

Permission = schema.define('Permission',{
	name: {type: String, index: true}
})
ACL = schema.define('ACL',{
    resourceId: { type: String, index: true  }
    });
ACL.belongsTo(Role,{as: 'role', foreignKey: "roleId"});
ACL.belongsTo(Permission,{as:'permissions', foreignKey:"permissionId"})

ACL.getUserPermissions = function getUserPermissions(resourceId,username, cb) {
    UserRoles.findOne({where:{username: username}}, function(err, userRoles) {
        if (err) {
            return cb(err);
        }
        if (userRoles) {
            ACL.where('resourceId',resourceId).
                where('role')['in'](userRoles.roles).exec(function(err, acls) {
                var permissions, aclid, permid;
                if (err) {
                    return cb(err);
                }
                if (acls) {
                    for (aclid in acls) {
                        if (typeof permissions === 'undefined') {
                            permissions = acls[aclid].permissions;
                        } else {
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
        } else {
            return cb(null,null);
        }
    });
};

ACL.isAuthorized = function isAuthorized(userName, resourceId, permission, cb) {
    logger.info("isAuthorized START");
    UserRoles.findOne({username: userName}, function(err, userRoles) {
        if (err !== null) {
            return cb(err);
        }
        if (userRoles !== null) {
            logger.info("userRoles : " + _.inspect(userRoles));
            ACL.where('resourceId',resourceId).
             where('role')['in'](userRoles.roles).exec(function(err, acls) {
                logger.info("ACL.where : " + _.inspect(acls));
                var aclid;
                if (err) {
                    return cb(err);
                }
                for (aclid in acls) {
                    if (acls[aclid].permissions.indexOf(permission) > -1 ) {
                        // User is granted for action on resource
                        return cb(null, true);
                    }
                }
                // No matching permission found, user not granted
                return cb(null, false);
            });
        } else {
            cb(null,false);
        }
    });
};

ACL.addUserRole = function addUserRole(user, roleName, cb) {
    var 
        findUserRole = function(role) {
			logger.info("Entered findUserRole");
            logger.debug(_.inspect({role:role, user:user}));
            UserRoles.findOne({where:{userId: user.id, roleId: role.id}}, function(err, userRoles) {
                logger.info("Entered UserRoles.findOne");
                logger.debug( _.inspect({err:err,userRoles: userRoles}));
                if (err != null) {
                    return cb(err);
                }
                if (userRoles == null) {
        			logger.info("userRoles is null");
                    userRoles = new UserRoles();
                    userRoles.user(user);
                    userRoles.role(role);
                    userRoles.save(function(err) {
        				logger.info("Entered UserRoles.save");
        				logger.debug( _.inspect({err:err}) + " for user " + userRoles.user());
                        if (err != null) {
                            return cb(err);
                        }
                        return cb(err, userRoles);
                    });
                } else {
                    cb(null, userRoles);
                }
            });
        },
        findRole = function(user) {
            Role.findOne({where:{roleName: roleName}}, function(err, role) {
                logger.info("Entered Role.findOne");
                logger.debug(_.inspect({err:err,role: role}));
                if (err != null) {
                    return cb(err);
                }
                if (role != null) {
                    return findUserRole(role);
                } 
                Role.create({roleName: roleName}, function(err, role){
                    role.save(function(err) {
        				logger.info("Entered role.save");
    					logger.debug(_.inspect({err:err, role: role}));
                        if (err != null) {
                            return cb(err);
                        }
                        return findUserRole(role);
                    });
                });
            });
        };
    logger.info("AddUserRole START");
    logger.debug(_.inspect({'user': user, 'roleName':roleName }));
    if (typeof user === "String") {
        return users.User.findOne({where: {pseudo: user}}, function(err, user) {
            if (err != null) {
                return cb(err);
            }
            if (user == null) {
                return cb("User doesn't exist");
            }
            return findRole(user);
        });
    } 
    return findRole(user);
   
};
ACL.removePermissions = function removePermission(resourceId,roleName, permissions, cb) {
	Role.findOne({roleName: roleName}, function(err, role) {
        if (err) {
            return cb(err);
        }
        if (role === null) {
			return cb(null);
        }
        ACL.findOne({resourceId: resourceId, role: role._id}, function(err, acl) {
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
ACL.addPermissions = function addPermissions(resourceId,role, permissions, cb) {
    logger.info("addPermission START");
    logger.debug({resourceId:resourceId,role:role, permissions:permissions});
    var addACLPermissions = function(acl) {
            var permid;
            for (permid in permissions) {
                if (!(permissions[permid] in acl.permissions)) {
                    acl.permissions.push(permissions[permid]);
                }
            }
            acl.save(function(err) {
                if (err) {
                    return cb(err);
                }
                logger.info("addPermission acl : " + _.inspect(acl));
                cb(null,acl);
            });
        },
        addAclRole = function(role) {
            ACL.findOne({where: {resourceId: resourceId, role: role._id}}, function(err, acl) {
                if (err) {
                    return cb(err);
                }
                if (acl) {
                    addACLPermissions(acl);
                } else {
                    acl = new ACL({resourceId: resourceId, role: role._id});
                    acl.save(function(err) {
                        if (err) {
                            return cb(err);
                        }
                        addACLPermissions(acl);
                    });
                }
            });
        };
    if (typeof role === "String") {
        return Role.findOne({where:{roleName: role}}, function(err, role) {
            if (err) {
                return cb(err);
            }
            if (role) {
                addAclRole(role);
            } else {
                Role.create({roleName: role}, function(err,role){
                    if (err) {
                        return cb(err);
                    }
                    addAclRole(role);
                });
            }
        });
        
    }
    addAclRole(role);
};

exports.Role = Role;
exports.ACL = ACL;