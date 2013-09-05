RestDB - Filesystem based expressjs Middleware
==============================================

Simple filesystem based rest database. designed as a expressjs middleware.


```
var fs      =   require('fs');
var path    =   require('path');
var express =   require('express');
var restdb  =   require('restdb');

var DATA_DIRECTORY = "data"

var app = express();
var port = process.env.PORT || 6060;

app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(function(req, res, next) {
        console.log('Request received for: ['+req.method+'] :'+req.url);
        next();
    });
    app.use(function(err, req, res, next){
        console.error(err.stack);
        res.send(500, 'Something broke!');
    });
    app.use(express.static('public'));


    function fnDataDirectory(req, res){ return DATA_DIRECTORY };
    function fnAuthenticate(req, res, next){
        next();
        //res.send(401, {status:401});
    };
    function fnGetOwnerId(req, res){ return 'mahes' };

    var rest_api_options = {
        datadir: fnDataDirectory,
        authenticate: fnAuthenticate,
        owner: fnGetOwnerId
    };


    // creates the following rest routes.
    // GET    /:entity
    // GET    /:entity/:id
    // PUT    /:entity/:id
    // POST   /:entity
    // DELETE /:entity/:id
    //        /admin/entities

	app.use('/api', restdb(rest_api_options).middleware);

});


var server = app.listen(port);


```

