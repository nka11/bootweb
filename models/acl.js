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

ACL = schema.define('ACL',{
    resource: { type: String, index: true  },
    permissions: { type: bootweb.db.Schema.JSON }
});
ACL.belongsTo(Role,{as: 'role', foreignKey: "roleId"});

ACL.getUserPermissions = function getUserPermissions(resource,username, cb) {
    UserRoles.findOne({where:{username: username}}, function(err, userRoles) {
        if (err) {
            return cb(err);
        }
        if (userRoles) {
            ACL.where('resource',resource).
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
ACL.addPermissions = function addPermissions(resource,role, permissions, cb) {
    logger.info("addPermission START");
    logger.debug({resource:resource,role:role, permissions:permissions});
    var findACL = function(role) {

        logger.debug(_.inspect({where:{resource: resource, roleId: role.id}}));
        ACL.findOne({where:{resource: resource, roleId: role.id}}, function(err, acl){
            logger.info("ACL find result : " + _.inspect({err: err, acl: acl}))
            if (err != null) {
                return cb(err);
            }
            if (acl == null) {
                logger.info("No acl found, creating a new object");
                return ACL.create({
                    resource: resource,
                    permissions: permissions,
                    roleId: role.id
                }, function(err,acl) {
                    if (err != null) {
                        return cb(err);
                    }
                    cb(err, acl);
                    /*logger.info("Adding role to ACL " + _.inspect(role));
                    acl.role(role);
                    return acl.save( function(err){
                         if (err != null) {
                            return cb(err);
                        }
                        cb(err, acl);
                    });*/
                });
            }
            logger.info("acl found, processing add permission to existing object");
            //for (permid in permissions) {
            permissions.forEach(function(perm){
                if (acl.permissions.indexOf(perm) < 0) {
                    acl.permissions.push(perm);
                }
            });
            //} 
            acl.save(function(err) {
                if (err) {
                    return cb(err);
                }
                logger.info("addPermission acl : " + _.inspect(acl));
                cb(null,acl);
            });
        
        });
    };
    if (typeof role === "String") {
        return Role.findOne({where:{roleName: role}}, function(err, role) {
            if (err) {
                return cb(err);
            }
            if (role) {
                findACL(role);
            } else {
                Role.create({roleName: role}, function(err,role){
                    if (err) {
                        return cb(err);
                    }
                    findACL(role);
                });
            }
        });
        
    }
    findACL(role);
};

exports.Role = Role;
exports.ACL = ACL;