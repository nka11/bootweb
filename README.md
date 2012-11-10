bootweb
=======

Boot your web server

Everything needed for a quick application server bootstrap.
(requires mongodb but may be overridable soon)

Dependencies :

    apt-get install mongodb
    
    npm install express@3.0.1 log4js vows mongoose emailjs nconf passport passport-local jugglingdb

Run sample :

    node samples/standard/server.js