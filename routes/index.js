/* Copyright (c) 2015 Garry T. Williams */

var express = require('express');
var router  = express.Router();
var config  = require('../config.json');
var crypto  = require('crypto');
var pg      = require('pg');
var conn    = "postgres://" + config.dbuser + ":" + config.dbpass +
	      "@localhost/dbaa";
var client  = new pg.Client(conn);
var mailer  = require('nodemailer');
var smtp    = require('nodemailer-smtp-transport');
var mail    = mailer.createTransport(smtp({
    debug: true,
    service: 'SES',
    host: 'email-smtp.us-west-2.amazonaws.com',
    auth: {
	user: config.smtpuser,
	pass: config.smtppass
    }
}));

client.connect();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Welcome to the DBAA Home Page' });
});

/* GET newsletters */
router.get('/newsletters', function(req, res, next) {
    res.render('newsletters', { title: 'DBAA Newsletters' });
});

router.get('/create-new-login/:id', function(req, res, next) {
    var q = "SELECT e_mail\n" +
            "  FROM e_mail_campaign\n" +
            " WHERE id = $1";
    client.query(q, [ req.params.id ], function (err, result, done) {
	if (result.rows.length == 0) {
	    var err = new Error('Not Found');
	    err.status = 404;
	    next(err);
	}

	/* Show sign-up form */
	res.render('/create-login', {
	    title  : 'Create My DBAA Login',
	    id     : req.params.id,
	    e_mail : result.rows[0].id
	});
    });
});

router.post('/create-login', function(req, res, next) {
});

/* Create a new login ID */
router.post('/create-new-login', function(req, res, next) {
    /* Hmmm.  This is an internal error, I guess.  Should probably
     * handle it differently. */
    if (req.body.login_name === undefined || req.body.login_name == "")
	return res.render('create-login', {title: 'Create User Login'});

    /* We record a unique ID associated with this E-mail address and
     * make that the URL the user will use coming back to us.  We know
     * it's him this way. */
    var id = crypto.randomBytes(20).toString('hex');
    var q  = "INSERT INTO e_mail_campaign\n" +
	     "    (e_mail, id, name, campaign)\n" +
             "VALUES ($1, $2, 'Create Login', 0)";

    /* Record the unique value to associate with this E-mail address. */
    client.query(q, [ req.body.login_name, id ],
       	function (err, result, done) {
	    if (err)
		return res.render('error', err);

	    /* Send the E-mail with the unique, unguessable value that
	     * we can look up in the database to get the E-mail
	     * address later. */
	    mail.sendMail({
		from: "Garry Williams <gtwilliams@gmail.com>",
		to: req.body.login_name,
		subject: "Create Login on DBAA Web Site",
		text: "Go here to complete your sign-up: " +
		    req.protocol + "://" + req.hostname +
		    req.baseUrl + "/" + id
	    }, function (err, info) {
		if (err) {
		    console.log("send E-mail failed: " + err);
		    res.render('mail-send-error', {
			title  : 'Send E-mail Error',
			e_mail : req.body.login_name,
			error  : err
		    });

		    /* If the E-mail message never went out, no need
		     * to remember the E-mail address. */
		    var q = "DELETE FROM e_mail_campaign\n" +
		            " WHERE id = $1";
		    client.query(q, [ id ],
			function (err, result, done) {
			    if (err)
				return res.render('error', err);
		    });
		}
	    });
	}
    );

    return res.render('sent-mail', {
	e_mail : req.body.login_name,
	title  : 'E-mail Sent'
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
