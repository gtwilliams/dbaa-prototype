/* Copyright (c) 2015 Garry T. Williams */

var express = require('express');
var session = require('express-session');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

var Redis = require('connect-redis')(session);

app.locals.pretty = true;

// view engine setup
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/images/favicon.gif'));
app.use(logger('short'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

/* Initialize session handler and store. */
(function () {
    var config = require('./config.json');
    app.use(session({
        resave: true,
        saveUninitialzed: true,
        secret: config.session_secret,
        store: new Redis({
            host: 'localhost',
            port:6379
        })
    }));
})();

app.use(express.static(__dirname + '/public'));

/* Hook up all route files. */
(function () {
    var files = require('glob').sync(__dirname + '/routes/*.js');
    for (var i = 0; i < files.length; i++) {
        console.log("app.use('/', require('" + files[i] + "'));");
        app.use('/', require(files[i]));
    }
})();

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;

// vim: sw=4 sts=4 ts=8 ai et syn=javascript
