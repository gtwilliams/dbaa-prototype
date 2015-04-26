/* Copyright (c) 2015 Garry T. Williams */

var express = require('express');
var router  = express.Router();
var pg      = require('pg');
var conn    = "postgres://garry:Fia2gom2@localhost/dbaa";
var client  = new pg.Client(conn);
var mailer  = require('nodemailer');
var mail    = mailer.createTransport();

client.connect();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Welcome to the DBAA Home Page' });
});

/* GET newsletters */
router.get('/newsletters', function(req, res, next) {
    res.render('newsletters', { title: 'DBAA Newsletters' });
});

/* For POST, you need body-parser and parameters show up in
 * req.body.PARAM.  For GET, they automatically show up in
 * req.query.PARAM. */
/* Create a new login ID */
router.post('/create-new-login', function(req, res, next) {
    if (req.body.login_name === undefined)
	return res.render('create-login', {title: 'Create User Login'});
    mail.sendMail({
	from: "gtwilliams@gmail.com",
	to: req.body.login_name,
	subject: "Create Login on DBAA Web Site",
	text: "Go here: foo.com"
    }, function (err, info) {
	if (err) {
	    console.log("Oops: " + err);
	}
    });
});

router.get('/create-new-login', function(req, res, next) {
    res.render('create-login', {title: 'Create User Login'});
});

/* GET test E-mail link */
var q = "SELECT name, e_mail, campaign\n" +
        "  FROM e_mail_campaign\n" +
        " WHERE id = $1";
router.get('/campaign/:id', function(req, res, next) {
    console.log("id:", req.params.id);
    client.query(q, [ req.params.id ], function (err, result) {
        if (err)
            return res.render('error', err);

        if (result.rows.length == 0)
            return res.render('internal-error',
                { detail: "can't find E-mail campaign ID " +
                    req.params.id});

        console.log(result.rows[0].name + "|" +
            result.rows[0].e_mail + "|" + result.rows[0].campaign);

        return res.render('newsletters', { title:
            'DBAA Newsletters' });
    });
});

module.exports = router;

// vim sw=4 sts=4 ts=8 ai et syn=javascript
