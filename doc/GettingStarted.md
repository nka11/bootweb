x Steps guide for getting started with bootweb
==============================================

Create a project
----------------

First install node+npm then run :

    sudo npm install -g bootweb

Go to your workspace directory then run :

    bootweb create projectName

This will create a populated tree of a bootweb applications server and a basic
runnable script with builtin user registration/authentication (forms and controllers)
plus access to the ACL API


Customize your project
----------------------
Modify these files :
    projectName/config/config.json
    projectName/resources/templates/layout.html

Put custom web resources in `projectName/resources/static`
    


Run your server
---------------
    node lib/server.js

Production mode pseudo-cluster
------------------------------

Database optimization considerations
------------------------------------