/* Copyright (c) 2015 Garry T. Williams */

var express = require('express');
var router  = express.Router();
var config  = require('../config.json');
var pg      = require('pg');
var conn    = "postgres://" + config.dbuser + ":" + config.dbpass +
              "@localhost/dbaa";
var db      = new pg.Client(conn);

db.connect();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'Welcome to the DBAA Home Page',
        login: req.session.e_mail,
        name: req.session.name
    });
});

/* GET newsletters */
router.get('/newsletters', function (req, res, next) {
    res.render('newsletters', {
        title: 'DBAA Newsletters',
        login: req.session.e_mail,
        name: req.session.name
    });
});

module.exports = router;

// vim: sw=4 sts=4 ts=8 ai et syn=javascript
