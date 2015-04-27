-- Copyright (c) 2015 Garry T. Williams

CREATE SEQUENCE users_seq;

CREATE TABLE users (
    id       INTEGER NOT NULL PRIMARY KEY DEFAULT NEXTVAL('users_seq'),
    login    VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    name     VARCHAR(100),
    e_mail   VARCHAR(100) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE e_mail_campaign (
    id       VARCHAR(100) NOT NULL,
    e_mail   VARCHAR(100) NOT NULL,
    name     VARCHAR(100) NOT NULL,
    campaign INTEGER,
    created  TIMESTAMP DEFAULT NOW()
);

-- vim: sw=4 sts=4 ts=8 et ai syn=sql
