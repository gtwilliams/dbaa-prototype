/* Copyright (c) 2015 Garry T. Williams */

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Welcome to the DBAA Home Page' });
});

/* GET newsletters */
router.get('/newsletters', function(req, res, next) {
    res.render('newsletters', { title: 'DBAA Newsletters' });
});

module.exports = router;

// vim sw=4 sts=4 ts=8 ai et syn=javascript
