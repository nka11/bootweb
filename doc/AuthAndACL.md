 h1. Authentication & ACL
 
 Bootweb brings a convenient API for handling authentication and ACL.
 
 h2. HTTP routes
 The following routes are provided :
 
  * POST "/register" params required : email, pseudo, password. It sends a mail with a link to
  * GET "/activate/xxx/xxx" - It handles the previously mailed link and validates a user
  * POST "/login" params required : username and email.
  * GET "/logout" disconnects the user session.

h2. The user session
if no user is connected, req.user is a specific predefined object :

    {
      email: "anonymous",
      pseudo: "anonymous"
    }
 
If the user is connected, the req.user is filled with connected user values, the given object is a juggling object model instance.

h2. Configuring ACL

ACL is manager using a common Role Based Access Control Pattern.
Add a role to a user :
    bootweb.ACL.addUserRole(user, "testRole", callback);
Allow a role to an action on a resource (url)
    bootweb.ACL.addPermissions("/",userRole, ["read"], callback);

TODO : removeUserRole and removePermission

h2. Authorization check
 
Allows dev to check ACL for a route :
 
    app.get('/path/to/res',bootweb.auth.verify("read"), function(req,res,next){res.send("allowed");});
NOTE: the verify string param is mandatory. If not specified, the last part of url will be used. The example above and the folloging line are equivalent :
    app.get('/path/to/res/read',bootweb.auth.verify(), function(req,res,next){res.send("allowed");});

