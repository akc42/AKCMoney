-- 	Copyright (c) 2020 Alan Chandler
--  This file is part of AKCMoney.

--    AKCMoney is free software: you can redistribute it and/or modify
--    it under the terms of the GNU General Public License as published by
--    the Free Software Foundation, either version 3 of the License, or
--    (at your option) any later version.

--    AKCMoney is distributed in the hope that it will be useful,
--    but WITHOUT ANY WARRANTY; without even the implied warranty of
--    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
--    GNU General Public License for more details.

--    You should have received a copy of the GNU General Public License
--    along with AKCMoney (file COPYING.txt).  If not, see <http://www.gnu.org/licenses/>.

--CREATE TABLE config (
--    version integer DEFAULT 1 NOT NULL,
--    db_version integer, -- version of the database
--    repeat_days integer, -- number of days ahead that the repeated transactions are replicated (with the lower date transactions set to no repeat)
--    demo boolean DEFAULT 0 NOT NULL, -- if true(1) this is a demo account and a warning is printed on each page
--    year_end character varying, --last day of accounting year in MMDD form (this allows numeric comparisons to work)
--    creation_date DEFAULT (strftime('%s','now')) NOT NULL -- record when the database is installed
--);

--INSERT INTO config(db_version,repeat_days,year_end) 
--            VALUES (4, 90,'1231');



BEGIN TRANSACTION;

CREATE TABLE settings (
  name character varying(20) PRIMARY KEY, --name of setting
  value integer -- although an integer can store strings.
);
-- Basic settings not alterable in different configs.
INSERT INTO settings (name,value) VALUES('version',1); --version of this configuration
INSERT INTO settings (name,value) VALUES('token_key', 'newTokenKey'); --key used to encrypt/decrypt cookie token (new value set during db create)
INSERT INTO settings (name,value) SELECT 'repeat_days' AS name, CAST(repeat_days AS Integer) AS value FROM config LIMIT 1;
INSERT INTO settings (name,value) SELECT 'year_end' AS name, CAST(year_end AS INTEGER) AS value FROM config LIMIT 1;
INSERT INTO settings (name,value) VALUES('client_log','logger'); --if none empty string should specify colon separated function areas client should log or 'all' for every thing.
INSERT INTO settings (name,value) VALUES('client_uid', 0); --if non zero this uid logs everything
INSERT INTO settings (name,value) VALUES('token_expires', 720); --hours until expire for standard logged on token
INSERT INTO settings (name,value) VALUES('min_pass_len', 6); --minimum password length
INSERT INTO settings (name,value) VALUES('dwell_time', 2000); --time to elapse before new urls get to be pushed to the history stack (rather than update)
INSERT INTO settings (name,value) VALUES('webmaster', 'developer@example.com');  --site web master NOTE change once database created to correct person
INSERT INTO settings (name,value) VALUES('server_port', 2010); --api server port (needs to match what nginx conf says);
INSERT INTO settings (name,value) VALUES('track_cookie', 'm_user'); --cookie name for tracking cookie
INSERT INTO settings (name,value) VALUES('auth_cookie', 'm_auth'); --authcookie name

DROP TABLE config;

CREATE TABLE old_capability (
    uid integer,
    domain character,
    primary key (uid,domain)
);
INSERT INTO old_capability (uid, domain) SELECT uid,domain from capability;

CREATE TABLE old_xaction (
    id integer PRIMARY KEY,
    date bigint DEFAULT (strftime('%s','now')) NOT NULL, -- date of transaction
    amount bigint DEFAULT 0 NOT NULL, -- amount of transaction (times 100 to make it an integer) of transaction in currency below
    currency character(3) NOT NULL REFERENCES currency(name),   -- currency transaction was conducted in
    src character varying , -- source account (debits this account when amount is +ve [the normal case])
    srcamount bigint,                 -- if the source account is a different currency then this is the amount (same sign as) in that currency
    srcclear boolean DEFAULT 0 NOT NULL,  -- the amount is cleared in the source account
    srccode integer REFERENCES code (id) ON UPDATE CASCADE ON DELETE SET NULL, -- if set, an account code to account for this transaction
    dst character varying , -- destination account (credits this account when amount is +ve [the normal case])
    dstamount bigint,                 -- if the destination account is a different currency then this is the amount in that currency
    dstclear boolean DEFAULT 0 NOT NULL, -- if the amount is cleared in the destination account
    dstcode integer REFERENCES code (id) ON UPDATE CASCADE ON DELETE SET NULL, -- if set, an account code to account for this transaction
    description character varying,      -- details of the transaction
    rno character varying,              -- reference number for the transaction
    repeat integer DEFAULT 0 NOT NULL REFERENCES repeat(rkey) -- if the transaction is repeating
);

