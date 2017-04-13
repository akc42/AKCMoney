--Copyright (c) 2015 money Chandler
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


BEGIN IMMEDIATE;

ALTER TABLE repeat ADD priority integer;

UPDATE repeat SET priority = 0 WHERE rkey = 0;
UPDATE repeat SET priority = 1 WHERE rkey = 1;
UPDATE repeat SET priority = 2 WHERE rkey = 2;
UPDATE repeat SET priority = 4 WHERE rkey = 3;
UPDATE repeat SET priority = 5 WHERE rkey = 4;
UPDATE repeat SET priority = 6 WHERE rkey = 5;
UPDATE repeat SET priority = 7 WHERE rkey = 6;

INSERT INTO repeat VALUES (7, '4 Weekly',3);  --New Repeat Period


UPDATE config SET version = version + 1, db_version = 5;

COMMIT;