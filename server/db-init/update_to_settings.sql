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





CREATE TABLE settings (
  name character varying(20) PRIMARY KEY, --name of setting
  value integer -- although an integer can store strings.
);
-- Basic settings not alterable in different configs.
INSERT INTO settings (name,value) VALUES('version',1); --version of this configuration
INSERT INTO settings (name,value) VALUES('token_key', 'newTokenKey'); --key used to encrypt/decrypt cookie token (new value set during db create)
INSERT INTO settings (name,value) SELECT 'repeat_days' AS name, repeat_days AS value FROM config LIMIT 1;
INSERT INTO settings (name,value) SELECT 'year_end' AS name, year_end AS value FROM config LIMIT 1;
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

UPDATE user SET password = null;  --we are changing password algorithmn so we will have to clear them all out.