INSERT INTO old_xaction (id, date, amount, currency, src, srcamount, srcclear, srccode, dst, dstamount, dstclear, dstcode, description, rno, repeat) SELECT id, date, amount, currency, src, srcamount, srcclear, srccode, dst, dstamount, dstclear, dstcode, description, rno, repeat FROM xaction;

CREATE TABLE old_user (
    uid integer primary key,
    name character varying UNIQUE,
    isAdmin boolean NOT NULL DEFAULT 0, 
    domain character varying, 
    account character varying 
);

INSERT INTO old_user (uid, name, isAdmin, domain, account) SELECT uid, name, isAdmin, domain, account FROM user;

CREATE TABLE old_account (
  name character varying PRIMARY KEY,    -- name of the account
  currency character(3) REFERENCES currency(name),  -- currency in which to show transactions
  balance bigint DEFAULT 0 NOT NULL, -- reconciled balance of the account 
  date bigint DEFAULT (strftime('%s','now')) NOT NULL, -- date when reconciled balance was set
  domain character varying, -- domain that account belongs to
  startdate bigint, -- if null, account only shows unreconciled transactions, if 0 transactions from start of financial year, otherwise from this date
	archived boolean DEFAULT 0 NOT NULL --indicated if account is archived (does not appear in menus except Account Manager)
);

INSERT INTO old_account (name, currency, balance, date, domain, startdate, archived) 
  SELECT name, currency, balance, date, domain, startdate, archived FROM account;


-- change collate sequence for domain (reset version whilst we are at it)
CREATE TABLE old_domain (
  name character varying PRIMARY KEY,
  description character varying
);
INSERT INTO old_domain (name, description) SELECT name, description FROM domain;

DROP TABLE domain;

CREATE TABLE domain (
  name character varying COLLATE NOCASE PRIMARY KEY,
  description character varying,
  version bigint DEFAULT 1 NOT NULL
);

INSERT INTO domain (name, description) SELECT name, description FROM old_domain;

DROP TABLE old_domain;

--change collate sequence of account (must follow domain)

DROP TABLE account;

CREATE TABLE account (
    name character varying COLLATE NOCASE PRIMARY KEY,    -- name of the account
    bversion bigint DEFAULT 1 NOT NULL,    -- this is incremented when the balance is updated to check that parallel edits are not happening
    dversion bigint DEFAULT 1 NOT NULL,    -- this is incremented when the details of the account are updated to check for parallel edits
    currency character(3) REFERENCES currency(name),  -- currency in which to show transactions
    balance bigint DEFAULT 0 NOT NULL, -- reconciled balance of the account 
    date bigint DEFAULT (strftime('%s','now')) NOT NULL, -- date when reconciled balance was set
    domain character varying COLLATE NOCASE DEFAULT NULL REFERENCES domain(name) ON UPDATE CASCADE ON DELETE SET NULL, -- domain that account belongs to
	startdate bigint, -- if null, account only shows unreconciled transactions, if 0 transactions from start of financial year, otherwise from this date
	archived boolean DEFAULT 0 NOT NULL --indicated if account is archived (does not appear in menus except Account Manager)
);

INSERT INTO account (name, currency, balance, date, domain, startdate, archived) 
  SELECT name, currency, balance, date, domain, startdate, archived FROM old_account;

DROP TABLE old_account;

--now transactions


DROP INDEX xaction_idx_dst;
DROP INDEX xaction_idx_src;
DROP INDEX xaction_idx_scode;
DROP INDEX xaction_idx_dcode;
DROP INDEX xaction_idx_date;
DROP TABLE xaction;

CREATE TABLE xaction (
    id integer PRIMARY KEY,
    date bigint DEFAULT (strftime('%s','now')) NOT NULL, -- date of transaction
    version bigint DEFAULT 1 NOT NULL,   -- version of transaction, used to check for parallel updates
    amount bigint DEFAULT 0 NOT NULL, -- amount of transaction (times 100 to make it an integer) of transaction in currency below
    currency character(3) NOT NULL REFERENCES currency(name),   -- currency transaction was conducted in
    src character varying COLLATE NOCASE REFERENCES account(name) ON UPDATE CASCADE ON DELETE SET NULL, -- source account (debits this account when amount is +ve [the normal case])
    srcamount bigint,                 -- if the source account is a different currency then this is the amount (same sign as) in that currency
    srcclear boolean DEFAULT 0 NOT NULL,  -- the amount is cleared in the source account
    srccode integer REFERENCES code (id) ON UPDATE CASCADE ON DELETE SET NULL, -- if set, an account code to account for this transaction
    dst character varying COLLATE NOCASE REFERENCES account(name) ON UPDATE CASCADE ON DELETE SET NULL, -- destination account (credits this account when amount is +ve [the normal case])
    dstamount bigint,                 -- if the destination account is a different currency then this is the amount in that currency
    dstclear boolean DEFAULT 0 NOT NULL, -- if the amount is cleared in the destination account
    dstcode integer REFERENCES code (id) ON UPDATE CASCADE ON DELETE SET NULL, -- if set, an account code to account for this transaction
    description character varying,      -- details of the transaction
    rno character varying,              -- reference number for the transaction
    repeat integer DEFAULT 0 NOT NULL REFERENCES repeat(rkey) -- if the transaction is repeating
);


