/* Copyright (c) 2015 Garry T. Williams */

var router  = require('express').Router();
var config  = require('../config.json');
var bcrypt  = require('bcryptjs');
var pg      = require('pg');
var conn    = "postgres://" + config.dbuser + ":" + config.dbpass +
              "@localhost/dbaa";
var db      = new pg.Client(conn);

db.connect();

router.get('/myaccount', function (req, res, next) {
    /* Retrieve the user's data. */
    var q = "SELECT u.id,\n" +
            "       u.first_name,\n" +
            "       u.last_name,\n" +
            "       d.acbl,\n" +
            "       d.first_name AS d_first,\n" +
            "       d.last_name  AS d_last,\n" +
            "       d.type,\n" +
            "       d.number\n" +
            "  FROM users u\n" +
            "  LEFT OUTER JOIN (\n" +
            "        SELECT d.id,\n" +
            "               d.first_name,\n" +
            "               d.last_name,\n" +
            "               d.acbl,\n" +
            "               n.type,\n" +
            "               n.number\n" +
            "          FROM directory d\n" +
            "          LEFT OUTER JOIN phone_number n\n" +
            "            ON d.id = n.directory\n" +
            "       ) d\n" +
            "    ON u.id = d.id\n" +
            " WHERE u.e_mail = $1";
    db.query(q, [ req.session.e_mail ], function (err, result, done) {
        if (err) {
            console.log("Retrieving user data: " + err);
            err.status = 500;
            return next(err);
        }

        if (result.rows.length == 0) {
            console.log("No user data: " + req.session.email);
            var e = new Error('Not Found');
            e.status = 404;
            return next(e);
        }

        var q_types = "SELECT name\n" +
                      "  FROM phone_number_types\n" +
                      " ORDER BY sort";
        db.query(q_types, function (err2, result2, done2) {
            if (err2) {
                console.log("Retrieving phone number types: " + err2);
                err2.status = 500;
                return next(err2);
            }

            if (result2.rows.length == 0) {
                console.log("No phone number types: " +
                    req.session.email);
                var e = new Error('Not Found');
                e.status = 404;
                return next(e);
            }

            var p_types = result2.rows.map(function (e, i) {
                return e.name;
            });

            /* Display the user's data for edit. */
            var uid = result.rows[0].id;
            var fn  = result.rows[0].first_name;
            var ln  = result.rows[0].last_name;
            var aid = result.rows[0].acbl;
            var pn  = [];
            if (result.rows[0].acbl) {
                pn = result.rows.map(function (e, i) {
                    return { type : e.type, number : e.number };
                });
            }

            res.render('my-account', {
                title: 'My Account',
                login: req.session.e_mail,
                uid:   uid,
                fn:    fn,
                ln:    ln,
                acbl:  aid,
                phone: pn,
                name:  [fn, ln].join(' '),
                ph_t:  p_types
            });
        });
    });
});

router.post('/myaccount', function (req, res, next) {
});

module.exports = router;

// vim: sw=4 sts=4 ts=8 ai et syn=javascript
