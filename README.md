bootweb
=======

Boot your web server

Everything needed for a quick application server bootstrap.
(requires mongodb but may be overridable soon)

Bootweb implements MVC pattern using 3 dedicated components :

Model : mongoose API to mongodb for Object Persistency Layer (http://mongoosejs.com/docs/api.html#model_Model )

View : The swig template engine (http://paularmstrong.github.io/swig/docs/)

Controller : expressjs and a websocket extension using socketio (http://expressjs.com/api.html )

Bootweb implements and configure a default authentication and ACL model.
Authentication uses passport-js API and bootweb handles session identification
in expressjs and websocket.

Any passport module can be configured.

ACL system implements RBAC rules with a resource oriented permission pattern.

Bootweb just glue all components and allows to set up in minutes a single webAppp.

Installation
------------

Dependencies :

node 0.8.x (some updates in the roadmap) and npm

    sudo apt-get install mongodb
    git clone https://github.com/nka11/bootweb
    cd bootweb
    npm install
    npm link

Run tests :

    sudo npm install -g vows # install run test suite
    ./node_modules/vows/bin/vows --spec tests/main.js
    
Getting Started
---------------

# Start an application server - https://github.com/nka11/bootweb/blob/master/doc/AppServer.md
# Build an application - https://github.com/nka11/bootweb/blob/master/doc/App.md
# Use Authentication and ACL - https://github.com/nka11/bootweb/blob/master/doc/AuthAndACL.md


More doc to come soon, for the impatient, tweet @nka_11