/* Copyright (c) 2015 Garry T. Williams */

var express = require('express');
var router  = express.Router();
var config  = require('../config.json');
var crypto  = require('crypto');
var bcrypt  = require('bcryptjs');
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
    res.render('index', {
        title: 'Welcome to the DBAA Home Page',
        login: req.session.name
    });
});

/* GET newsletters */
router.get('/newsletters', function(req, res, next) {
    res.render('newsletters', { title: 'DBAA Newsletters' });
});

router.get('/create-login/:id', function(req, res, next) {
    var q = "SELECT id, e_mail\n" +
            "  FROM e_mail_campaign\n" +
            " WHERE id = $1";
    client.query(q, [ req.params.id ], function (err, result, done) {
        if (result.rows.length == 0) {
            var err = new Error('Not Found');
            err.status = 404;
            return next(err);
        }

        /* Show sign-up form */
        res.render('create-login', {
            title  : 'Create My DBAA Login',
            id     : result.rows[0].id,
            e_mail : result.rows[0].e_mail
        });
    });
});

router.post('/create-login', function(req, res, next) {
    /* Validate input data */
    var q = "SELECT id, e_mail\n" +
            "  FROM e_mail_campaign\n" +
            " WHERE id = $1";
    client.query(q, [ req.body.id ], function (err, result, done) {
        if (err)
            return res.render('error', err);

        /* The end-user never sees the unique ID in this form -- it's
         * supplied in a hidden input element.  So, if it's invalid,
         * we will give a 404 error since it should never happen
         * unless something fishy is going on out there. */
        if (result.rows.length == 0) {
            console.log("can't find id=" + req.body.id +
                " in the e_mail_canpaign table");
            var err = new Error('Not Found');
            err.status = 404;
            return next(err);
        }

        /* Again, the user shouldn't have a way to do this since the
         * browser checks the data before allowing the post.  We will
         * just issue a 404 since we don't want to be friendly to the
         * other end on these sorts of errors. */
        if (req.body.password != req.body.duppassword ||
            req.body.name == "")
        {
            console.log("user's passwords don't match");
            var err = new Error('Not Found');
            err.status = 404;
            return next(err);
        }

        /* Create the login ID */
        q = "INSERT INTO users (login, password, name, e_mail)\n" +
            "VALUES ($1, $2, $3, $4)";
        bcrypt.hash(req.body.password, 8, function (err, hash) {
            if (err)
                return res.render('error', err);

            client.query(q, [ req.body.e_mail, hash, req.body.name,
                req.body.e_mail ], function (err, result, done) {
                if (err) {
                    console.log("Error trying to insert new login ID");
                    err.status = 500;
                    return next(err);
                }

                /* Set session to logged in */
                req.session.authenticated = true;
                req.session.name = req.body.name;
                return res.render('index', {
                    title: 'Welcome to the DBAA Home Page',
                    login: req.session.name
                });
            });
        });
    });
});

/* Create a new login ID */
router.post('/create-new-login', function(req, res, next) {
    /* Hmmm.  This is an internal error, I guess.  Should probably
     * handle it differently. */
    if (req.body.login_name === undefined || req.body.login_name == "")
        return res.render('create-new-login', {title: 'Create User Login'});

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
                    req.protocol + "://" + req.get('host') +
                    "/create-login/" + id
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

                    return;
                }

                else {
                    return res.render('sent-mail', {
                        e_mail : req.body.login_name,
                        title  : 'E-mail Sent'
                    });
                }
            });
        }
    );
});

router.get('/create-new-login', function(req, res, next) {
    res.render('create-new-login', {title: 'Create User Login'});
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

// vim: sw=4 sts=4 ts=8 ai et syn=javascript