CREATE INDEX xaction_idx_dst ON xaction (dst);
CREATE INDEX xaction_idx_src ON xaction (src);
CREATE INDEX xaction_idx_scode ON xaction(srccode);
CREATE INDEX xaction_idx_dcode ON xaction(dstcode);
CREATE INDEX xaction_idx_date ON xaction(date);

INSERT INTO xaction (id, date, amount, currency, src, srcamount, srcclear, srccode, dst, dstamount, dstclear, dstcode, description, rno, repeat) SELECT id, date, amount, currency, src, srcamount, srcclear, srccode, dst, dstamount, dstclear, dstcode, description, rno, repeat FROM old_xaction;

DROP TABLE old_xaction;

DROP INDEX user_idx_name;
DROP TABLE user;

CREATE TABLE user (
    uid integer primary key,
    name character varying COLLATE NOCASE UNIQUE ,
    version bigint DEFAULT 1 NOT NULL, --version of this record
    password character varying, -- bcrypt hash of password
    isAdmin boolean NOT NULL DEFAULT 0,  -- if admin has capability of everything
    domain character varying  REFERENCES domain(name) ON UPDATE CASCADE ON DELETE SET NULL, --default domain to use for accounting
    account character varying REFERENCES account(name) ON UPDATE CASCADE ON DELETE SET NULL-- initial account to use when displaying
);

CREATE INDEX user_idx_name ON user(name);
INSERT INTO user (uid, name, isAdmin, domain, account) SELECT uid, name, isAdmin, domain, account FROM old_user;

DROP TABLE old_user;

DROP INDEX capability_idx_uid;
DROP TABLE capability;


CREATE TABLE capability (
    uid integer REFERENCES user(uid) ON UPDATE CASCADE ON DELETE CASCADE,
    domain character COLLATE NOCASE REFERENCES domain(name) ON UPDATE CASCADE ON DELETE CASCADE,
    primary key (uid,domain)
);

CREATE INDEX capability_idx_uid ON capability(uid);

INSERT INTO capability (uid, domain) SELECT uid,domain from old_capability;

DROP TABLE old_capability;

CREATE TABLE priority (
    uid integer REFERENCES user(uid) ON UPDATE CASCADE ON DELETE CASCADE,
    domain character varying COLLATE NOCASE REFERENCES domain(name) ON UPDATE CASCADE ON DELETE CASCADE,
    account character varying COLLATE NOCASE REFERENCES account(name) ON UPDATE CASCADE ON DELETE CASCADE,
    sort smallint NOT NULL, --a sort order (lowest first) for account in list for this user when using this domain
    PRIMARY KEY (uid,domain,account)
);

CREATE INDEX priority_idx_account ON priority(account);
CREATE INDEX priority_idx_uid_domain ON priority(uid,domain);

CREATE TABLE old_login_log (
  lid integer primary key,
  time bigint,
  ipaddress character varying,
  username character varying,
  isSuccess boolean
);

INSERT INTO old_login_log (lid, time, ipaddress, username, isSuccess) SELECT lid, time,ipaddress, username, isSuccess FROM login_log;

DROP TABLE login_log;

CREATE TABLE login_log (
    lid integer primary key,
    time bigint DEFAULT (strftime('%s','now')) NOT NULL,
    ipaddress character varying, --ip address of login attempt
    track_uid character varying, --track uid
    track_ip character varying,
    username character varying COLLATE NOCASE,
    isSuccess boolean NOT NULL
);
INSERT INTO login_log (lid, time, ipaddress, username, isSuccess) SELECT lid, time,ipaddress, username, isSuccess FROM old_login_log;

DROP TABLE old_login_log;

--get rid of any negative amounts

UPDATE xaction SET amount = ABS(amount), dst = src, dstamount = srcamount, dstclear = srcclear, dstcode = srccode,
                      src = dst, srcamount = dstamount, srcclear = dstclear, srccode = dstcode WHERE amount < 0;

COMMIT;