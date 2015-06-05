/* Copyright (c) 2015 Garry T. Williams */

var router  = require('express').Router();
var config  = require('../config.json');
var bcrypt  = require('bcryptjs');
var pg      = require('pg');
var conn    = "postgres://" + config.dbuser + ":" + config.dbpass +
              "@localhost/dbaa";
var db      = new pg.Client(conn);

db.connect();

function get_myaccount(db, e_mail, callback) {
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
            "               d.e_mail,\n" +
            "               n.type,\n" +
            "               n.number\n" +
            "          FROM directory d\n" +
            "          LEFT OUTER JOIN phone_number n\n" +
            "            ON d.id = n.directory\n" +
            "       ) d\n" +
            "    ON u.e_mail = d.e_mail\n" +
            " WHERE u.e_mail = $1";
    db.query(q, [ e_mail ], function (err, results) {
        if (err) {
            console.log("Retrieving user data: " + err);
            err.status = 500;
            callback(err);
            return;
        }

        if (results.rows.length === 0) {
            console.log("No user data: " + e_mail);
            var e = new Error('Not Found');
            e.status = 404;
            callback(e);
            return;
        }

        var q_types = "SELECT name\n" +
                      "  FROM phone_number_types\n" +
                      " ORDER BY sort";
        db.query(q_types, function (err2, result2) {
            if (err2) {
                console.log("Retrieving phone number types: " + err2);
                err2.status = 500;
                callback(err2);
                return;
            }

            if (result2.rows.length === 0) {
                console.log("No phone number types: " +
                    e_mail);
                var e = new Error('Not Found');
                e.status = 404;
                callback(e);
                return;
            }

            var p_types = result2.rows.map(function (e, i) {
                return e.name;
            });

            /* Return the user record */
            var uid = results.rows[0].id;
            var fn  = results.rows[0].d_first || results.rows[0].first_name;
            var ln  = results.rows[0].d_last  || results.rows[0].last_name;
            var aid = results.rows[0].acbl;
            var pn;
            if (results.rows[0].d_last !== '') {
                pn = results.rows.map(function (e, i) {
                    return { type : e.type, number : e.number };
                });
            }

            var acct = {
                title: 'My Account',
                dir:   results.rows[0].d_last != '',
                login: e_mail,
                uid:   uid,
                fn:    fn,
                ln:    ln,
                acbl:  aid,
                phone: pn,
                name:  [fn, ln].join(' '),
                ph_t:  p_types
            };

            callback(null, acct);
            return;
        });
    });
}

function add_phone_number(uid, type, number, callback) {
    q = "INSERT INTO phone_number\n" +
        "    (directory, type, number)\n" +
        "VALUES ($1, $2, $3)";
    db.query(q, [ uid, type, number ], function (err) {
        if (err) {
            console.log("Inserting new phone number: " + err);
            err.status = 500;
            callback(err2);
        }

        callback(null);
    });
}

router.get('/myaccount', function (req, res, next) {
    get_myaccount(db, req.session.e_mail, function (err, acct) {
        if (err)
            return next(err);

        return res.render('my-account', acct);
    });
});

router.post('/myaccount', function (req, res, next) {
    get_myaccount(db, req.session.e_mail, function (err, acct) {
        if (err)
            return next(err);

        /* If no directory entry yet, insert a new one. */
        if (!acct.dir) {
            var q = "INSERT INTO directory\n" +
                    "    (e_mail, first_name, last_name, acbl)\n" +
                    "VALUES ($1, $2, $3, $4)";
            db.query(q, [ acct.login, acct.fn, acct.ln,
                req.body.acbl ], function (err)
            {
                if (err) {
                    console.log("Inserting new directory entry: " +
                        err);
                    err.status = 500;
                    return next(err);
                }

                /* XXX validate phone number */
                /* Add a phone number. */
                if (req.body.new_phone_number !== '') {
                    add_phone_number(acct.uid,
                        req.body.new_phone_type,
                        req.body.new_phone_number, function (e) {

                        acct.pn = [{
                            type: req.body.new_phone_type,
                            number: req.body.new_phone_number
                        }];

                        return res.render('my-account', acct);
                    });
                }
            });
        }

        /* We have a directory, so need to update and/or add phone
         * number. */
        var update_these = [];
        if (req.body.fn != acct.fn) {
            update_these.push(['first_name', req.body.fn]);
        }

        if (req.body.ln != acct.ln) {
            update_these.push(['last_name', req.body.ln]);
        }

        if (req.body.acbl != acct.acbl) {
            update_these.push(['acbl', req.body.acbl]);
        }

        if (update_these.length != 0) {
            var q = "UPDATE directory SET\n" +
                update_these.map(function (e, i) {
                    return e[0] + ' = $' + i;
                }).join(",\n");
            db.query(q, update_these.map(function (e, i) {
                return e[1];
            }), function (err) {
                if (err) {
                    console.log("Updating directory entry: " + err);
                    err.status = 500;
                    return next(err);
                }
                /* XXX validate phone number */
                /* Add a phone number. */
                if (req.body.new_phone_number !== '') {
                    add_phone_number(acct.uid,
                        req.body.new_phone_type,
                        req.body.new_phone_number, function (e) {

                        acct.pn.push({
                            type: req.body.new_phone_type,
                            number: req.body.new_phone_number
                        });

                        return res.render('my-account', acct);
                    });
                    q = "INSERT INTO phone_number\n" +
                        "    (directory, type, number)\n" +
                        "VALUES ($1, $2, $3)";
                    db.query(q, acct.uid, req.body.new_phone_type,
                        req.body.new_phone_number ], function (err2)
                    {
                        if (err2) {
                            console.log("Inserting new phone number: " +
                                err2);
                            err2.status = 500;
                            return next(err2);
                        }

                        acct.pn = [{
                            type: req.body.new_phone_type,
                            number: req.body.new_phone_number
                        }];

                        return res.render('my-account', acct);
                    });
                }
            });
        }
    });
});

module.exports = router;

// vim: sw=4 sts=4 ts=8 ai et syn=javascript
