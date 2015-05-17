-- Copyright (c) 2015 Garry T. Williams

DROP TABLE e_mail_campaign;
DROP TABLE phone_number;
DROP TABLE phone_number_types;
DROP TABLE directory;
DROP TABLE users;

CREATE SEQUENCE users_seq;

CREATE TABLE users (
    id         INTEGER NOT NULL PRIMARY KEY DEFAULT NEXTVAL('users_seq'),
    e_mail     VARCHAR(100) NOT NULL,
    password   VARCHAR(100) NOT NULL,
    first_name VARCHAR(100),
    last_name  VARCHAR(100),
    is_admin   BOOLEAN DEFAULT FALSE,
    created    TIMESTAMP DEFAULT NOW()
);
ALTER SEQUENCE users_seq OWNED BY users.id;

CREATE TABLE e_mail_campaign (
    id       VARCHAR(100) NOT NULL,
    e_mail   VARCHAR(100) NOT NULL,
    name     VARCHAR(100) NOT NULL,
    campaign INTEGER,
    created  TIMESTAMP DEFAULT NOW()
);

CREATE SEQUENCE directory_seq;

CREATE TABLE directory (
    id         INTEGER NOT NULL PRIMARY KEY DEFAULT NEXTVAL('directory_seq'),
    first_name VARCHAR(100) NOT NULL,
    last_name  VARCHAR(100) NOT NULL,
    acbl       VARCHAR(7), -- player number
    e_mail     VARCHAR(100) NOT NULL
);
ALTER SEQUENCE directory_seq OWNED BY directory.id;

CREATE TABLE phone_number (
    directory INTEGER NOT NULL REFERENCES directory(id),
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
INSERT INTO phone_number_types (sort, name) VALUES (3, 'Work');

-- vim: sw=4 sts=4 ts=8 et ai syn=sql
