-- 	Copyright (c) 2009,2010 money Chandler
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


-- add version to code table as we can now edit it online and need to check that it hasn't been altered by someone else

BEGIN IMMEDIATE;

ALTER TABLE code ADD COLUMN version bigint DEFAULT 1 NOT NULL;

UPDATE config SET version = version + 1, db_version = 2;

COMMIT;

