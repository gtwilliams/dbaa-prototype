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

CREATE SEQUENCE directory_seq;

CREATE TABLE directory (
    id       INTEGER NOT NULL PRIMARY KEY DEFAULT NEXTVAL('directory_seq'),
    name     VARCHAR(100) NOT NULL,
    acbl     VARCHAR(7), -- player number
    e_mail   VARCHAR(100) NOT NULL
);

CREATE TABLE phone_number (
    directory INTEGER NOT NULL FOREIGN KEY REFERENCES directory(id),
    type      VARCHAR(30) NOT NULL DEFAULT 'Cell',
    number    VARCHAR(10)
);

CREATE INDEX phone_number_directory ON phone_number(directory);

CREATE TABLE phone_number_types (
    sort INTEGER NOT NULL DEFAULT 0,
    name VARCHAR(30)
);

INSERT INTO phone_number_types (sort, name) VALUES (1, 'Home');
INSERT INTO phone_number_types (sort, name) VALUES (2, 'Cell');

-- vim: sw=4 sts=4 ts=8 et ai syn=sql